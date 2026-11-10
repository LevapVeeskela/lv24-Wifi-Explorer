"""Allow running the CLI launcher with ``python -m lv24_wifi_explorer``."""

from .cli import main

if __name__ == "__main__":
    raise SystemExit(main())
