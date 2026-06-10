// Route scroll events strictly within defined pairs or globally across all tabs
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCROLL_EVENT' && sender.tab) {
    const sourceTabId = sender.tab.id;

    chrome.storage.local.get(['isEnabled', 'syncMode', 'pairs', 'globalTabs'], (data) => {
      if (data.isEnabled === false) return;

      const mode = data.syncMode || 'global';

      if (mode === 'global') {
        // Global mode: sync with all registered tabs
        let globalTabs = data.globalTabs || [];
        if (!globalTabs.includes(sourceTabId)) {
          globalTabs.push(sourceTabId);
          chrome.storage.local.set({ globalTabs });
        }

        globalTabs.forEach(targetId => {
          if (targetId !== sourceTabId) {
            chrome.tabs.sendMessage(targetId, {
              type: 'PERFORM_SCROLL',
              scrollPercentage: message.scrollPercentage
            }).catch(() => {});
          }
        });
      } else {
        // Targeted mode: sync only within matched groups
        const pairs = data.pairs || [];

        // Fail-safe: ensure p exists and p.tabs is a valid array
        const activePair = pairs.find(p =>
          p && p.tabs && Array.isArray(p.tabs) && p.tabs.includes(sourceTabId)
        );

        if (activePair) {
          activePair.tabs.forEach(targetId => {
            if (targetId !== sourceTabId) {
              chrome.tabs.sendMessage(targetId, {
                type: 'PERFORM_SCROLL',
                scrollPercentage: message.scrollPercentage
              }).catch(() => {});
            }
          });
        }
      }
    });
  }
});

// Cleanup closed tabs from all groups and global list
chrome.tabs.onRemoved.addListener((closedTabId) => {
  chrome.storage.local.get(['pairs', 'globalTabs'], (data) => {
    let requiresUpdate = false;
    const updatePayload = {};

    // Cleanup global tabs list
    if (data.globalTabs && data.globalTabs.includes(closedTabId)) {
      updatePayload.globalTabs = data.globalTabs.filter(id => id !== closedTabId);
      requiresUpdate = true;
    }

    // Cleanup paired groups — remove empty or singleton groups
    if (data.pairs) {
      const updatedPairs = data.pairs.map(p => {
        if (p.tabs.includes(closedTabId)) {
          requiresUpdate = true;
          return { ...p, tabs: p.tabs.filter(id => id !== closedTabId) };
        }
        return p;
      }).filter(p => p.tabs.length >= 2);

      if (requiresUpdate) {
        updatePayload.pairs = updatedPairs;
      }
    }

    if (requiresUpdate) {
      chrome.storage.local.set(updatePayload);
    }
  });
});
