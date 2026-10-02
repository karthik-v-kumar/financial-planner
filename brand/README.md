# Financial Plan — new app icon ("Compound")

Instructions for Claude Code: replace the app's existing icon and header logo (white zig-zag line with a red square) with these assets everywhere they appear.

## Design spec
- Tile: pure black `#000000` (not off-black)
- Curve: white `#FFFFFF`, rounded caps
- Endpoint dot: red `#E8432A`
- Baseline: grey `#3A3A3A`

## Files and where they go

| File | Use |
|---|---|
| `FinancialPlan.icns` | macOS app icon (Electron `icon`, Tauri `bundle.icon`, Xcode, or Finder › Get Info) |
| `FinancialPlan.iconset/` | Source PNGs, in case the icon needs to be rebuilt: `iconutil -c icns FinancialPlan.iconset` |
| `app-icon-macos.svg` / `app-icon-macos-1024.png` | Master icon with Apple's macOS padding (824px tile on a 1024 canvas, transparent corners) |
| `app-icon-fullbleed.svg` / `app-icon-fullbleed-1024.png` | Square, edge-to-edge version for iOS, PWA, or anything that rounds the corners itself |
| `app-icon-rounded.svg` | Rounded tile with no padding (in-app use, about screens) |
| `logo-mark.svg` | **Header logo**: curve and dot only, no tile. The curve uses `currentColor`, so set `color: #fff` on the dark header. Replaces the old zig-zag logo next to "FINANCIAL PLAN". |
| `web/favicon.ico`, `favicon.svg`, `favicon-16/32.png` | Browser tab icon |
| `web/apple-touch-icon.png` (180) | `<link rel="apple-touch-icon">` / Safari "Add to Dock" |
| `web/icon-192.png`, `web/icon-512.png` | PWA `manifest.json` icons |

## Suggested HTML head
```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

## Steps
1. Find and replace every existing icon or logo asset (search the code for the old icon file names, `favicon`, `icon`, `manifest`, and the header logo component).
2. Swap in the matching files above, and update the manifest and build config paths.
3. Rebuild. On macOS, if the dock still shows the old icon, run `killall Dock` (the system caches icons).
