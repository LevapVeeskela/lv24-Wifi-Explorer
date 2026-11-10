"""``lv24-wifi`` entry point that delegates to ``@lv24/wifi-cli`` on npm."""

from __future__ import annotations

from typing import Optional, Sequence

from ._npx import run_npm_package

NPM_PACKAGE = "@lv24/wifi-cli"
NPM_VERSION_ENV = "WIFI_CLI_NPM_VERSION"
COMMAND_NAME = "lv24-wifi"


def main(argv: Optional[Sequence[str]] = None) -> int:
    """Run the npm CLI through ``npx`` and return its exit code."""
    return run_npm_package(
        package=NPM_PACKAGE,
        version_env=NPM_VERSION_ENV,
        command_name=COMMAND_NAME,
        argv=argv,
    )


if __name__ == "__main__":
    raise SystemExit(main())
