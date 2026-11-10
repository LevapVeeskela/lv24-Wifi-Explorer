# Microsoft Store distribution (Windows)

Can LV24 WiFi Explorer (Electron 33, MIT, NSIS x64) ship through the Microsoft
Store, under which license, at what cost. Research date **2026-11-10**; every
Microsoft claim was read on learn.microsoft.com that day. Not legal advice —
license rows are analysis, not an opinion.

## 0. Verdict

**Go — phased, and not via MSIX.**

| Phase | What                                      | Cost   | Blocker                  |
| ----- | ----------------------------------------- | ------ | ------------------------ |
| 1     | winget manifest (`microsoft/winget-pkgs`) | $0     | none — no account needed |
| 2     | Store submission as **MSI/EXE (NSIS)**    | $0 fee | code-signing certificate |
| 3     | MSIX — **not recommended** (§5)           | $0     | AppData virtualization   |

The Store has accepted unpackaged installers since June 2021 and the MSI/EXE
path is first-class today. It avoids the MSIX AppData virtualization that
already bit `lv24-brain`, and lets us publish our own license terms (MIT)
instead of Microsoft's SALT.

**The one hard prerequisite is a CA-chained Authenticode certificate.** The
Store never re-signs MSI/EXE. That is the only real blocker, and it is $0 only
through SignPath Foundation (publisher becomes "SignPath Foundation").

## 1. What the brain actually contains

Source: `lv24-brain-data/projects/lv24-brain/research-2026-11-09/C-desktop.md`.

| §   | What it records                                                                                                               | For LV24        |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 6.1 | "**Packaging: NSIS (not MSIX)** … MSIX's AppData virtualization is exactly the failure already seen"                          | applies         |
| 6.1 | NSIS per-user into `%LOCALAPPDATA%\Programs`; "winget manifest later"                                                         | matches config  |
| 6.2 | SignPath Foundation **$0** for OSI-licensed, non-dual-licensed OSS; cert issued to _SignPath Foundation_                      | applies         |
| 6.2 | Unsigned Windows ⇒ SmartScreen "Unknown publisher" / strong block                                                             | applies         |
| 6.2 | Certum from €49; Azure Artifact Signing ~$9.99/mo                                                                             | confirmed, §7   |
| 6.3 | "**MSIX: don't.**" … "For an app whose whole job is to drive a CLI and a shared data directory, MSIX is the wrong container." | applies         |
| 7   | GitHub Actions is $0 on public repos; the public-repo condition is load-bearing                                               | release CI only |

**There is no recorded decision about an open-source license for Windows Store
distribution.** `brain open lv24-wifi-explorer` returns `Recent decisions:
none recorded`; `brain search "store"`, `"license"` and `"MSIX"` return no
decision record — only note/attempt/handoff hits. The single "MSIX" hit is
`attempt/lv24-brain/...` (the v0.3.2 AppData workaround), not a license
decision. Everything below about MIT/Store licensing is **new analysis here**,
not recovered brain knowledge.

Caveat on 6.3: Microsoft scopes the AppData redirection to _virtualized_ apps
("This section applies only to virtualized apps") and suggests full-trust apps
may pass through — yet the brain's packaged build did virtualize. Treat the
hazard as unproven either way; do not put the data path inside MSIX.

## 2. What the Store accepts today

| Format                                          | Signing                              | Updates                           |
| ----------------------------------------------- | ------------------------------------ | --------------------------------- |
| `.msix`, `.msixbundle`, `.msixupload`, `.appx*` | **Store re-signs**, no cert needed   | Store-managed, automatic          |
| `.msi`, `.exe` (since June 2021)                | **Developer signs**, never re-signed | Developer-managed, no auto-update |
| `.xap`                                          | legacy — no new submissions          | —                                 |

MSI/EXE rules (Store Policy 10.2.9 + _App package requirements for MSI/EXE_);
each is a certification test:

