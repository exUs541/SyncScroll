# Scroll Sync Pro

> Synchronize scrolling across multiple browser tabs — globally or in custom groups.

![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Available-brightgreen?logo=googlechrome)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)
![Version](https://img.shields.io/badge/version-3.0.0-informational)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🌐 **Global Mode** | All open tabs scroll together automatically — zero configuration |
| 🎯 **Targeted Mode** | Create named sync groups with exactly the tabs you choose |
| 🪟 **Split View** | Tabs shown side by side are suggested right away — link them with one click |
| 🤖 **Auto-sync Split View** | Optional setting: tabs in a split view scroll together automatically, no linking needed |
| 🔄 **Bi-directional** | Scroll in any synced tab and all others follow |
| 📜 **Inner scrollers** | Also works on app-style pages where a container, not the page, scrolls |
| ✏️ **Rename Groups** | Click any group name to rename it inline |
| 🗑️ **Delete Groups** | Remove sync groups with one click |
| ⚡ **Master Toggle** | Disable the entire extension instantly without uninstalling |
| 💾 **Persistent Settings** | Mode, master toggle and the split-view setting survive browser restarts |
| 🧹 **Auto Cleanup** | Closed tabs are removed from groups; groups are cleared on browser restart (tab IDs change) |

---

## 📸 Screenshot

<!-- Add screenshot here after publishing -->

---

## 🚀 Installation

### From Chrome Web Store *(recommended)*
1. Open the [Chrome Web Store listing](#) *(link will be added after publishing)*
2. Click **Add to Chrome**
3. Done!

### Manual / Developer Install
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer Mode** (top right toggle)
4. Click **Load unpacked** and select the project folder
5. The extension icon appears in your toolbar

---

## 🎯 How to Use

### Global Mode (default)
1. Click the extension icon in your toolbar
2. Make sure the master toggle is **ON**
3. Keep **Global** selected — that's it. All tabs now scroll together.

### Targeted Mode
1. Click the extension icon
2. Switch to **Selected tabs**
3. Tick the tabs you want to sync (select 2 or more)
4. Click **Link tabs**
5. Only tabs within the same group will mirror each other

### Split View
Requires a browser with split view support (Chrome / Brave 140+).
1. Open two tabs side by side in a split view
2. Click the extension icon → **Selected tabs** — the split pair is suggested at the top, click **Link**
3. Or turn on **Auto-sync split view**: every split view scrolls together automatically, nothing to link

### Troubleshooting
- **Nothing syncs on a tab:** browsers do not let extensions run on their own pages (`chrome://`, `brave://`, new-tab page) or on the Chrome Web Store. Those tabs are greyed out in the popup and cannot be linked.
- **After updating the extension:** open tabs are picked up automatically — no page reload needed.

---

## 🔒 Permissions

| Permission | Reason |
|---|---|
| `tabs` | Read open tab IDs to route scroll events, and detect split views |
| `storage` | Persist sync groups and settings across sessions |
| `scripting` + host access (`<all_urls>`) | After an install or update, start the bundled scroll script in tabs that are already open |

> No browsing history is accessed. No data leaves your browser.

---

## 🏗️ Architecture

```
scroll-sync-pro/
├── manifest.json      # Extension manifest (MV3)
├── background.js      # Service worker — routes scroll messages, split view partners
├── content.js         # Injected into every page — sends/receives scroll events
├── popup.html         # Extension popup UI
├── popup.css          # Popup styles (system light/dark theme)
├── popup.js           # Popup logic
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

**Data flow:**
```
Tab A scrolls → content.js → background.js → content.js in Tab B → Tab B scrolls
```

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## 📄 License

[MIT](LICENSE)
