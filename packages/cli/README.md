# @lv24/wifi-cli

```bash
lv24-wifi providers
lv24-wifi scan --provider auto --count 1 --format table
lv24-wifi scan --provider demo --format json --out scan.json
```

Options: `--interval`, `--count`, `--timeout`, `--format table|json|jsonl|csv`,
`--out`, `--exclude-hidden`. `lv24-wifi --version` prints the package version
(`1.0.1`). On macOS set `LV24_SCANCORE_PATH` to the helper binary; on
Linux/Windows the CLI uses `nmcli` / `netsh`.

MIT licensed.
