"""Shared ``npx`` delegation used by the CLI and MCP entry points."""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from typing import Optional, Sequence

from . import __version__

NODE_INSTALL_HINT = (
    "Install Node.js 20 or newer (npm and npx are included) from\n"
    "https://nodejs.org/ and make sure the native scan provider for this\n"
    "platform is available:\n"
    "  - macOS 13.5+: the signed ScanCore helper (Location Services)\n"
    "  - Linux: NetworkManager (nmcli)\n"
    "  - Windows: netsh\n"
)

# The npm-generated npx.cmd shim runs this script with the bundled Node.js.
_NPX_CLI_RELATIVE_PATH = os.path.join("node_modules", "npm", "bin", "npx-cli.js")


def _node_launcher(
    npx: str, platform: Optional[str] = None
) -> Optional[list]:
    """Return ``[node, npx-cli.js]`` for npm's Windows batch shim.

    Windows runs ``.cmd``/``.bat`` shims through ``cmd.exe``, which re-parses
    the command line: ``&`` splits the command, ``^`` is swallowed and
    ``%NAME%`` expands environment variables. An SSID such as ``Cafe&Bar``
    would arrive truncated or altered. Starting the npm script with Node.js
    directly keeps every argument intact.
    """
    platform = os.name if platform is None else platform
    if platform != "nt" or not npx.lower().endswith((".cmd", ".bat")):
        return None

    directory = os.path.dirname(npx)
    script = os.path.join(directory, _NPX_CLI_RELATIVE_PATH)
    if not os.path.isfile(script):
        return None

    node = os.path.join(directory, "node.exe")
    if not os.path.isfile(node):
        node = shutil.which("node") or ""
        if not node or node.lower().endswith((".cmd", ".bat")):
            return None
    return [node, script]



def missing_npx_message(command_name: str, package: str) -> str:
    """Build the install hint shown when ``npx`` is not on PATH."""
    return (
        "{0}: npx was not found on PATH.\n\n"
        "This package is a Python launcher for the Node.js package {1};\n"
        "it does not bundle Node.js.\n\n"
        "{2}"
    ).format(command_name, package, NODE_INSTALL_HINT)


def npm_spec(package: str, version_env: str) -> str:
    """Return the npm package spec, honoring ``version_env`` overrides."""
    version = os.environ.get(version_env, "").strip() or __version__
    return "{0}@{1}".format(package, version)


def run_npm_package(
    package: str,
    version_env: str,
    command_name: str,
    argv: Optional[Sequence[str]] = None,
) -> int:
    """Run an npm package through ``npx`` and return its exit code.

    The child process inherits stdin, stdout, stderr and the environment, so
    the MCP server can speak the stdio protocol and interactive CLIs keep
    working. Arguments are passed as a list and never through a shell.
    """
    args = list(sys.argv[1:] if argv is None else argv)

    npx = shutil.which("npx")
    if npx is None:
        sys.stderr.write(missing_npx_message(command_name, package))
        return 127

    launcher = _node_launcher(npx) or [npx]
    command = [*launcher, "--yes", npm_spec(package, version_env), *args]

    try:
        completed = subprocess.run(command, check=False)
        return completed.returncode
    except KeyboardInterrupt:
        return 130
    except OSError as exc:
        sys.stderr.write(
            "{0}: failed to start {1}: {2}\n".format(command_name, command[0], exc)
        )
        return 127
