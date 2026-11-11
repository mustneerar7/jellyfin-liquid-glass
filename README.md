# Liquid Glass for Jellyfin

An Apple TV–style redesign of the Jellyfin **web** client, built around Apple's Liquid Glass material and the Human Interface Guidelines. It's two drop-in files (a stylesheet and a small script) plus an installer. Your server, libraries, and settings are not modified.

## What it changes

- **Navigation:** a floating glass sidebar replaces the top bar. It's an icon rail that expands on hover. On phone-sized screens it becomes an iOS-style floating tab bar at the bottom.
- **Home:** a full-bleed featured banner ("Top Shelf") of your shows and movies.
  - Shows you're partway through come first.
  - Each slide has a logo, metadata, **Play / Resume** (jumps straight to your next episode), More Info, and Favorite.
  - Slides auto-advance with a progress indicator. Swipe, the arrow keys, and the hover arrows also work.
- **Show / movie pages:** a cinematic layout with full-screen backdrop art, the title logo, a prominent Play button, and round glass action buttons. Cast & crew appear as circular portraits.
- **Liquid Glass material:**
  - Translucent, blurred surfaces with light-catching rims and a specular highlight that follows the pointer.
  - Covers the sidebar, buttons, menus, dialogs, toasts, the alphabet picker, and the now-playing bar.
- **Appearance:** Dark, Light, or Automatic (follows the system). Switch it from the sidebar or from Settings → Appearance. The choice is remembered per browser.
- **Details:**
  - SF-style type scale and Apple system colors.
  - Library toolbars as glass capsules, iOS-style grouped Settings lists, and flat track lists.
  - An Apple activity indicator replaces the Material spinners.
  - Cards lift on hover.
- **Accessibility:** respects `prefers-reduced-motion` and `prefers-reduced-transparency`. Focus rings are visible, and touch targets are at least 44 px.

Everything is additive. If the script fails to load, stock Jellyfin keeps working.

## Requirements

- A Jellyfin web client using the default ("modern") layout. Developed against Jellyfin **12.4**.
- A current Firefox, Chrome/Edge or Safari. The theme uses `:has()`, `color-mix()` and `backdrop-filter`.
- Only the web client is affected. Native apps keep their own UI.

## Install

```sh
git clone https://github.com/mustneerar7/jellyfin-liquid-glass.git
cd jellyfin-liquid-glass
./apply.sh
```

Then hard-refresh Jellyfin in your browser (Ctrl+Shift+R).

`apply.sh` copies `web/liquidglass.css` and `web/liquidglass.js` into Jellyfin's web folder and adds two tags to `index.html`. It's safe to run more than once.

| Setup | Command |
| --- | --- |
| Podman or Docker container named `jellyfin` | `./apply.sh` |
| Other container name / runtime | `./apply.sh -c my-jellyfin -r docker` |
| Bare-metal install (deb/rpm) | `sudo ./apply.sh -w /usr/share/jellyfin/web` |
| Remove the theme | `./apply.sh -u` (add the same `-c` / `-w` options you installed with) |

Both the official image (`/jellyfin/jellyfin-web`) and the linuxserver.io image (`/usr/share/jellyfin/web`) are detected automatically.

### Keeping it applied

Changes made inside a container disappear when the container is recreated, for example on an image update. To make the theme permanent:

- **Podman Quadlet:**
  1. Mount the `web/` folder into the container.
  2. Run `apply.sh` as a post-start hook.

  See [`examples/jellyfin.container`](examples/jellyfin.container). With the folder mounted, edits to the CSS/JS go live on the next browser refresh.
- **Docker Compose:** mount `./web` the same way, then run `./apply.sh` after each `docker compose up -d`:

  ```yaml
  volumes:
    - ./jellyfin-liquid-glass/web:/jellyfin/jellyfin-web/liquidglass:ro
  ```
- **Bare metal:** re-run `apply.sh -w …` after Jellyfin package upgrades.

## Customizing

All colors, radii, and glass parameters are CSS custom properties at the top of `web/liquidglass.css`:
- `:root` holds the dark appearance.
- `html.lg-light` holds the light appearance.

The home banner and the top of show pages stay dark in light mode on purpose ("dark islands"), as Apple TV does.

## Notes

- The Inter font is loaded from Google Fonts as a stand-in for SF Pro. Remove the `@import` line at the top of the CSS to keep everything local.
- The theme relies on Jellyfin's class names. A future Jellyfin release may move things around. If something breaks after an upgrade, please open an issue with a screenshot.
- Not affiliated with or endorsed by Apple or the Jellyfin project. "Apple TV" and "Liquid Glass" are used descriptively.
