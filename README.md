# uBlock Origin Lite Enhanced — Setup Guide

**Blocks ads on Thai streaming sites (037-hdd, 123-hdc, animegojos, hubserieshds) + Twitch automatically.** Built from uBlock Origin Lite (MV3) source with custom scriptlets.

---

## 🚀 Quick Start (30 seconds)

### Option A: Portable Installer — **Easiest, no build needed**

1. **Download** `INSTALL.bat` from [Releases](https://github.com/diedmanz/ublock-mv3-build/releases)
2. **Double-click** `INSTALL.bat` → wait 2–5 minutes (downloads Chrome + extension)
3. **Desktop shortcut appears:** "uBlock Origin Lite Enhanced"
4. **Click it** → first run asks **"Allow User Scripts"** → click **Allow** (once)
5. **Done.** Visit any Thai streaming site — ads are gone.

> **What it installs:** `%LOCALAPPDATA%\uBOLite-Enhanced\` (portable Chrome + extension + separate profile). Your main Chrome is untouched.

---

### Option B: Load in your regular Chrome/Edge

1. Open `chrome://extensions` (or `edge://extensions`)
2. Enable **Developer mode** (top-right)
3. **Load unpacked** → select: `%LOCALAPPDATA%\uBOLite-Enhanced\runtime\uBOLite_adhider`
   *(or the `uBOLite_adhider` folder from this repo)*
4. Extension icon → **Dashboard** → **Settings** → **Backup** → **Restore** → select `uBOL-config.json`
5. **Details** → enable **"Allow User Scripts"** (required, one time)

---

## ✅ What Gets Blocked (Verified)

| Site | Result |
|------|--------|
| **037-hdd.com** (home + movie pages) | Banner ads hidden, video roll-in auto-skipped |
| **123-hdc.com** (movie pages) | 12 banner ads hidden |
| **animegojos.com / hubserieshds.com** | 100% ad removal (0 visible) |
| **Twitch** | Video ads blocked (TwitchAdSolutions v24) |
| **News / Wiki / Stack Overflow** | **Nothing hidden** — zero false positives |

**Tech:** Custom scriptlets bundled in the extension:
- `ad-hider.js` — heuristic banner detection (rel=sponsored, ad containers, known ad hosts)
- `ad-gate-skip.js` — auto-skips adgate pre-roll on 037-hdd
- `twitch-videoad.js` — Twitch VAFT scriptlet (61 KB, MAIN world)

---

## 🛠 For Developers: Build from Source

### Prerequisites (Windows)
```bash
# In Git Bash / WSL
choco install nodejs-lts python jq git -y
# or manually: Node.js 18+, Python 3.11+, jq on PATH
```

### Build Steps
```bash
git clone https://github.com/diedmanz/ublock-mv3-build.git
cd ublock-mv3-build
# The upstream uBlock source is NOT in this repo: build.sh clones it,
# applies this repo's overlay, and builds the extension.
bash build.sh
# Output: uBOLite_adhider/  (load this folder as unpacked extension)
# Build somewhere else:  bash build.sh /path/to/out
```

`build.sh` does, in order:

1. clones `gorhill/uBlock` at a pinned commit (override with `UBO_REF=`) into
   `./.build/uBlock` and initializes its submodules
2. applies the overlay: the Windows-safe build script (`cygpath -w`), the
   custom scriptlets into `src/js/resources/`, and
   `src/patches/scriptlets.js.patch`
3. runs `bash tools/make-mv3.sh chromium`
4. post-build: `src/patches/background.js.patch` on the built output, copies
   `src/custom-ui/register.html`, runs `patch-rulesets.py`
5. verifies the artifact and **fails loudly if the rule count is suspiciously
   low** (the MSYS path trap produces a build with zero rules)

### Verify Build
```bash
# Must have non-empty rule_resources
jq '.declarative_net_request.rule_resources' uBOLite_adhider/manifest.json
```

> **Windows trap:** `pwd` in Git Bash returns `/tmp/...` but native `node`/`jq` see `C:\tmp\...` (different dir). The patched script wraps all paths with `cygpath -w` — **always verify artifact, not exit code**.

---

## 📁 Repository Structure

```
├── INSTALL.bat                 # ← Portable installer (see note below)
├── build.sh                    # ← Build entry point (clone upstream + overlay + build)
├── README.md                   # This file
├── README-PORTABLE.md          # Detailed portable usage guide
├── INSTALL.th.md               # Thai version
├── uBOL-config.json            # Extension config (filters + scriptlets)
├── filter-lists.txt            # 16 filter lists for import
├── Compute-ExtensionId.ps1     # Calculates extension ID from path
├── Start-Blocked-Browser.cmd   # Legacy launcher (use INSTALL.bat instead)
├── patch-rulesets.py           # Post-build DNR rule patcher
├── uBOLite_adhider/            # Built extension (ready to load)
├── src/
│   ├── make-mv3.windows-patched.sh    # Fixed build script (used by build.sh)
│   ├── custom-scriptlets/
│   │   ├── ad-hider.js
│   │   ├── ad-gate-skip.js
│   │   └── twitch-videoad.js
│   ├── custom-ui/
│   │   ├── register.html
│   │   └── register.js
│   └── patches/
│       ├── scriptlets.js.patch   # imports the custom scriptlets (source tree)
│       └── background.js.patch   # re-registers user scripts on session start
├── .build/                     # upstream uBlock clone (gitignored)
├── cft-chrome/                 # Chrome for Testing (portable)
└── profile-lite/               # Test profile (gitignored)
```

---

## ⚙️ Configuration Files

### `uBOL-config.json` — Extension Settings
```json
{
  "mode": "complete",
  "all-urls": true,
  "siteLists": {
    "animegojos.com": ["##+js(ad-hider)"],
    "hubserieshds.com": ["##+js(ad-hider)"]
  },
  "sandboxFilters": [
    "twitch.tv##+js(twitch-videoad)",
    "*##+js(ad-hider)",
    "*##+js(ad-gate-skip)"
  ]
}
```
- **mode: complete** — block on all sites
- **siteLists** — per-site cosmetic filters
- **sandboxFilters** — scriptlets (multi-host syntax works: `a.com,b.com##+js(...)`)

### `filter-lists.txt` — 16 Filter Lists
```
https://secure.fanboy.co.nz/fanboy-annoyance.txt
https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/ads.txt
https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/quickfixes.txt
https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/social.txt
https://filters.adtidy.org/extension/ublock/filters/14.txt
https://filters.adtidy.org/extension/ublock/filters/3.txt
https://filters.adtidy.org/extension/ublock/filters/2.txt
```
(Import via Dashboard → **Filter lists** → **Import**)

---

## 🔧 Troubleshooting

| Problem | Fix |
|---------|-----|
| **"Allow User Scripts" missing** | Must load unpacked extension. Web Store version doesn't have this toggle. |
| **Scriptlets not running** | Enable "Allow User Scripts" in extension Details. Restart browser. |
| **Extension ID changed** | ID = SHA-256(UTF-16LE path). Moving folder changes ID. Launcher recalculates automatically. |
| **Build has 0 rules** | Check `manifest.json` → `rule_resources` not empty. Use patched script. |
| **Twitch ads still show** | Scriptlet requires trust → must add via **Custom Filters** (not remote list). |
| **Roll-in ads on 037-hdd** | `ad-gate-skip.js` auto-clicks "ข้ามโฆษณา". If gate hangs, click manually once. |
| **CFT deletes Web Store extensions** | **Never run CFT on your main profile.** Use the portable profile (INSTALL.bat does this). |

---

## 📦 Releases

| Asset | Size | Use Case |
|-------|------|----------|
| `INSTALL.bat` | 7 KB | Portable installer — **currently expects the upstream repo layout (`tools/make-mv3.sh` at the root), which this repo does not have; use `bash build.sh` instead** |
| `uBOLite_adhider.zip` | 21 MB | Pre-built extension (load unpacked) |
| `uBOLite_adhider-minimal.zip` | 14 MB | Extension only (no rulesets/debug) |

> No release assets are published on this repository yet, so `INSTALL.bat`
> cannot download a pre-built build. Build it locally with `bash build.sh`.

---

## 📚 Related Docs

- `README-PORTABLE.md` — Portable usage details
- `INSTALL.th.md` — Thai version
- `README-ADHIDER.md` — `ad-hider.js` deep dive
- `README-ISOLATED-BROWSER.md` — Isolated browser mechanics
- `TWITCH-VAFT-SETUP.md` — Twitch scriptlet details

---

## 📄 License

uBlock Origin Lite: GPL-3.0 (gorhill/uBlock)
Custom scriptlets: Same license as uBlock Origin

---

**Repo:** https://github.com/diedmanz/ublock-mv3-build
**Issues:** Report bugs / request sites → [GitHub Issues](https://github.com/diedmanz/ublock-mv3-build/issues)
