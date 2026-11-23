// Sync Scroll Pro - background service worker
//
// Receives scroll positions from content scripts and forwards them to the tabs that
// should follow:
//   • "global" mode   -> every open tab
//   • "targeted" mode -> the tabs in the same group(s), plus - when "Auto-sync split view"
//                        is on - the other tab(s) of the source tab's split view

const SETTING_KEYS = ['isEnabled', 'syncMode', 'pairs', 'autoSplit'];
const SPLIT_NONE = chrome.tabs.SPLIT_VIEW_ID_NONE !== undefined ? chrome.tabs.SPLIT_VIEW_ID_NONE : -1;

// Settings are read on every scroll event; keep them in memory until storage changes.
let settingsCache = null;
async function getSettings() {
  if (!settingsCache) settingsCache = await chrome.storage.local.get(SETTING_KEYS);
  return settingsCache;
}
chrome.storage.onChanged.addListener((_changes, area) => {
  if (area === 'local') settingsCache = null;
});

// ── Scroll routing ─────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message && message.type === 'SCROLL_EVENT' && sender.tab) {
    routeScroll(sender.tab.id, message.scrollPercentage).catch(() => {});
  }
});

async function routeScroll(sourceTabId, scrollPercentage) {
  const settings = await getSettings();
  if (settings.isEnabled === false) return;

  const targets = new Set();

  if ((settings.syncMode || 'global') === 'global') {
    // Every open tab follows - no need to have scrolled before.
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => targets.add(tab.id));
  } else {
    // Fail-safe: skip corrupted/legacy entries.
    (settings.pairs || []).forEach(pair => {
      if (pair && Array.isArray(pair.tabs) && pair.tabs.includes(sourceTabId)) {
        pair.tabs.forEach(id => targets.add(id));
      }
    });
    if (settings.autoSplit) {
      (await splitPartners(sourceTabId)).forEach(id => targets.add(id));
    }
  }

  targets.delete(sourceTabId);
  targets.forEach(targetId => {
    chrome.tabs.sendMessage(targetId, { type: 'PERFORM_SCROLL', scrollPercentage })
      .catch(() => {}); // tab has no content script (browser page, Web Store, discarded, ...)
  });
}

// The other tab(s) in the source tab's split view (empty if it is not in one, or the
// browser has no split view support).
async function splitPartners(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.splitViewId === undefined || tab.splitViewId === SPLIT_NONE) return [];
    const sameWindow = await chrome.tabs.query({ windowId: tab.windowId });
    return sameWindow
      .filter(t => t.splitViewId === tab.splitViewId && t.id !== tabId)
      .map(t => t.id);
  } catch (_) {
    return [];
  }
}

// ── Keep stored groups tidy ────────────────────────────────────────────────
// Closed tabs are removed from their groups; groups with fewer than two tabs disappear.
chrome.tabs.onRemoved.addListener(async (closedTabId) => {
  const { pairs } = await chrome.storage.local.get('pairs');
  if (!Array.isArray(pairs)) return;
  const cleaned = tidyGroups(pairs, id => id !== closedTabId);
  if (JSON.stringify(cleaned) !== JSON.stringify(pairs)) {
    chrome.storage.local.set({ pairs: cleaned });
  }
});

// Tab IDs are not stable across browser restarts, so groups from a previous session
// would point at tabs that no longer exist (or at the wrong ones). Drop them.
chrome.runtime.onStartup.addListener(async () => {
  const { pairs } = await chrome.storage.local.get('pairs');
  if (!Array.isArray(pairs)) return;
  const open = new Set((await chrome.tabs.query({})).map(tab => tab.id));
  const cleaned = tidyGroups(pairs, id => open.has(id));
  if (JSON.stringify(cleaned) !== JSON.stringify(pairs)) {
    chrome.storage.local.set({ pairs: cleaned });
  }
});

function tidyGroups(pairs, keepTab) {
  return pairs
    .filter(pair => pair && Array.isArray(pair.tabs))
    .map(pair => ({ ...pair, tabs: pair.tabs.filter(keepTab) }))
    .filter(pair => pair.tabs.length >= 2);
}

// ── Install / update ───────────────────────────────────────────────────────
// Content scripts declared in the manifest only load into tabs opened *after* the install
// or reload. Inject into the tabs that are already open so sync works immediately.
chrome.runtime.onInstalled.addListener(async () => {
  chrome.storage.local.remove('globalTabs'); // legacy key from versions that tracked "registered" tabs

  const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*', 'file:///*'] });
  tabs.forEach(tab => {
    chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] })
      .catch(() => {}); // restricted pages (Web Store, error pages, ...) cannot be scripted
  });
});