- HTTPS direct link, versioned, **immutable** after submission; new version ⇒ new URL.
- `.msi` or `.exe` only; PC devices only.
- **Binary and all its PE files signed** with a cert chaining to a CA in the
  Microsoft Trusted Root Program. Self-signed is rejected.
- **Silent install**, no installer UI; a UAC prompt is allowed.
- Installs as a **standard user**; no admin.
- **Offline/standalone** installer — not a web/downloader stub.
- Start-menu/Programs entry, correct ProductName/Publisher/Version in
  Add/Remove Programs, **clean uninstall**.
- No bundleware; non-Microsoft drivers/services must be declared.

Certification takes up to ~3 business days; the listing appears ~15 min after
passing.

## 3. Developer account and fees

| Item                             | Fact (2026-11-10)                                                           | Marker   |
| -------------------------------- | --------------------------------------------------------------------------- | -------- |
| Account types                    | Individual or Company; converting Individual → Company is **not supported** | verified |
| New onboarding fee               | **$0** for both, if you start at `storedeveloper.microsoft.com`             | verified |
| Individual, legacy flow          | **$19** one-time (direct Partner Center / Visual Studio / Xbox entry)       | verified |
| Company, legacy flow             | **$99** one-time, same condition                                            | verified |
| Renewal                          | none                                                                        | verified |
| Account needed for winget        | **No**                                                                      | verified |
| Account needed for MSIX sideload | **No** — but you sign the MSIX yourself with a trusted cert                 | verified |

Start at `storedeveloper.microsoft.com` and the fee is $0. Individual =
government ID + selfie; Company = DUNS or business documents plus a
domain-matching work email (and it cannot be downgraded later).

## 4. License compatibility

The project is **MIT**: `LICENSE` line 1 (`MIT License`, © 2026 LV24) and
`package.json` `"license": "MIT"`; all `@lv24/wifi-*` packages are MIT.

How the Store treats licenses: you license the app to the customer yourself.
Per the App Developer Agreement (v8.10) you _may_ provide your own agreement
and it is published with the listing; **only if you provide none** does the
Standard Application License Terms (SALT) apply. For MSI/EXE the "Applicable
license terms" field is **required** (10,000 chars), so the MIT text goes there.

| License        | MSI/EXE + own terms                     | MSIX (SALT default) | Why                                                                                                                              |
| -------------- | --------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **MIT**        | compatible                              | compatible          | Permissive; imposes no additional restrictions on recipients.                                                                    |
| **Apache-2.0** | compatible                              | compatible          | Keep `NOTICE`, state changes; the patent grant is not an extra restriction.                                                      |
| **GPLv2**      | compatible with own terms + full source | risky               | §6: "You may not impose any further restrictions". Store account/device licensing can be read as one.                            |
| **GPLv3**      | same as GPLv2                           | risky               | §10 forbids additional restrictions; §7 limits added terms; SALT adds terms you cannot relicense.                                |
| **AGPLv3**     | same as GPLv3                           | risky               | §13 triggers only on remote interaction with a modified version — a local scanner does not. Inherits the §10 problem under SALT. |

For this project the answer is simple: **MIT + own terms = no conflict**, on
either path. The copyleft rows matter only if the project relicenses; if that
ever happens, stay on MSI/EXE.

Store policies that bind an OSS scanner:

- **Privacy policy is mandatory for Win32.** Policy 10.5.1: "Product types that
  inherently have access to Personal Information must always have privacy
  policies. These include … Desktop Bridge and Win32 products." BSSIDs are
  location-identifying — non-negotiable.
- **FOSS compliance is ours.** ADA §4.c: we are solely responsible for
  third-party/FOSS terms including source availability, and must ensure
  Microsoft can perform its distribution obligations.
- **No bundleware, no dynamic code injection** (10.2.2/10.2.3).
- **Age rating** via the IARC questionnaire (11.11).
- **Localization** (10.7): the listing must cover the languages the app supports.
  The UI ships EN/RU/ZH, so expect three listings.
- **DRM:** MSIX apps run under Store-issued licenses tied to a Microsoft account
  and the Microsoft Usage Rules — the restriction that makes copyleft awkward.
  MSI/EXE has no Store DRM; the installer is ours.

