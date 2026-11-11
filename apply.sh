#!/bin/sh
# Liquid Glass for Jellyfin — install / update / remove the theme in Jellyfin's web client.
#
#   ./apply.sh                          # Podman or Docker container named "jellyfin"
#   ./apply.sh -c my-jellyfin -r docker # another container / runtime
#   ./apply.sh -w /usr/share/jellyfin/web   # bare-metal install (may need sudo)
#   ./apply.sh -u                       # uninstall
#
# It copies web/liquidglass.css + web/liquidglass.js into <web>/liquidglass/ and adds two tags to
# <web>/index.html. Safe to re-run. Container changes are lost when the container is
# recreated (e.g. on image update) — re-run it, or use the post-start hook from the README.
set -eu

DIR=$(cd "$(dirname "$0")" && pwd)
NAME=jellyfin
RT=""
WEB=""
UNINSTALL=0

usage() { sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'; exit "${1:-0}"; }

while [ $# -gt 0 ]; do
  case "$1" in
    -c|--container) NAME="$2"; shift 2 ;;
    -r|--runtime) RT="$2"; shift 2 ;;
    -w|--web-dir) WEB="$2"; shift 2 ;;
    -u|--uninstall) UNINSTALL=1; shift ;;
    -h|--help) usage 0 ;;
    *) echo "Unknown option: $1" >&2; usage 1 ;;
  esac
done

V=$(date +%s)
STRIP="-e 's#<link rel=\"stylesheet\" href=\"liquidglass/[^>]*>##g' -e 's#<script src=\"liquidglass/[^>]*></script>##g'"
ADD="-e 's#</body>#<link rel=\"stylesheet\" href=\"liquidglass/liquidglass.css?v=$V\"><script src=\"liquidglass/liquidglass.js?v=$V\" defer></script></body>#'"
if [ "$UNINSTALL" = 1 ]; then SED="sed -i $STRIP"; else SED="sed -i $STRIP $ADD"; fi

# ---------------------------------------------------------------- bare metal
if [ -n "$WEB" ]; then
  [ -f "$WEB/index.html" ] || { echo "No index.html in $WEB" >&2; exit 1; }
  if [ "$UNINSTALL" = 1 ]; then
    rm -f "$WEB/liquidglass/liquidglass.css" "$WEB/liquidglass/liquidglass.js"
    rmdir "$WEB/liquidglass" 2>/dev/null || true
  else
    mkdir -p "$WEB/liquidglass"
    cp "$DIR/web/liquidglass.css" "$DIR/web/liquidglass.js" "$WEB/liquidglass/"
  fi
  eval "$SED \"\$WEB/index.html\""
  echo "Liquid Glass $( [ "$UNINSTALL" = 1 ] && echo removed from || echo applied to ) $WEB"
  exit 0
fi

# ---------------------------------------------------------------- container
if [ -z "$RT" ]; then
  if command -v podman >/dev/null 2>&1; then RT=podman
  elif command -v docker >/dev/null 2>&1; then RT=docker
  else echo "Neither podman nor docker found; use --web-dir for bare-metal installs." >&2; exit 1
  fi
fi

# Wait for the container (handy when run as a post-start hook)
i=0
until $RT exec "$NAME" true >/dev/null 2>&1; do
  i=$((i + 1)); [ $i -ge 30 ] && { echo "Container '$NAME' is not running." >&2; exit 1; }
  sleep 1
done

# Official image uses /jellyfin/jellyfin-web; linuxserver.io uses /usr/share/jellyfin/web
CWEB=$($RT exec "$NAME" sh -c 'for d in /jellyfin/jellyfin-web /usr/share/jellyfin/web; do [ -f "$d/index.html" ] && echo "$d" && break; done')
[ -n "$CWEB" ] || { echo "Could not find Jellyfin's web client inside '$NAME'." >&2; exit 1; }

# If the theme folder is bind-mounted into the container (persistent setup), don't copy over it
MOUNTED=0
$RT exec "$NAME" sh -c "grep -q ' $CWEB/liquidglass ' /proc/mounts" && MOUNTED=1

if [ "$UNINSTALL" = 1 ]; then
  [ "$MOUNTED" = 1 ] || $RT exec "$NAME" rm -rf "$CWEB/liquidglass"
elif [ "$MOUNTED" = 0 ]; then
  $RT exec "$NAME" mkdir -p "$CWEB/liquidglass"
  $RT cp "$DIR/web/liquidglass.css" "$NAME:$CWEB/liquidglass/liquidglass.css"
  $RT cp "$DIR/web/liquidglass.js" "$NAME:$CWEB/liquidglass/liquidglass.js"
fi

$RT exec "$NAME" sh -c "$SED $CWEB/index.html"
echo "Liquid Glass $( [ "$UNINSTALL" = 1 ] && echo removed from || echo applied to ) $NAME ($CWEB)$( [ "$MOUNTED" = 1 ] && echo ', using mounted files')"
