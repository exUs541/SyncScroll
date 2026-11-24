# Store assets – Sync Scroll Pro

Everything for the store listings of Sync Scroll Pro in one place: images and the store texts, for the Chrome Web Store and Microsoft Edge Add-ons at once. One image set serves both stores (the sizes are accepted by both). The images were captured with the real extension in Edge and show the current design.

This folder is not part of the extension package. The packager (`.github/scripts/package-extension.mjs`) skips `store-assets/`, and changes here do not start a release.

## Contents

```
store-assets/
├─ listing.md                          store texts and field values (both stores; store-only parts are marked)
├─ screenshots/                        4 × 1280×800
├─ promo-small-440x280.png             small promo tile
├─ promo-marquee-1400x560.png          large promo tile (Chrome "marquee", Edge "large")
└─ SyncScroll-<version>.zip            built package (git-ignored)
```

## Which file goes where

| Store field | File | Chrome | Edge |
|---|---|---|---|
| Extension icon 128 × 128 | `../icons/icon128.png` (inside the package) | store icon | logo |
| Screenshots | `screenshots/screenshot-1-global-mode.png`, `-2-targeted-mode`, `-3-split-view`, `-4-light-and-dark` | up to 5 | up to 6 |
| Small tile 440 × 280 | `promo-small-440x280.png` | optional | optional |
| Large tile 1400 × 560 | `promo-marquee-1400x560.png` | optional (marquee) | optional (large) |
| Package | `SyncScroll-<version>.zip` | built by the release pipeline | upload by hand the first time, pipeline afterwards |

## File naming

Files that apply to one store only carry the store in their name (`…-chrome.…` or `…-edge.…`). Everything without such a suffix is shared by both stores.