### MUI X Pro

`packages/web` / `packages/desktop` use **commercial MUI X Data Grid Pro**. The
code is MIT but a build containing the commercial key is **not redistributable**
(`docs/RELEASE.md` §1a). `dist:mac:public` forces `VITE_MUI_LICENSE_KEY=` and
runs `check:public-bundle`. There is **no `dist:win:public` script**; the
`release-desktop.yml` workflow builds from a checkout without `.env.local` and
runs `check:public-bundle`, so its Windows artifact is keyless. A local Store
build must do the same — or the owner buys a redistribution license from MUI.

## 5. MSIX virtualization risk, and why MSI/EXE avoids it

Brain §6.3, verbatim:

> The prior brain desktop build was MSIX-packaged and its child processes saw a
> virtualized `%APPDATA%` … Microsoft documents that packaged apps redirect new
> AppData writes to `%LOCALAPPDATA%\Packages\<PFN>\LocalCache\...`, invisible to
> other processes … the safe conclusion is: **do not ship brain's data path
> inside MSIX**. For an app whose whole job is to drive a CLI and a shared data
> directory, MSIX is the wrong container.

Microsoft confirms the mechanism but scopes it: "This section applies only to
virtualized apps … All newly created files and folders in the user's `AppData`
folder … are written to a private per-user, per-app location".

Impact on LV24: the Electron main process keeps state under
`app.getPath('userData')` (`packages/desktop/src/main.ts:28`), i.e. `%APPDATA%`.
The CLI (`@lv24/wifi-cli`) and MCP server run **outside** the package and read
the same profile. Under MSIX redirection they would see a different, empty
directory, and exported `.lv24scan` snapshots would land where users cannot find
them. `netsh` itself is fine — a system binary reading OS state — but the
shared-data assumption is exactly what MSIX breaks.

An MSI/EXE (NSIS) install goes to `%LOCALAPPDATA%\Programs\...` and uses the
real `%APPDATA%`, so Electron, CLI, MCP and Explorer agree on paths. No
manifest, no package identity, no redirection.

## 6. Submission outline for this app (MSI/EXE)

Prerequisites: certificate (§7) exported for `CSC_LINK` / `CSC_KEY_PASSWORD`;
a **keyless public build** (build with `VITE_MUI_LICENSE_KEY=` and run
`check:public-bundle`, or use `release-desktop.yml`, then
`electron-builder --win nsis`); a public **privacy policy URL** (mandatory for
Win32); **support URL + email**; **screenshots** ≥1 (4+ recommended) and 1:1 box
art (2:3 poster recommended); an **immutable versioned URL** such as
`https://github.com/LevapVeeskela/lv24-Wifi-Explorer/releases/download/v1.0.0/LV24-WiFi-Explorer-1.0.0-win-x64.exe`
(never re-upload an asset in place); the **IARC age-rating questionnaire**; and
a clean Windows 10/11 VM for the silent-install and uninstall test.

Steps:

1. Register at `storedeveloper.microsoft.com` ($0) → Partner Center.
2. **New product → EXE or MSI app** → reserve the name (3-month hold).
3. Availability: Free; markets; discoverability.
4. Properties: category Network/Utilities, privacy URL, support info; declare no
   non-Microsoft drivers/NT services (we spawn `netsh`, a Microsoft OS tool).
5. Age ratings: complete the questionnaire.
6. Packages: versioned HTTPS URL, architecture **x64**, app type **EXE**,
   language(s), and **installer parameters**. electron-builder's NSIS is a
   Nullsoft installer; `/S` is the silent switch — **verify on the clean VM**
   and submit that exact string.
7. Store listing: description, features, screenshots, logo, and the **MIT text**
   under "Applicable license terms". Use "Notes for certification" to explain
   that scanning needs no admin, that demo fixtures appear when a scan is
   unavailable, and that the app spawns `netsh wlan show networks`.
