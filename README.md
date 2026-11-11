# Liquid Glass for Jellyfin

An Apple TV–style redesign of the Jellyfin **web** client, built around Apple's Liquid Glass material and the Human Interface Guidelines. It's two drop-in files (a stylesheet and a small script) plus an installer. Your server, libraries, and settings are not modified.

## What it changes

- **Navigation:** a floating glass sidebar replaces the top bar. It's an icon rail that expands on hover. On phone-sized screens it becomes an iOS-style floating tab bar at the bottom, with your profile at the top-left and a ☰ menu at the top-right for Dashboard, Settings and Appearance.
- **Home:** a full-bleed featured banner ("Top Shelf") of your shows and movies.
  - Shows you're partway through come first.
  - Each slide has a logo, metadata, **Play / Resume** (jumps straight to your next episode), More Info, and Favorite.
  - Slides auto-advance with a progress indicator. Swipe, the arrow keys, and the hover arrows also work.
- **Show / movie pages:** a cinematic layout with full-screen backdrop art, the title logo, a prominent Play button, and round glass action buttons. Cast & crew appear as circular portraits.
  - If the item has trailers, they fade in **muted** behind the header after a few seconds and loop, with a glass mute/unmute button.
  - Local trailer files play first, then YouTube trailers from the metadata (ones named "trailer" or "teaser" are preferred).
  - Trailers pause when you scroll away or switch tabs, and are skipped with reduced motion or data saver on.
- **Music (Apple Music on Apple TV / iOS):**
  - **Player bar:** a floating Liquid Glass capsule with artwork, transport, volume and a hairline progress bar. On phones it becomes the iOS mini player above the tab bar.
  - **Now Playing:** full screen over a slowly drifting, blurred wash of the album art, with artwork that settles back when paused.
    - On TVs and wide screens it uses the tvOS 10-foot layout: big artwork with the title beside it, a full-width scrubber, and one control row (Playing Next · transport · lyrics / shuffle / repeat / volume). "Playing Next" slides in as a glass sheet. Remote and keyboard focus uses tvOS-style white platters, and after a few seconds idle the controls fade away, leaving the artwork and title.
    - On phones it uses the iOS layout, with the queue below.
  - **Lyrics:** big bold lines over the same artwork background.
  - **Album, artist and playlist pages:** an artwork colour wash, the artist in Apple Music red, Play and Shuffle buttons, and a clean numbered track list with animated level bars on the song that's playing. On phones the album header is centred, as in iOS Music.
  - SF Symbols–style icons replace the Material icons in the player. Favorites use a star. Artists are round, with a silhouette when there's no photo.
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

- Trailers from YouTube are embedded with `youtube-nocookie.com` and the YouTube IFrame API script, so show pages with trailers contact YouTube.
- The Inter font is loaded from Google Fonts as a stand-in for SF Pro. Remove the `@import` line at the top of the CSS to keep everything local.
- The theme relies on Jellyfin's class names. A future Jellyfin release may move things around. If something breaks after an upgrade, please open an issue with a screenshot.
- Not affiliated with or endorsed by Apple or the Jellyfin project. "Apple TV" and "Liquid Glass" are used descriptively.
