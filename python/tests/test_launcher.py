"""Tests for the Python launchers that delegate to the npm packages."""

from __future__ import annotations

import contextlib
import io
import json
import os
import re
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

SRC_DIR = Path(__file__).resolve().parents[1] / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from lv24_wifi_explorer import __version__, cli, mcp
from lv24_wifi_explorer._npx import _node_launcher, npm_spec

PROJECT_ROOT = Path(__file__).resolve().parents[2]

ENTRIES = (
    (cli, "lv24-wifi", "@lv24/wifi-cli", "WIFI_CLI_NPM_VERSION"),
    (mcp, "lv24-wifi-mcp", "@lv24/wifi-mcp", "WIFI_MCP_NPM_VERSION"),
)

VERSION_ENV_VARS = ("WIFI_CLI_NPM_VERSION", "WIFI_MCP_NPM_VERSION")


class LauncherTests(unittest.TestCase):
    def setUp(self):
        self._saved_env = {name: os.environ.get(name) for name in VERSION_ENV_VARS}
        self.addCleanup(self._restore_env)
        for name in VERSION_ENV_VARS:
            os.environ.pop(name, None)

    def _restore_env(self):
        for name, value in self._saved_env.items():
            if value is None:
                os.environ.pop(name, None)
            else:
                os.environ[name] = value

    def _invoke(
        self,
        module,
        args,
        *,
        npx="/usr/local/bin/npx",
        returncode=0,
        side_effect=None,
        env=None,
    ):
        run_options = (
            {"side_effect": side_effect}
            if side_effect is not None
            else {"return_value": mock.Mock(returncode=returncode)}
        )

        stdout = io.StringIO()
        stderr = io.StringIO()
        with mock.patch.dict(os.environ, env or {}, clear=False):
            with mock.patch(
                "lv24_wifi_explorer._npx.shutil.which", return_value=npx
            ) as which:
                with mock.patch(
                    "lv24_wifi_explorer._npx.subprocess.run", **run_options
                ) as run:
                    with contextlib.redirect_stdout(stdout):
                        with contextlib.redirect_stderr(stderr):
                            code = module.main(list(args))
        return code, stdout.getvalue(), stderr.getvalue(), which, run

    def test_forwards_arguments_and_returns_child_exit_code(self):
        args = ["scan", "--ssid", "Cafe; $(touch pwned)", "--format", "json"]

        for module, command, package, _ in ENTRIES:
            with self.subTest(command=command):
                code, stdout, stderr, which, run = self._invoke(
                    module, args, returncode=7
                )

                self.assertEqual(code, 7)
                self.assertEqual(stdout, "")
                self.assertEqual(stderr, "")
                which.assert_called_once_with("npx")
                # A list plus check=False (no shell=True, no env=, no stdio
                # redirection) proves arguments cannot be shell-interpreted
                # and stdio/env are inherited.
                run.assert_called_once_with(
                    [
                        "/usr/local/bin/npx",
                        "--yes",
                        "{0}@{1}".format(package, __version__),
                        *args,
                    ],
                    check=False,
                )

    def test_uses_version_env_override(self):
        cases = (
            ("latest", "latest"),
            ("1.2.3", "1.2.3"),
            (" 1.2.3 ", "1.2.3"),
            ("   ", __version__),
        )

        for module, command, package, env_name in ENTRIES:
            for value, expected in cases:
                with self.subTest(command=command, value=value):
                    code, _, stderr, _, run = self._invoke(
                        module, ["--help"], env={env_name: value}
                    )

                    self.assertEqual(code, 0)
                    self.assertEqual(stderr, "")
                    self.assertEqual(
                        run.call_args.args[0][1:],
                        [
                            "--yes",
                            "{0}@{1}".format(package, expected),
                            "--help",
                        ],
                    )

    def test_missing_npx_returns_127_with_install_hint(self):
        for module, command, package, _ in ENTRIES:
            with self.subTest(command=command):
                code, stdout, stderr, _, run = self._invoke(module, [], npx=None)

                self.assertEqual(code, 127)
                self.assertEqual(stdout, "")
                self.assertIn("npx was not found on PATH", stderr)
                self.assertIn(command, stderr)
                self.assertIn(package, stderr)
                self.assertIn("Node.js", stderr)
                self.assertIn("npm", stderr)
                self.assertIn("ScanCore", stderr)
                self.assertIn("nmcli", stderr)
                self.assertIn("netsh", stderr)
                run.assert_not_called()

    def test_os_error_while_starting_npx_returns_127(self):
        for module, command, _, _ in ENTRIES:
            with self.subTest(command=command):
                code, stdout, stderr, _, _ = self._invoke(
                    module, [], side_effect=OSError("permission denied")
                )

                self.assertEqual(code, 127)
                self.assertEqual(stdout, "")
                self.assertIn(command, stderr)
                self.assertIn("failed to start", stderr)
                self.assertIn("permission denied", stderr)

    def test_keyboard_interrupt_returns_130(self):
        for module, command, _, _ in ENTRIES:
            with self.subTest(command=command):
                code, stdout, stderr, _, _ = self._invoke(
                    module, [], side_effect=KeyboardInterrupt
                )

                self.assertEqual(code, 130)
                self.assertEqual(stdout, "")
                self.assertEqual(stderr, "")

    def test_child_exit_codes_are_propagated(self):
        for module, command, _, _ in ENTRIES:
            for expected in (0, 1, 2, 42, 126):
                with self.subTest(command=command, code=expected):
                    code, stdout, stderr, _, _ = self._invoke(
                        module, ["providers"], returncode=expected
                    )

                    self.assertEqual(code, expected)
                    self.assertEqual(stdout, "")
                    self.assertEqual(stderr, "")

    def test_npm_spec_defaults_to_package_version(self):
        for _, _, package, env_name in ENTRIES:
            with self.subTest(package=package):
                self.assertEqual(
                    npm_spec(package, env_name),
                    "{0}@{1}".format(package, __version__),
                )