8. Submit → certification (≤3 business days) → publish.

`electron-builder.yml`: **no change is required for MSI/EXE**.
`nsis.perMachine: false` is already correct (standard-user install);
`oneClick: false` + `allowToChangeInstallationDirectory: true` still honours
`/S`; `signAndEditExecutable: true` already signs the app EXE and installer when
a certificate is configured. Set `win.publisherName` only if it must match the
certificate subject.

One packaging caveat, now handled: `extraResources` used to copy
`native/ScanCore/.build/ScanCore.app` on **every** platform, which would embed an
unused macOS helper in the Windows installer — unrelated binaries are a
certification flag. It now sits under `mac:`, so Windows packaging no longer
looks for that path. Keep it that way; verify `dist:win` on a machine without a
ScanCore build before submitting.

Updates: the Store will **not** update MSI/EXE installs, so keep the manual
re-download flow (`docs/RELEASE.md` §6). Do not add an auto-updater for this.

## 7. Signing options and costs

| Option                                       | Price (2026-11-10)         | Store MSI/EXE                            | Marker                                                                                       |
| -------------------------------------------- | -------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| No signature                                 | $0                         | rejected                                 | verified                                                                                     |
| Self-signed                                  | $0                         | rejected (not a Trusted Root CA)         | verified                                                                                     |
| **SignPath Foundation** (OSS)                | **$0**                     | yes, OV-level                            | verified (terms)                                                                             |
| Certum Open Source — cloud                   | **from €49 net**           | yes                                      | verified                                                                                     |
| Certum Open Source — set (card + reader)     | **from €69 net**           | yes                                      | verified                                                                                     |
| Certum Open Source — code only               | **from €25 net**           | yes (own card)                           | verified                                                                                     |
| Certum Standard — cloud                      | **from €209 net**          | yes                                      | verified                                                                                     |
| Certum EV — cloud                            | **from €379 net**          | yes (no SmartScreen shortcut since 2024) | verified                                                                                     |
| Azure Artifact Signing (ex-Trusted Signing)  | **~$9.99/mo** (5,000 sigs) | yes                                      | price **unverified** — Learn says ~$9.99, the Azure pricing page renders amounts dynamically |
| OV certificate (DigiCert/Sectigo/GlobalSign) | **$150–300/yr**            | yes                                      | unverified (vendor quotes)                                                                   |
| EV certificate                               | **$400+/yr**               | yes, no longer bypasses SmartScreen      | verified (Learn)                                                                             |

SignPath Foundation conditions that bind us (`signpath.org/terms`): OSI-approved
license, **no commercial dual-licensing**, **no proprietary components** — so
the signed artifact must be the keyless public build, same constraint as §4.
The certificate is issued to **SignPath Foundation**, so Windows "Publisher"
reads _SignPath Foundation_, not _LV24_ (the Store listing publisher name comes
from Partner Center, so this is cosmetic but visible). Manual approval per
release, verifiable build from source, and a "Code signing policy" section on the
project home page listing committers/reviewers/approvers. Reputation-gated: they
may decline unknown projects.

Channel requirements: **Store MSI/EXE** requires a Trusted Root CA signature on
all PE files; **Store MSIX** needs none (Store re-signs); **winget** has no
signing requirement in repository policy; **plain download** is optional but
unsigned means a SmartScreen block.

## 8. Cost summary — zero-spend conclusion

- Store developer account (new flow): **$0**
- Store hosting: **$0** — you host the installer on GitHub Releases
- Store certification: **$0**
- winget manifest: **$0**
- Privacy policy page: **$0** (README or GitHub Pages)
- **Code-signing certificate: $0 via SignPath Foundation**, else €49+/yr (Certum OSS)
- SignPath approval: free, but weeks of waiting and reputation-gated

**The Store path can be done at $0**: new-flow account + SignPath Foundation +
GitHub-hosted installer. The $0 is paid in time (Foundation approval, manual
signing per release) and in the publisher name on the signature. If the owner
wants _LV24_ as the signer, the cheapest verified option is Certum Open Source
cloud at €49 net.

