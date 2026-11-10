"""``lv24-wifi-mcp`` entry point that delegates to ``@lv24/wifi-mcp`` on npm."""

from __future__ import annotations

from typing import Optional, Sequence

from ._npx import run_npm_package

NPM_PACKAGE = "@lv24/wifi-mcp"
NPM_VERSION_ENV = "WIFI_MCP_NPM_VERSION"
COMMAND_NAME = "lv24-wifi-mcp"


def main(argv: Optional[Sequence[str]] = None) -> int:
    """Run the npm MCP server through ``npx`` and return its exit code."""
    return run_npm_package(
        package=NPM_PACKAGE,
        version_env=NPM_VERSION_ENV,
        command_name=COMMAND_NAME,
        argv=argv,
    )


if __name__ == "__main__":
    raise SystemExit(main())
