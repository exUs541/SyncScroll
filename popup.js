document.addEventListener('DOMContentLoaded', () => {
  const masterToggle = document.getElementById('masterToggle');
  const statusEl     = document.getElementById('status');
  const tabList      = document.getElementById('tabList');
  const pairBtn      = document.getElementById('pairBtn');
  const pairLabel    = document.getElementById('pairLabel');
  const pairHint     = document.getElementById('pairHint');
  const pairList     = document.getElementById('pairList');
  const selCount     = document.getElementById('selCount');
  const groupCount   = document.getElementById('groupCount');
  const splitSection = document.getElementById('splitSection');
  const splitPairs   = document.getElementById('splitPairs');
  const autoSplitBox = document.getElementById('autoSplitToggle');
  const segmentBtns  = document.querySelectorAll('.segment-btn');
  const views = {
    global:   document.getElementById('view-global'),
    targeted: document.getElementById('view-targeted')
  };

  // Split view needs browser support (Chrome/Brave 140+: Tab.splitViewId).
  const SPLIT_NONE      = chrome.tabs.SPLIT_VIEW_ID_NONE;
  const splitSupported  = SPLIT_NONE !== undefined;

  // Current state, used to (re)draw the split view suggestions.
  let currentTabs  = [];
  let currentPairs = [];
  let autoSplit    = false;

  // ── Initialize UI from persisted state ──────────────────────────────────
  chrome.storage.local.get(['isEnabled', 'syncMode', 'pairs', 'autoSplit'], (data) => {
    autoSplit = data.autoSplit === true;
    setEnabled(data.isEnabled !== false);
    setMode(data.syncMode || 'global', false);
    renderTabList();
    renderPairList(data.pairs || []);
  });

  // ── Auto-sync split view ─────────────────────────────────────────────────
  autoSplitBox.addEventListener('change', (e) => {
    autoSplit = e.target.checked;
    chrome.storage.local.set({ autoSplit });
    renderSplit();
  });

  // ── Master toggle ────────────────────────────────────────────────────────
  masterToggle.addEventListener('change', (e) => {
    setEnabled(e.target.checked);
    chrome.storage.local.set({ isEnabled: e.target.checked });
  });

  function setEnabled(on) {
    masterToggle.checked = on;
    document.body.classList.toggle('is-off', !on);
    statusEl.textContent = on ? 'Sync is on' : 'Sync is paused';
  }

  // ── Mode switching ───────────────────────────────────────────────────────
  segmentBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      setMode(e.currentTarget.getAttribute('data-mode'), true);
    });
  });

  function setMode(mode, persist) {
    segmentBtns.forEach(btn => {
      const active = btn.getAttribute('data-mode') === mode;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    Object.keys(views).forEach(key => {
      views[key].classList.toggle('active', key === mode);
    });
    if (persist) {
      chrome.storage.local.set({ syncMode: mode });
    }
  }

  // ── Create sync group from selected tabs ─────────────────────────────────
  pairBtn.addEventListener('click', () => {
    const checkedBoxes   = document.querySelectorAll('.tab-checkbox:checked');
    const selectedTabIds = Array.from(checkedBoxes).map(cb => parseInt(cb.value, 10));

    if (selectedTabIds.length < 2) return;

    chrome.storage.local.get(['pairs'], (data) => {
      const pairs = data.pairs || [];
      pairs.push({
        name: `Group ${pairs.length + 1}`,
        tabs: selectedTabIds
      });
      chrome.storage.local.set({ pairs }, () => {
        checkedBoxes.forEach(cb => { cb.checked = false; });
        updatePairButton();
      });
    });
  });

  // One listener for the lifetime of the popup (not one per render).
  tabList.addEventListener('change', updatePairButton);

  // ── Render open tabs list ────────────────────────────────────────────────
  function renderTabList() {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      // Keep the user's ticks when the list is redrawn (e.g. after a split view change).
      const ticked = new Set(Array.from(document.querySelectorAll('.tab-checkbox:checked')).map(cb => cb.value));

      currentTabs = tabs || [];
      renderSplit();

      tabList.replaceChildren();
      if (currentTabs.length === 0) {
        tabList.append(emptyItem('No tabs found.'));
        updatePairButton();
        return;
      }
      currentTabs.forEach(tab => {
        const li = document.createElement('li');
        const label = document.createElement('label');
        label.className = 'tab-label';

        const unsupported = isRestricted(tab.url);
        if (unsupported) li.classList.add('is-unsupported');

        const box = document.createElement('input');
        box.type = 'checkbox';
        box.className = 'tab-checkbox';
        box.value = String(tab.id);
        box.disabled = unsupported;
        box.checked = !unsupported && ticked.has(box.value);
        label.append(box);
        label.append(faviconNode(tab));

        const text = document.createElement('span');
        text.className = 'tab-text';

        const title = document.createElement('span');
        title.className = 'tab-title';
        title.textContent = tab.title || tab.url || 'Untitled';
        text.append(title);

        const host = unsupported ? restrictedReason(tab.url) : hostOf(tab.url);
        if (host) {
          const hostEl = document.createElement('span');
          hostEl.className = unsupported ? 'tab-host warn' : 'tab-host';
          hostEl.textContent = host;
          text.append(hostEl);
        }
        label.append(text);
        label.title = title.textContent;

        if (isInSplit(tab)) {
          const split = document.createElement('span');
          split.className = 'tab-split';
          split.title = 'In split view';
          split.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><rect x="1.75" y="3" width="12.5" height="10" rx="2"/><path d="M8 3v10"/></svg>';
          label.append(split);
        }

        if (tab.active) {
          const current = document.createElement('span');
          current.className = 'tab-current';
          current.textContent = 'current';
          label.append(current);
        }

        li.append(label);
        tabList.append(li);
      });
      updatePairButton();
    });
  }

  function updatePairButton() {
    const count = document.querySelectorAll('.tab-checkbox:checked').length;
    pairBtn.disabled = count < 2;
    pairLabel.textContent = count >= 2 ? `Link ${count} tabs` : 'Link tabs';
    pairHint.hidden = count >= 2;
    selCount.hidden = count === 0;
    selCount.textContent = `${count} selected`;
  }

  // ── Render active sync groups ────────────────────────────────────────────
  function renderPairList(pairs) {
    // Sanitize corrupted/legacy data structures
    const validPairs = pairs.filter(pair => pair && Array.isArray(pair.tabs));
    if (validPairs.length !== pairs.length) {
      pairs = validPairs;
      chrome.storage.local.set({ pairs });
    }

    currentPairs = pairs;
    renderSplit();

    pairList.replaceChildren();
    groupCount.hidden = pairs.length === 0;
    groupCount.textContent = String(pairs.length);

    if (pairs.length === 0) {
      pairList.append(emptyItem('No groups yet.'));
      return;
    }

    pairs.forEach((pair, index) => {
      const li = document.createElement('li');
      const n = pair.tabs.length;
      li.innerHTML = `
        <div class="pair-row">
          <span class="pair-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </span>
          <div class="pair-main">
            <span class="pair-name" contenteditable="plaintext-only" spellcheck="false" role="textbox" aria-label="Group name" data-index="${index}">${escapeHtml(pair.name)}</span>
            <span class="tab-count">${n} ${n === 1 ? 'tab' : 'tabs'} linked</span>
          </div>
          <button class="icon-btn delete-btn" data-index="${index}" title="Delete group" aria-label="Delete group ${escapeHtml(pair.name)}">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5zM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.5a.5.5 0 0 0 0 1H3v9.5A1.5 1.5 0 0 0 4.5 14h7A1.5 1.5 0 0 0 13 12.5V3.5h.5a.5.5 0 0 0 0-1H11z"/>
            </svg>
          </button>
        </div>
      `;
      pairList.appendChild(li);
    });

    // Delete group
    pairList.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
        pairs.splice(idx, 1);
        chrome.storage.local.set({ pairs });
      });
    });

    // Inline rename
    pairList.querySelectorAll('.pair-name').forEach(span => {
      span.addEventListener('blur', (e) => {
        const idx     = parseInt(e.target.getAttribute('data-index'), 10);
        const newName = e.target.innerText.trim();
        if (newName && newName !== pairs[idx].name) {
          pairs[idx].name = newName;
          chrome.storage.local.set({ pairs });
        } else {
          e.target.innerText = pairs[idx].name;
        }
      });
      span.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
      });
    });
  }

  // ── Reactive state updates ───────────────────────────────────────────────
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.pairs) renderPairList(changes.pairs.newValue || []);
    if (changes.isEnabled) setEnabled(changes.isEnabled.newValue !== false);
    if (changes.autoSplit) {
      autoSplit = changes.autoSplit.newValue === true;
      renderSplit();
    }
  });

  // A split view was opened or closed while the popup is open.
  if (splitSupported) {
    chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
      if ('splitViewId' in changeInfo) renderTabList();
    });
  }

  // ── Split view ───────────────────────────────────────────────────────────
  function isInSplit(tab) {
    return splitSupported && tab.splitViewId !== undefined && tab.splitViewId !== SPLIT_NONE;
  }

  // Tabs of the current window grouped by split view (only complete views of 2+ tabs).
  function splitViewsOf(tabs) {
    const views = new Map();
    tabs.filter(isInSplit).forEach(tab => {
      if (!views.has(tab.splitViewId)) views.set(tab.splitViewId, []);
      views.get(tab.splitViewId).push(tab);
    });
    return Array.from(views.values())
      .filter(group => group.length >= 2)
      .map(group => group.sort((a, b) => a.index - b.index));
  }

  function renderSplit() {
    splitSection.hidden = !splitSupported;
    if (!splitSupported) return;

    autoSplitBox.checked = autoSplit;
    splitPairs.replaceChildren();
    splitViewsOf(currentTabs).forEach(group => splitPairs.append(splitRow(group)));
  }

  // One suggestion: "these two tabs are in a split view" + a Link button
  // (or a note when they are already synced / cannot be synced).
  function splitRow(group) {
    const row = h('div', 'split-pair');

    const favs = h('span', 'split-favs');
    group.forEach(tab => favs.append(faviconNode(tab)));

    const text = h('span', 'split-text');
    const blocked = group.find(tab => isRestricted(tab.url));
    text.append(h('span', 'split-title', 'Split view'));
    text.append(blocked
      ? h('span', 'split-hosts warn', restrictedReason(blocked.url))
      : h('span', 'split-hosts', group.map(tab => hostOf(tab.url) || 'tab').join(' + ')));
    row.title = group.map(tab => tab.title || tab.url || 'Untitled').join('  |  ');

    row.append(favs, text);

    const linked = currentPairs.some(pair => group.every(tab => pair.tabs.includes(tab.id)));
    if (!blocked && (autoSplit || linked)) {
      row.append(h('span', 'pill', autoSplit ? 'Auto-synced' : 'Synced'));
    } else if (!blocked) {
      const btn = h('button', 'link-btn', 'Link');
      btn.type = 'button';
      btn.addEventListener('click', () => {
        chrome.storage.local.get(['pairs'], (data) => {
          const pairs = data.pairs || [];
          pairs.push({ name: 'Split view', tabs: group.map(tab => tab.id) });
          chrome.storage.local.set({ pairs });
        });
      });
      row.append(btn);
    }
    return row;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  function h(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // Pages the browser does not let extensions run on: browser-internal pages and the
  // extension stores. Scroll sync cannot work there, so they cannot be linked.
  function isRestricted(url) {
    let u;
    try { u = new URL(url); } catch { return true; }
    if (!['http:', 'https:', 'file:'].includes(u.protocol)) return true;
    return u.hostname === 'chromewebstore.google.com'
      || (u.hostname === 'chrome.google.com' && u.pathname.startsWith('/webstore'))
      || (u.hostname === 'microsoftedge.microsoft.com' && u.pathname.startsWith('/addons'));
  }

  function restrictedReason(url) {
    const host = hostOf(url);
    return /^https?:/.test(url || '') && host
      ? `${host} doesn’t allow extensions`
      : 'Browser pages can’t be synced';
  }

  function emptyItem(text) {
    const li = document.createElement('li');
    li.className = 'empty-state';
    li.textContent = text;
    return li;
  }

  // Favicon, or a neutral placeholder so rows stay aligned when a tab has none.
  function faviconNode(tab) {
    const blank = () => {
      const span = document.createElement('span');
      span.className = 'tab-favicon blank';
      return span;
    };
    // Browser-internal pages report icons like edge://theme/... that an extension page may not load.
    if (!/^(https?|data):/i.test(tab.favIconUrl || '')) return blank();
    const img = document.createElement('img');
    img.className = 'tab-favicon';
    img.alt = '';
    img.src = tab.favIconUrl;
    img.addEventListener('error', () => img.replaceWith(blank()));
    return img;
  }

  // "https://www.example.com/a" -> "example.com"; "" when there is nothing useful to show.
  function hostOf(url) {
    try {
      const u = new URL(url);
      return u.hostname.replace(/^www\./, '') || u.protocol.replace(':', '');
    } catch {
      return '';
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
});