Nothing here requires a paid service. Releases stay manual; the optional
`release-desktop.yml` and `pypi-publish.yml` workflows run on standard free
runners of this public repository.

## 9. Contradictions with existing docs

Fixed in this change:

1. **`docs/RELEASE.md` §3** now says an unsigned installer is fine for direct
   downloads/winget but a Store MSI/EXE must be CA-signed (policy 10.2.9).
2. **`docs/RELEASE.md` §1a** now states that Windows/Linux CI builds are keyless
   by construction (no `.env.local` + `check:public-bundle`); no `dist:win:public`
   script is needed.
3. **`docs/PACKAGES.md`** now points at the keyless-build rule.

Still true / informational:

4. **`docs/RELEASE.md` §6** — no auto-updater. Consistent with MSI/EXE (the
   Store does not update them), **inconsistent with MSIX** (Store updates
   automatically). Another reason to stay on MSI/EXE.
5. Brain §6.2 lists Certum "from €49" — still correct, but Certum now caps a
   single certificate at **459 days** from 2026-02-27, so multi-year purchases
   need free reissues. Freshness note, not a contradiction.

## 10. Open questions for the owner

1. **Account type** — Individual (free, ID + selfie, publisher = your name) or
   Company (free, DUNS/documents, publisher = legal entity, not downgradable)?
2. **Signer identity** — accept "SignPath Foundation" for $0, or pay €49+/yr for
   a Certum OSS certificate under LV24?
3. **Privacy policy URL** — where will it live? Must describe Wi-Fi/BSSID
   processing honestly (the app has no telemetry today).
4. **Support URL + email** — required for Company, recommended otherwise.
5. **Screenshots/art** — `docs/assets/screenshot-*.png` exist in RU/EN/ZH. Which
   language is the primary listing, and is 1:1 box art acceptable?
6. **Age rating** — confirm the IARC answers (utility, no UGC, no ads) or delegate.
7. **Markets** — all markets, or a subset (EU/US/RU)?
8. **MUI X Pro** — ship the watermarked keyless build, or buy a redistribution
   license so the Store build matches the local build?
9. **winget first?** — a manifest PR costs nothing and can ship before any
   certificate exists. Recommended as phase 1.

## 11. Sources (accessed 2026-11-10)

Microsoft — publish hub https://learn.microsoft.com/en-us/windows/apps/publish/ ·
get started https://learn.microsoft.com/en-us/windows/apps/publish/get-started ·
MSI/EXE requirements https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/app-package-requirements ·
MSI/EXE certification https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/app-certification-process ·
MSI/EXE updates https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/publish-update-to-your-app-on-store ·
MSI/EXE fields https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/create-app-submission ·
MSIX requirements https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/app-package-requirements ·
code signing https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options ·
Store Policies 7.20 (effective 2026-10-22) https://learn.microsoft.com/en-us/windows/apps/publish/store-policies ·
developer account https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/open-a-developer-account ·
legacy fees https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/account-types-locations-and-fees ·
MSIX runtime https://learn.microsoft.com/en-us/windows/msix/desktop/desktop-to-uwp-behind-the-scenes ·
App Developer Agreement v8.10 https://go.microsoft.com/fwlink/?linkid=528905 ·
WinGet https://learn.microsoft.com/en-us/windows/package-manager/winget/ ·
WinGet submission https://learn.microsoft.com/en-us/windows/package-manager/package/ ·
WinGet policies https://learn.microsoft.com/en-us/windows/package-manager/package/windows-package-manager-policies

Signing — SignPath terms https://signpath.org/terms.html ·
Certum price list https://shop.certum.eu/code-signing.html ·
Azure Artifact Signing https://azure.microsoft.com/en-us/pricing/details/trusted-signing/

Licensing — GNU GPL FAQ https://www.gnu.org/licenses/gpl-faq.html

Brain — `lv24-brain-data/projects/lv24-brain/research-2026-11-09/C-desktop.md`
§6.1–6.3, §7
