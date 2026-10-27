#!/bin/bash
# Set up the skills' tools in Claude Code cloud sessions: point Archify,
# playwright-cli and Reel Studio at the pre-installed Chromium, and install
# playwright-cli. Locally nothing is set or installed.
[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
[ -n "$CLAUDE_ENV_FILE" ] || exit 0

for chrome in /opt/pw-browsers/chromium-*/chrome-linux64/chrome; do
  if [ -x "$chrome" ]; then
    # Cloud sessions run as root, where Chrome only starts with --no-sandbox;
    # Reel Studio's renderer doesn't pass it, so wrap the binary.
    wrapper="${TMPDIR:-/tmp}/chrome-no-sandbox"
    printf '#!/bin/sh\nexec "%s" --no-sandbox "$@"\n' "$chrome" > "$wrapper"
    chmod +x "$wrapper"
    {
      [ -n "$ARCHIFY_CHROME" ] || echo "export ARCHIFY_CHROME=\"$chrome\""
      echo "export PLAYWRIGHT_MCP_BROWSER=chromium"
      echo "export PLAYWRIGHT_MCP_EXECUTABLE_PATH=\"$chrome\""
      [ -n "$CHROME_PATH" ] || echo "export CHROME_PATH=\"$wrapper\""
    } >> "$CLAUDE_ENV_FILE"
    break
  fi
done

command -v playwright-cli >/dev/null 2>&1 ||
  npm install -g --silent @playwright/cli@0.1.22 >/dev/null 2>&1

exit 0
