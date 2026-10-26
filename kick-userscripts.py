"""Force-register the uBlock Origin Lite user scripts (sandbox scriptlets) right
after the isolated browser starts.

The isolated profile loads the extension with --load-extension, a path on which
Chrome never fires onInstalled; uBlock Origin Lite therefore skips its own
start-up registration of the sandbox scriptlets (auto ad-hider, TwitchAdSolutions).
This helper re-triggers the compile + register step once, a few seconds after
launch. It is silent and exits by itself.

Usage: python kick-userscripts.py [port]
"""
import json
import os
import sys
import time
import urllib.request

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 9338
EXT_ID = "mjnednmlpiffbemdafejcecihicmdogc"
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from cdp import cdp_open, evaluate  # noqa: E402


def log(*a):
    print(*a, file=sys.stderr, flush=True)


def wait_port(timeout=60):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            urllib.request.urlopen(
                "http://127.0.0.1:%d/json/version" % PORT, timeout=2)
            return True
        except Exception:
            time.sleep(1)
    return False


def new_tab(url):
    v = json.loads(urllib.request.urlopen(
        "http://127.0.0.1:%d/json/version" % PORT, timeout=5).read())
    s, send, recv = cdp_open(v["webSocketDebuggerUrl"])
    send({"id": 1, "method": "Target.createTarget", "params": {"url": url}})
    tid = None
    for _ in range(40):
        m = recv()
        if m and m.get("id") == 1:
            tid = m["result"]["targetId"]
            break
    s.close()
    time.sleep(4)
    lst = json.loads(urllib.request.urlopen(
        "http://127.0.0.1:%d/json/list" % PORT, timeout=5).read())
    for t in lst:
        if t.get("id") == tid:
            return t["webSocketDebuggerUrl"]
    return None


EXPR = (
    "(async()=>{"
    " const st=await chrome.storage.local.get(['sandboxFilters']);"
    " const text=st.sandboxFilters || '';"
    " if(text!==''){ await chrome.runtime.sendMessage({what:'setSandboxFilters', text}); }"
    " await new Promise(r=>setTimeout(r,3000));"
    " const s=await chrome.userScripts.getScripts();"
    " return JSON.stringify({n:s.length, ids:s.map(x=>x.id)});"
    "})()"
)


def main():
    if wait_port() is False:
        log("kick: browser not reachable on port %d" % PORT)
        return 1
    ws = new_tab("chrome-extension://%s/dashboard.html" % EXT_ID)
    if not ws:
        log("kick: extension page not reachable")
        return 1
    time.sleep(3)
    s, send, recv = cdp_open(ws)
    send({"id": 2, "method": "Runtime.enable"})
    time.sleep(2)
    r = evaluate(send, recv, EXPR, msg_id=5)
    s.close()
    log("kick: %s" % str(r)[:200])
    return 0


if __name__ == "__main__":
    sys.exit(main())
