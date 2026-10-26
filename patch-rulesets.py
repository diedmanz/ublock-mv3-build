"""Post-build patch of the static ublock-filters DNR ruleset.

The rules below block the advertising network of the Thai streaming sites.
This script is authoritative: it removes the rules it no longer wants and
adds the missing ones, so it can be re-run after every build.

Usage: python patch-rulesets.py [extension_dir]
"""
import json, os, sys

EXT = sys.argv[1] if len(sys.argv) > 1 else r"E:\ublock-mv3-build\uBOLite_adhider"
RS = os.path.join(EXT, "rulesets", "main", "ublock-filters.json")

# rules we own (ours are the only ones with these url filters)
OWNED = [
    "||googles.video^",
    "||adsok.co^",
    "||v8movie.com^",
    "||playlist.streamhls1688.com/ad-playlists/",
]
# the ones we actually want: the ad script and the ad creatives.
# The pre-roll video itself is NOT blocked: the player waits for the ad to
# complete, so blocking it would stop the movie from playing. It is skipped
# by the ad-gate-skip scriptlet instead.
WANTED = [
    "||adsok.co^",
    "||v8movie.com^",
]


def main():
    if not os.path.exists(RS):
        print("ruleset not found:", RS)
        return 1
    data = json.load(open(RS, encoding="utf-8"))
    nid = max([r.get("id", 0) for r in data] or [0]) + 1
    kept, removed, added = [], [], []
    for r in data:
        uf = r.get("condition", {}).get("urlFilter")
        if uf in OWNED and uf not in WANTED:
            removed.append(uf)
            continue
        if uf in OWNED and uf in WANTED:
            kept.append(uf)
            continue
        kept.append(uf)
        data_keep = True
    out = []
    seen = set()
    for r in data:
        uf = r.get("condition", {}).get("urlFilter")
        if uf in OWNED and uf not in WANTED:
            continue
        out.append(r)
        if uf in WANTED:
            seen.add(uf)
    for uf in WANTED:
        if uf in seen:
            continue
        out.append({"action": {"type": "block"}, "condition": {"urlFilter": uf},
                    "id": nid, "priority": 10})
        added.append("%s id=%d" % (uf, nid))
        nid += 1
    json.dump(out, open(RS, "w", encoding="utf-8"), separators=(",", ":"))
    print("removed:", removed or "-", "| added:", added or "-",
          "| total rules:", len(out))
    return 0


if __name__ == "__main__":
    sys.exit(main())
