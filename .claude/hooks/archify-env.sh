#!/bin/bash
# Point Archify's browser check at the pre-installed Chromium in Claude Code
# cloud sessions. Locally nothing is set, so Archify finds Chrome on its own.
[ -n "$CLAUDE_ENV_FILE" ] || exit 0
[ -z "$ARCHIFY_CHROME" ] || exit 0
for chrome in /opt/pw-browsers/chromium-*/chrome-linux64/chrome; do
  if [ -x "$chrome" ]; then
    echo "export ARCHIFY_CHROME=\"$chrome\"" >> "$CLAUDE_ENV_FILE"
    break
  fi
done
exit 0
