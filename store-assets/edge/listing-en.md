# Sync Scroll Pro – Edge-Store-Eintrag

Reihenfolge wie im Partner Center. Alles in den Kästen kann 1:1 kopiert werden.

**Stand:** Version **3.1.0** (Split View, Auto-Sync, Edge-getestet). Das Paket entspricht dem Stand in `master` (gebaut mit dem Paket-Skript der Release-Pipeline).

**Dateien** (Pfade relativ zum Extension-Ordner, nichts liegt doppelt):
- Paket: `store-assets\edge\SyncScroll-3.1.0.zip`
- Logo (128x128): `icons\icon128.png`
- Screenshots (4 x 1280x800): `store-assets\screenshot_1_global_mode.png`, `screenshot_2_targeted_mode.png`, `screenshot_3_split_view.png`, `screenshot_4_light_and_dark.png`
- Promo-Kacheln: `store-assets\promo_small_440x280.png` (klein) und `store-assets\promo_marquee_1400x560.png` (groß)

Die Bilder sind neu erzeugt, mit der echten Extension in Edge aufgenommen und zeigen das aktuelle Design.

**Stand der Einreichung (24.11.2026)**
1. **In `master`:** Der Pull Request #2 ist gemergt, Repo und ZIP stimmen überein. Die Datenschutz-URL zeigt damit die aktuelle Erklärung (mit `scripting`, Host-Zugriff und `autoSplit`).
2. **Release-Lauf für 3.1.0:** Chrome-Upload fehlgeschlagen (`invalid_client`: der OAuth-Client der Pipeline ist ungültig), Edge übersprungen (noch keine Produkt-ID hinterlegt). Veröffentlicht wurde also nirgends.
3. **Chrome:** Das ZIP von Hand im Developer Dashboard hochladen, oder den Zugang reparieren und den Workflow „Store Release“ neu starten.
4. **Edge:** Erst-Einreichung von Hand im Partner Center. Danach die Produkt-ID in den Secrets hinterlegen, damit die Pipeline künftig auch dort veröffentlicht.

**Chrome Web Store:** Dasselbe ZIP und dieselben vier Screenshots und Promo-Bilder passen auch dort (Manifest V3, 3.1.0 ist höher als die veröffentlichte 3.0.0). Die Chrome-Texte sollten wie unten aktualisiert werden. Im alten Text steht fälschlich, Gruppen blieben nach einem Browser-Neustart erhalten, und er kennt weder Split View noch die neuen Bezeichnungen „All tabs“ und „Selected tabs“.

## Store listing (Sprache: English)

**Name** (kommt aus dem Paket, nicht eintragen)
```
Sync Scroll Pro - Tab Scroll Synchronizer
```

**Short description** (max. 132 Zeichen, kommt ebenfalls aus dem Paket: 129 Zeichen)
```
Synchronize scrolling across multiple tabs – globally or in custom groups. Ideal for split-screen comparison & side-by-side view.
```

**Description**
```
Scroll in one browser tab and the others follow. Sync Scroll Pro synchronizes scrolling across tabs, so you can compare web pages, documents or translations side by side without scrolling each one by hand.

WHAT IT'S FOR
• Compare two versions of a document, or a page before and after a change
• Read a translation next to the original
• Review code, specs or documentation in two tabs
• Compare prices, products or layouts
• Keep research tabs aligned while you read

HOW IT WORKS
1. Click the extension icon and turn the switch on.
2. "All tabs": every open tab scrolls together, with nothing to set up.
3. "Selected tabs": tick two or more tabs and click "Link tabs" to sync only those.
4. Scroll in one tab - the others follow.

FEATURES
• Split view support: tabs shown side by side are suggested at the top of the popup. Link them with one click, or turn on "Auto-sync split view" so every split view scrolls together by itself.
• Two-way sync: scroll in any linked tab and all the others follow.
• Named groups: link only the tabs you choose, rename a group by clicking its name, delete it with one click.
• Works on app-style pages too, where a panel inside the page scrolls instead of the whole page.
• Master switch: pause everything instantly and go back to independent scrolling.
• Automatic cleanup: closed tabs are removed from their groups.
• Light and dark theme that follows your system.
• Your mode, master switch and split view option are remembered. Groups are cleared when the browser restarts.

PRIVACY AND PERMISSIONS
Everything runs locally on your device. No accounts, no tracking, no network requests, no browsing history.
• tabs - list your open tabs in the popup and pass scroll positions between linked tabs
• storage - remember your settings and groups on this device
• Access to all sites - a page's scroll position can only be read and applied from inside that page. The script reads nothing else. It is also started in tabs that are already open right after an install or update, so you don't have to reload them.

GOOD TO KNOW
Browsers don't allow extensions on their own pages (such as the new tab page or settings) or on the extension store. Those tabs are greyed out in the popup and can't be linked.
```

**Category:** Productivity

