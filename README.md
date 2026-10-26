# uBOLite / uBlock MV3 build — Windows notes (verified 2026-10-21)

## What this folder is

| File | What it is |
|---|---|
| `uBOLite_vaft_chromium.zip` | **uBlock Origin Lite built from source + the `twitch-videoad` (vaft) scriptlet added.** Verified working on live twitch.tv. |
| `uBOLite.chromium/` | uBOLite built from source (no vaft) — unpacked folder, load via `chrome://extensions` → Load unpacked |
| `uBOLite_dev_chromium.zip` | same, zipped (13.9 MB, 984 files) |
| `ubo-mv3.zip` | **full uBlock Origin ported to MV3** (r58Playz/uBlock-mv3 v1.75.1.900) — has `webRequestBlocking` + `userScripts` + `userResourcesLocation` |
| `ubol.zip` | official uBlock Origin Lite release (2026.1018.2229) for comparison |
| `src/twitch-videoad.js` | the added scriptlet source (drop into `src/js/resources/`) |
| `src/make-mv3.windows-patched.sh` | build script with the Windows path fix (see below) |
| `src/tools/`, `src/platform/` | build tooling |

Build metadata: version `2026.1021.336`, 56 static rulesets (6 enabled by default),
18,840 DNR rules, 154 scriptlets (153 upstream + 1 added).

---

## 1. The Windows trap (read this first)

Git-Bash/MSYS `pwd` returns `/tmp/...`, but **node and jq are native Windows
binaries** and resolve `/tmp/foo` as `C:\tmp\foo` — a *different, usually
non-existent* directory.

Symptom: `make-mv3.sh` fails at the ruleset step with

```
Error: ENOENT: no such file or directory, open 'C:\tmp\...\manifest.json'
```

**The failure is often non-fatal.** The script continues and you end up with a
build that looks fine but has `declarative_net_request.rule_resources: []` —
**zero blocking rules**. Always verify the artifact, not the exit code.

### The fix (already applied in `src/make-mv3.windows-patched.sh`)

Wrap every path handed to node/jq in `cygpath -w`:

```bash
node --no-warnings make-rulesets.js output="$(cygpath -w "$UBOL_DIR")" platform="$PLATFORM"
node salvage-ruleids.mjs before="$(cygpath -w "$BEFORE/$PLATFORM")" after="$(cygpath -w "$UBOL_DIR")"
TAGNAME="$(jq -r .version "$(cygpath -w "$UBOL_DIR")/manifest.json")"
jq '.permissions += ["declarativeNetRequestFeedback"]' "$(cygpath -w "$UBOL_DIR")/manifest.json" > "$tmp_manifest"
```

### Other Windows prerequisites

- `jq` is not present by default — get `jq-windows-amd64.exe` from
  <https://github.com/jqlang/jq/releases>, put it on PATH.
- `zip` is not present — the packaging step was replaced with a Python
  `zipfile` run afterwards.
- `make` is not present — call `tools/make-mv3.sh` directly.
- Verify: `manifest.json` must show a non-empty
  `declarative_net_request.rule_resources` array.

## 2. Rebuild from scratch

```bash
git clone --depth 1 https://github.com/gorhill/uBlock.git
cd uBlock
git submodule update --init --recursive
# apply the cygpath patch to tools/make-mv3.sh  (see src/make-mv3.windows-patched.sh)
bash tools/make-mv3.sh chromium     # -> dist/build/uBOLite.chromium
```

## 3. Testing the built extension on Windows

**Chrome stable (155+) ignores `--load-extension`** — unpacked extensions cannot
be loaded at all in current branded Chrome. Use **Chrome for Testing**:
<https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json>

Build ONE argument string — PowerShell `Start-Process -ArgumentList @('a','b')`
splits on `=` and silently produces `--load-extension` with an empty value:

```
--user-data-dir="<prof>" --no-first-run --no-default-browser-check
--disable-extensions-except="<ext>" --load-extension="<ext>"
--remote-debugging-port=9333 about:blank
```

Via CDP:
- extension id: read `cftprofile/Default/Secure Preferences` → `extensions.settings`
  (the unpacked ext has no `manifest` key on first write — identify it by `path`)
