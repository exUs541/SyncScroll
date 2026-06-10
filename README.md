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
| 🔄 **Bi-directional** | Scroll in any synced tab and all others follow |
| ✏️ **Rename Groups** | Click any group name to rename it inline |
| 🗑️ **Delete Groups** | Remove sync groups with one click |
| ⚡ **Master Toggle** | Disable the entire extension instantly without uninstalling |
| 💾 **Persistent State** | Groups and settings survive browser restarts |
| 🧹 **Auto Cleanup** | Closed tabs are automatically removed from all groups |

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
2. Switch to **Targeted** mode
3. Tick the tabs you want to sync (select 2 or more)
4. Click **Create Sync Group**
5. Only tabs within the same group will mirror each other

---

## 🔒 Permissions

| Permission | Reason |
|---|---|
| `tabs` | Read open tab IDs to route scroll events |
| `storage` | Persist sync groups and settings across sessions |

> No browsing history is accessed. No data leaves your browser.

---

## 🏗️ Architecture

```
scroll-sync-pro/
├── manifest.json      # Extension manifest (MV3)
├── background.js      # Service worker — routes scroll messages
├── content.js         # Injected into every page — sends/receives scroll events
├── popup.html         # Extension popup UI
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