**Search terms** (max. 7, je max. 30 Zeichen, zusammen max. 21 Wörter; jeder Begriff ist ein eigener Eintrag)
```
sync scroll
synchronized scrolling
scroll tabs together
compare tabs
split view sync
side by side view
compare documents
```

## Properties

| Feld | Wert |
|---|---|
| Privacy policy URL | `https://github.com/exUs541/SyncScroll/blob/master/privacy-policy.html` (zeigt den HTML-Quelltext, nicht die gerenderte Seite; besser wäre eine `PRIVACY_POLICY.md` mit demselben Text) |
| Website | `https://github.com/exUs541/SyncScroll` |
| Support | `https://github.com/exUs541/SyncScroll/issues` |
| Mature content / remote code | Nein / Nein |

## Privacy practices (Berechtigungs-Begründungen, je max. 1000 Zeichen)

**Single purpose description**
```
Sync Scroll Pro has one purpose: it synchronizes the scroll position across the user's browser tabs. When the user scrolls in one tab, the other linked tabs scroll to the same relative position, so that documents, page versions or translations can be compared side by side. The user chooses which tabs take part: all open tabs, a named group of selected tabs, or the two tabs of a split view. Everything the extension does (the popup with the switch and the group list, the split view suggestion, the background script that passes scroll positions between tabs, and the content script that reads and applies the scroll position) serves this single purpose. It does not collect data, show ads, change page content or make network requests.
```

**tabs justification**
```
The tabs permission is needed for two things. 1) The popup lists the tabs of the current window (title, address, icon) so the user can pick which tabs to link, and it shows which tabs are side by side in a split view. The address is only used to show the site name and to grey out pages where browsers block extensions. 2) The background service worker uses tab IDs to pass a scroll position from the tab the user is scrolling to the other linked tabs, and to remove closed tabs from groups. Titles, addresses and icons are only displayed in the popup. They are never stored, logged or sent anywhere.
```

**storage justification**
```
The storage permission (chrome.storage.local) keeps the user's settings on their own device: the master switch (on or off), the sync mode (all tabs or selected tabs), the "Auto-sync split view" option, and the linked groups (a group name plus the numeric IDs of its tabs). Without it these settings would be lost whenever the popup closes or the browser restarts. Nothing is stored in the cloud, no sync storage is used, and no personal data, page content, titles or addresses are saved. Groups are cleaned up automatically when tabs are closed and when the browser restarts.
```

**scripting justification**
```
The scripting permission is used in exactly one place. Right after the extension is installed or updated, the service worker calls chrome.scripting.executeScript once for each already-open web page (http, https, file) to start the extension's own bundled file content.js. Without this, tabs that were open before the install or update would not scroll in sync until the user reloaded each of them. Only content.js from the extension package is injected. No code is downloaded or built from strings, this step reads no page content, and it is not used at any other time.
```

**Host permission justification**
```
Access to all sites (<all_urls>) is needed because the user can sync any website: documentation, documents, translations, shops. A page's scroll position can only be read and applied from inside that page, so the content script runs on every page. The scripting permission also needs host access to start that script in tabs that were already open after an install or update. The script only reads the scroll position and the size of the scrollable area, and scrolls the page when the extension tells it to. It does not read, change or send page content, form fields, cookies or addresses, and the extension makes no network requests. Browsers block extensions on their own pages and on the extension stores.
```

**Are you using remote code?** Nein (No). Der gesamte Code liegt im Paket, es gibt kein `eval`, keine nachgeladenen Skripte und keine Netzwerkzugriffe (im Code geprüft). Eine Begründung ist nicht nötig.

## Notes for certification

```
No account or login is needed. Settings and groups are stored locally with chrome.storage; the extension makes no network requests and loads no remote code.

How to test (about one minute)
1. Open two or more tabs with long ordinary web pages, for example two Wikipedia articles. (Browsers do not allow extensions on edge:// pages or on the add-on store, so use normal websites.)
2. Click the extension icon. "All tabs" is selected and the master switch is on. Scroll in one tab - the other tabs scroll to the same relative position.
3. Choose "Selected tabs", tick two tabs and click "Link tabs". Now only those two tabs follow each other; a third tab stays where it is.
4. Optional, split view: show two tabs side by side with the browser's split screen feature. The popup lists the pair under "Split view". Click "Link", or turn on "Auto-sync split view". Scrolling one pane now scrolls the other. Without split view support the section stays hidden and everything else works as before.

Single purpose: synchronize the scroll position across the user's browser tabs.

Permissions
- tabs: list the open tabs in the popup (title, address, icon), detect which tabs are shown side by side in a split view, and send scroll positions between the linked tabs. Nothing is stored or sent out.
- storage: keep the master switch, the mode, the "Auto-sync split view" option and the linked groups on this device.
- scripting and host access (<all_urls>): right after an install or update the extension starts its own bundled scroll script in tabs that are already open, so users do not have to reload them. No remote code is loaded and no page content is read.
- Content script on all pages: the scroll position of a page can only be read and applied from inside that page. The script reads nothing else and sends nothing out.
```