- evaluate against an **extension page** (`chrome-extension://<id>/dashboard.html`).
  A service-worker target does **not** expose `chrome.declarativeNetRequest` when
  evaluated over CDP.
- "Allow User Scripts" toggle lives at `chrome://extensions/?id=<id>` inside
  `extensions-manager` → `extensions-detail-view` shadow root →
  `extensions-toggle-row#allow-user-scripts`. Until it is on, `chrome.userScripts`
  is `undefined` and no scriptlet will run.
- `chrome://version` shows the command line Chrome actually received.

## 4. The `twitch-videoad` (vaft) scriptlet

### Why it had to be added

`userResourcesLocation` + `##+js(twitch-videoad)` is a **full uBlock Origin**
feature:

- `js/storage.js` fetches the URL and feeds it to `redirectEngine.resourcesFromString()`
- the parser reads the legacy header `twitch-videoad.js text/javascript` and
  registers a resource named `twitch-videoad.js`
- `##+js(twitch-videoad)` then resolves through
  `reng.contentFromName('twitch-videoad.js', 'text/javascript')`

**uBlock Origin Lite has none of this** — no `userResourcesLocation`, no
`@url:` preparse directive, no remote-resource mechanism at all
(`grep -c '@url'` over uBOL's JS returns 0).

### What was done instead

`vaft-ublock-origin.js` was bundled into uBOL as an ordinary scriptlet:

- `src/js/resources/twitch-videoad.js` — wraps the upstream IIFE **verbatim**
  inside `export function twitchVideoAdFn() { ... }` and registers it via
  `registerScriptlet(twitchVideoAdFn, { name: 'twitch-videoad.js', world: 'MAIN', requiresTrust: true })`
- `src/js/resources/scriptlets.js` — added `import './twitch-videoad.js';`

`world: 'MAIN'` is required: vaft patches the page's own JS objects, so it must
run in the page's main world, not the isolated content-script world.

### Using it

In uBOLite's dashboard → **Custom filters**, add:

```
twitch.tv##+js(twitch-videoad)
```

and make sure **Allow User Scripts** is enabled for the extension. Nothing else
to configure — no URL to paste, no hidden setting.

### Verified

```
enabledRulesets : [ublock-filters, easylist, easyprivacy, pgl, ublock-badware, urlhaus-full]
userScripts     : 1 x { id: 'sandbox-main-scriptlets', world: 'MAIN',
                        runAt: 'document_start', matches: ['*://*.twitch.tv/*'],
                        codeLen: 69468, hasVaftCode: true }
```

On live `https://www.twitch.tv/`:

```json
{ "twitchAdSolutionsVersion": 24, "allSegmentsAreAdSegments": "defined" }
```

### Note on the upstream project

`pixeltris/TwitchAdSolutions` was **archived 2026-03-05**. The upstream README
recommends the userscript (`vaft.user.js`) over the uBO route, and notes the uBO
route "may randomly stop being applied for unknown reasons (#200)".

`requiresTrust: true` on the scriptlet means it only runs from a **trusted**
source — i.e. the "Custom filters" sandbox in your own dashboard — and is
refused for filter lists fetched from a remote server. That is deliberate:
arbitrary remote scriptlets are a real security risk.

## 5. uBlock Origin Lite feature summary (verified against the build)

| Feature | Status |
|---|---|
| Custom filters (dashboard) | yes — `filter-editor.js`, CodeMirror |
| Custom scriptlets `##+js(...)` | yes — 154 scriptlets, incl. the added vaft |
| Custom DNR rules | yes — `dnr-editor.js` (YAML-like) |
| Import remote filter list | yes — `imported-lists.js` |
| Per-site filtering mode | yes — 4 modes, `mode-manager.js` |
| `userResourcesLocation` / `@url:` | **no** (full-uBO only) |
| Dynamic filtering (runtime webRequest) | **no** — Chrome forbids it outside policy-installed extensions |
| `strict1p/strict3p`, `redirect-rule=`, `replace=`, `ipaddress=`, `urlskip=`, regex `removeparam=`, CNAME uncloaking | **no** — DNR cannot express these (uBO's own FAQ lists them) |

DNR limits on Chrome: 30,000 safe dynamic rules, 5,000 unsafe, 5,000 session,
30,000 static guaranteed (311,160 reported available on this machine).
