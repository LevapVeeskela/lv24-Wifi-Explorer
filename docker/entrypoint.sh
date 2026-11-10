#!/bin/sh
# Entry point for the headless LV24 WiFi Explorer image.
#
#   lv24-wifi <args>          default; the CLI (`providers`, `scan`, `--help`)
#   mcp [<args>]              start the MCP stdio server instead
#
# Kept POSIX-sh only: node:22-bookworm-slim ships /bin/sh, not bash guarantees.
set -eu

if [ "${1:-}" = "mcp" ]; then
  shift
  exec lv24-wifi-mcp "$@"
fi

exec lv24-wifi "$@"
