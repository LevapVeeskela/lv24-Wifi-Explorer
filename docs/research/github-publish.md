<!-- Extracted from clean-room research. Do not copy Intuitibits assets, binaries, or unique copy. -->
<!-- Source: 6085438f-01de-454b-b2dd-08c20110e37c.jsonl -->

# GitHub publish recipe

## Scope on this Mac

Under `/Users/veeskela/Projects`, only these git roots exist today:

| Local path | GitHub `origin` (from `.git/config`; equivalent to `remote -v`) |
|---|---|
| `/Users/veeskela/Projects/lv24-identity` | `git@github.com:LevapVeeskela/lv24-identity.git` |
| `/Users/veeskela/Projects/lv24/main` | `git@github.com:LevapVeeskela/lv24.git` **+** `git@gitlab.com:lv24-company/lv24.git` (`gitlab`) |
| `/Users/veeskela/Projects/IMS/main` | `git@github.com:LevapVeeskela/IMS.git` |
| `/Users/veeskela/Projects/ferrum-enterprise` | `git@github.com:LevapVeeskela/ferrum-enterprise.git` |

Sibling ecosystem repos (`lv24-code`, `lv24-ytk`, etc.) are referenced in docs but **not cloned** here. `/Users/veeskela/Projects/lv24-Wifi-Explorer` does **not** exist yet.

**Note:** `git -C … remote -v` currently fails on this machine with *“You have not agreed to the Xcode license agreements”*; remotes above were read from `.git/config`. After `sudo xcodebuild -license`, `git remote -v` should match.

---

## GitHub account / org

- **GitHub owner:** personal account **`LevapVeeskela`** (not a GitHub org named `LV24`).
- **GitLab (city only):** `gitlab.com/lv24-company/lv24` — dual-remote + `infra/scripts/git-push-dual.ps1` documented in `/Users/veeskela/Projects/lv24/main/docs/local-ops-runbook.md`. Satellite repos like `lv24-identity` are **GitHub-only** locally.

---

## Visibility

From `gh repo view` / `gh repo list LevapVeeskela`:

- **LV24 ecosystem repos** (`lv24`, `lv24-identity`, `lv24-code`, `lv24-desktop-cv`, `IMS`, …): **`PRIVATE`**.
- A few **unrelated** older repos are public (`opencode-consilium`, `tiles-map-downloader`, `cv`).

**Default for new LV24 tooling:** `--private`.

---

## Naming

- Prefix **`lv24-`** + **kebab-case**: `lv24-identity`, `lv24-code`, `lv24-desktop-cv`, `lv24-youtube-knowledge`, `lv24-agent`, …
- Main city monorepo: **`lv24`** (no suffix).
- Exceptions: **`IMS`**, **`ferrum-enterprise`**, parser names without `lv24-`.
- Your requested name **`lv24-Wifi-Explorer`** is unusual (capital `W`, `E`) vs the usual all-lowercase kebab; GitHub treats names case-insensitively for URLs but preserves display casing.

---

## `gh repo create`

- **No** `gh repo create` (or similar) in `/Users/veeskela/Projects` codebase.
- Publishing is implied to be manual: create repo on GitHub, set `origin`, push (Windows city flow uses scripted dual push to GitHub + GitLab).

---

## Topics, descriptions, licenses

| Pattern | Observation |
|---|---|
| **Topics** | `repositoryTopics`: **null** on sampled LV24 repos (none set). |
| **Descriptions** | Often empty; when set, short English (`IMS - individual medical support`, `LV24 CV desktop Electron app`). |
| **README** | `lv24-identity`: Russian product README, states **“Private commercial (закрытый репозиторий)”**; no root `LICENSE`. |
| **GitHub license metadata** | Inconsistent vs files: e.g. `ferrum-enterprise` → MPL-2.0 on GitHub; `lv24-insta` / `lv24-agent` → MIT; many LV24 repos → **no license** on GitHub. |
| **Local LICENSE files** | Not at repo root for `lv24-identity`; `ferrum-enterprise` documents MPL-2.0 in README. |

---

## GitHub Actions

| Repo | Workflows |
|---|---|
| `LevapVeeskela/lv24-identity` | `.github/workflows/ci.yml` (push/PR → Node 20, compose Postgres, `npm run ci`) — also present locally at `/Users/veeskela/Projects/lv24-identity/.github/workflows/ci.yml` |
| `LevapVeeskela/lv24-code` | `verify.yml`, `release.yml` |
| `LevapVeeskela/lv24-desktop-cv` | `.github/workflows/` directory (on **`main`**) |
| `LevapVeeskela/lv24` | `.github/` has agent instruction markdown/skills — **no** `workflows/` on GitHub |
| `LevapVeeskela/IMS` | No `.github` on GitHub |

CI is **optional per repo**; identity/code/desktop apps use it; city monorepo does not (deploy/docs emphasize VPS/GitLab bake, not GHA).

---

## Default branch

- Ecosystem core: **`master`** (`lv24`, `lv24-identity`, `IMS`, …).
- Some newer desktop repos: **`main`** (e.g. `lv24-desktop-cv` on GitHub).

For a new sibling like Wifi Explorer, **`master`** aligns with `lv24-identity`.

---

## `gh auth status` (push readiness)

With full permissions:

```
github.com
  ✓ Logged in to github.com account LevapVeeskela (keyring)
  - Git operations protocol: ssh
  - Token scopes: … 'repo'
```

**You can create private repos and push via SSH** once local `git` works (Xcode license) and the project has commits.

---

## Recommended commands for `lv24-Wifi-Explorer` (do not run until implementation is done)

Assumes project root: **`/Users/veeskela/Projects/lv24-Wifi-Explorer`**, initial branch **`master`**, at least one commit, **private** GitHub repo under **`LevapVeeskela`**, **no GitLab** mirror (same pattern as `lv24-identity`).

**0. Prerequisites (once):**

```bash
sudo xcodebuild -license
gh auth status -h github.com
```

**1. Preferred — one shot with `gh` (creates remote + push):**

```bash
gh repo create LevapVeeskela/lv24-Wifi-Explorer \
  --private \
  --description "LV24 Wi‑Fi Explorer — 802.11 scan and analysis" \
  --source=/Users/veeskela/Projects/lv24-Wifi-Explorer \
  --remote=origin \
  --push
```

**2. Alternative — create empty repo, then push (if you already have `origin` or want explicit steps):**

```bash
gh repo create LevapVeeskela/lv24-Wifi-Explorer \
  --private \
  --description "LV24 Wi‑Fi Explorer — 802.11 scan and analysis" \
  --confirm

git -C /Users/veeskela/Projects/lv24-Wifi-Explorer remote add origin git@github.com:LevapVeeskela/lv24-Wifi-Explorer.git
git -C /Users/veeskela/Projects/lv24-Wifi-Explorer push -u origin master
```

**3. If the directory is not a git repo yet (after code exists):**

```bash
git -C /Users/veeskela/Projects/lv24-Wifi-Explorer init -b master
git -C /Users/veeskela/Projects/lv24-Wifi-Explorer add .
git -C /Users/veeskela/Projects/lv24-Wifi-Explorer commit -m "Initial commit: LV24 Wi‑Fi Explorer"
```

Then run step **1** or **2**.

**Optional later (match `lv24-identity`, not required to publish):** add `/Users/veeskela/Projects/lv24-Wifi-Explorer/.github/workflows/ci.yml` when you have a `npm run ci` (or equivalent) gate.

**Do not** add a `gitlab` remote unless you intentionally mirror like city `lv24/main`.

[REDACTED]
