document.addEventListener('DOMContentLoaded', () => {
  const masterToggle = document.getElementById('masterToggle');
  const statusEl     = document.getElementById('status');
  const tabList      = document.getElementById('tabList');
  const pairBtn      = document.getElementById('pairBtn');
  const pairHint     = document.getElementById('pairHint');
  const pairList     = document.getElementById('pairList');
  const segmentBtns  = document.querySelectorAll('.segment-btn');
  const views = {
    global:   document.getElementById('view-global'),
    targeted: document.getElementById('view-targeted')
  };

  // ── Initialize UI from persisted state ──────────────────────────────────
  chrome.storage.local.get(['isEnabled', 'syncMode', 'pairs'], (data) => {
    setEnabled(data.isEnabled !== false);
    setMode(data.syncMode || 'global', false);
    renderTabList();
    renderPairList(data.pairs || []);
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
      tabList.replaceChildren();
      if (!tabs || tabs.length === 0) {
        tabList.append(emptyItem('No tabs found.'));
        return;
      }
      tabs.forEach(tab => {
        const li = document.createElement('li');
        const label = document.createElement('label');
        label.className = 'tab-label';

        const box = document.createElement('input');
        box.type = 'checkbox';
        box.className = 'tab-checkbox';
        box.value = String(tab.id);
        label.append(box);

        if (tab.favIconUrl) {
          const img = document.createElement('img');
          img.className = 'tab-favicon';
          img.alt = '';
          img.src = tab.favIconUrl;
          img.addEventListener('error', () => { img.style.display = 'none'; });
          label.append(img);
        }

        const title = document.createElement('span');
        title.className = 'tab-title';
        title.textContent = tab.title || tab.url || 'Untitled';
        label.append(title);

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
    pairBtn.textContent = count >= 2 ? `Link ${count} tabs` : 'Link tabs';
    pairHint.hidden = count >= 2;
  }

  // ── Render active sync groups ────────────────────────────────────────────
  function renderPairList(pairs) {
    // Sanitize corrupted/legacy data structures
    const validPairs = pairs.filter(pair => pair && Array.isArray(pair.tabs));
    if (validPairs.length !== pairs.length) {
      pairs = validPairs;
      chrome.storage.local.set({ pairs });
    }

    pairList.replaceChildren();

    if (pairs.length === 0) {
      pairList.append(emptyItem('No groups yet.'));
      return;
    }

    pairs.forEach((pair, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="pair-row">
          <div class="pair-main">
            <span class="pair-name" contenteditable="plaintext-only" spellcheck="false" role="textbox" aria-label="Group name" data-index="${index}">${escapeHtml(pair.name)}</span>
            <span class="tab-count">${pair.tabs.length} tabs linked</span>
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
  });

  // ── Helpers ──────────────────────────────────────────────────────────────
  function emptyItem(text) {
    const li = document.createElement('li');
    li.className = 'empty-state';
    li.textContent = text;
    return li;
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
});