class WindowsShimTests(unittest.TestCase):
    def _layout(self, tmp: str) -> tuple:
        root = Path(tmp)
        npx = root / "npx.cmd"
        script = root / "node_modules" / "npm" / "bin" / "npx-cli.js"
        node = root / "node.exe"
        npx.touch()
        script.parent.mkdir(parents=True)
        script.touch()
        node.touch()
        return npx, script, node

    def test_non_windows_platform_keeps_the_shim_command(self):
        with tempfile.TemporaryDirectory() as tmp:
            npx, _, _ = self._layout(tmp)

            self.assertIsNone(_node_launcher(str(npx), platform="posix"))

    def test_windows_cmd_shim_is_replaced_with_node_and_npx_cli(self):
        with tempfile.TemporaryDirectory() as tmp:
            npx, script, node = self._layout(tmp)

            self.assertEqual(
                _node_launcher(str(npx), platform="nt"),
                [str(node), str(script)],
            )

    def test_windows_shim_without_npx_cli_falls_back_to_the_shim(self):
        with tempfile.TemporaryDirectory() as tmp:
            npx, script, _ = self._layout(tmp)
            script.unlink()

            self.assertIsNone(_node_launcher(str(npx), platform="nt"))

    def test_windows_exe_shim_is_not_rewritten(self):
        with tempfile.TemporaryDirectory() as tmp:
            npx, _, _ = self._layout(tmp)
            exe = npx.with_suffix(".exe")
            npx.replace(exe)

            self.assertIsNone(_node_launcher(str(exe), platform="nt"))

    def test_windows_metacharacters_survive_argument_forwarding(self):
        args = ["scan", "--ssid", "Cafe&Bar %PATH% a^b|c", "--format", "json"]

        with tempfile.TemporaryDirectory() as tmp:
            npx, script, node = self._layout(tmp)

            with mock.patch("lv24_wifi_explorer._npx.os.name", "nt"):
                with mock.patch.dict(os.environ, {}, clear=False):
                    with mock.patch(
                        "lv24_wifi_explorer._npx.shutil.which", return_value=str(npx)
                    ):
                        with mock.patch(
                            "lv24_wifi_explorer._npx.subprocess.run",
                            return_value=mock.Mock(returncode=0),
                        ) as run:
                            with contextlib.redirect_stdout(io.StringIO()):
                                with contextlib.redirect_stderr(io.StringIO()):
                                    code = cli.main(list(args))

            self.assertEqual(code, 0)
            command = run.call_args.args[0]
            self.assertEqual(command[:2], [str(node), str(script)])
            self.assertEqual(
                command[2:],
                ["--yes", "@lv24/wifi-cli@{0}".format(__version__), *args],
            )


class VersionTests(unittest.TestCase):
    def test_version_matches_expected_release(self):
        self.assertEqual(__version__, "1.0.0")

    def test_version_matches_canonical_npm_packages(self):
        expected = {
            "packages/cli/package.json": "@lv24/wifi-cli",
            "packages/mcp/package.json": "@lv24/wifi-mcp",
        }

        for relative, package in expected.items():
            with self.subTest(package=package):
                payload = json.loads(
                    (PROJECT_ROOT / relative).read_text(encoding="utf-8")
                )
                self.assertEqual(payload["name"], package)
                self.assertEqual(payload["version"], __version__)

    def test_version_matches_pyproject(self):
        text = (PROJECT_ROOT / "python" / "pyproject.toml").read_text(
            encoding="utf-8"
        )
        match = re.search(r'(?m)^version\s*=\s*"([^"]+)"', text)

        self.assertIsNotNone(match)
        self.assertEqual(match.group(1), __version__)


if __name__ == "__main__":
    unittest.main()
