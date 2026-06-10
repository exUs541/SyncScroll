document.addEventListener('DOMContentLoaded', () => {
  const masterToggle = document.getElementById('masterToggle');
  const tabList      = document.getElementById('tabList');
  const pairBtn      = document.getElementById('pairBtn');
  const pairList     = document.getElementById('pairList');
  const segmentBtns  = document.querySelectorAll('.segment-btn');
  const views = {
    global:   document.getElementById('view-global'),
    targeted: document.getElementById('view-targeted')
  };

  // ── Initialize UI from persisted state ──────────────────────────────────
  chrome.storage.local.get(['isEnabled', 'syncMode', 'pairs'], (data) => {
    masterToggle.checked = data.isEnabled !== false;
    setMode(data.syncMode || 'global', false);
    renderTabList();
    renderPairList(data.pairs || []);
  });

  // ── Master toggle ────────────────────────────────────────────────────────
  masterToggle.addEventListener('change', (e) => {
    chrome.storage.local.set({ isEnabled: e.target.checked });
  });

  // ── Mode switching ───────────────────────────────────────────────────────
  segmentBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mode = e.currentTarget.getAttribute('data-mode');
      setMode(mode, true);
    });
  });

  function setMode(mode, persist) {
    segmentBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
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
    const selectedTabIds = Array.from(checkedBoxes).map(cb => parseInt(cb.value));

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

  // ── Render open tabs list ────────────────────────────────────────────────
  function renderTabList() {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      tabList.innerHTML = '';
      if (tabs.length === 0) {
        tabList.innerHTML = '<li class="empty-state">No tabs found.</li>';
        return;
      }
      tabs.forEach(tab => {
        const li = document.createElement('li');
        const favicon = tab.favIconUrl
          ? `<img class="tab-favicon" src="${tab.favIconUrl}" onerror="this.style.display='none'">`
          : '';
        li.innerHTML = `
          <label class="tab-label">
            <input type="checkbox" class="tab-checkbox" value="${tab.id}">
            ${favicon}
            <span class="tab-title">${escapeHtml(tab.title || tab.url || 'Untitled')}</span>
          </label>
        `;
        tabList.appendChild(li);
      });

      // Update button state when selections change
      tabList.addEventListener('change', updatePairButton);
    });
  }

  function updatePairButton() {
    const count = document.querySelectorAll('.tab-checkbox:checked').length;
    pairBtn.disabled = count < 2;
    pairBtn.textContent = count >= 2
      ? `Create Sync Group (${count} tabs)`
      : 'Create Sync Group';
  }

  // ── Render active sync groups ────────────────────────────────────────────
  function renderPairList(pairs) {
    // Sanitize corrupted/legacy data structures
    const validPairs = pairs.filter(pair => pair && Array.isArray(pair.tabs));
    if (validPairs.length !== pairs.length) {
      pairs = validPairs;
      chrome.storage.local.set({ pairs });
    }

    pairList.innerHTML = '';

    if (pairs.length === 0) {
      pairList.innerHTML = '<li class="empty-state">No active groups. Select 2+ tabs above.</li>';
      return;
    }

    pairs.forEach((pair, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="pair-row">
          <div class="pair-top">
            <span class="pair-name" contenteditable="true" data-index="${index}">${escapeHtml(pair.name)}</span>
            <button class="icon-btn delete-btn" data-index="${index}" title="Delete Group">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5zM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.5a.5.5 0 0 0 0 1H3v9.5A1.5 1.5 0 0 0 4.5 14h7A1.5 1.5 0 0 0 13 12.5V3.5h.5a.5.5 0 0 0 0-1H11z"/>
              </svg>
            </button>
          </div>
          <div><span class="tab-count">${pair.tabs.length} tabs linked</span></div>
        </div>
      `;
      pairList.appendChild(li);
    });

    // Delete group
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-index'));
        pairs.splice(idx, 1);
        chrome.storage.local.set({ pairs });
      });
    });

    // Inline rename
    document.querySelectorAll('.pair-name').forEach(span => {
      span.addEventListener('blur', (e) => {
        const idx     = parseInt(e.target.getAttribute('data-index'));
        const newName = e.target.innerText.trim();
        if (newName && newName !== pairs[idx].name) {
          pairs[idx].name = newName;
          chrome.storage.local.set({ pairs });
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
  });

  // ── Helpers ──────────────────────────────────────────────────────────────
  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
});
