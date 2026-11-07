"""Turn the MCP captures in data/captures/ into data/page.json, the strings the page shows."""
import json, pathlib

root = pathlib.Path(__file__).resolve().parent.parent / "data"


def outcome(content):
    result = content["execution"]["value"]
    if result["ok"]:
        return "ok: " + json.dumps(result["value"], separators=(",", ":"))
    return result["error"]["message"].split(" Recovery:")[0]


def run(name):
    capture = json.loads((root / "captures" / name).read_text())
    search, describe, wrong, right = (step["structuredContent"] for step in capture["steps"])
    return {
        "label": capture["label"],
        "capturedAt": capture["capturedAt"],
        "searchInput": search["items"][0]["input"],
        "signature": describe["items"][0]["signature"],
        "wrongCall": outcome(wrong),
        "rightCall": outcome(right),
    }


def bench():
    rows = []
    for entry in json.loads((root / "captures" / "bench.json").read_text()):
        calls = [step for step in entry["steps"] if step["tool"] == "call"]
        rows.append({
            "build": entry["build"],
            "prompt": entry["prompt"],
            "firstStyle": json.dumps(calls[0]["input"]["style"]),
            "firstOutcome": calls[0]["outcome"],
            "calls": len(calls),
            "created": entry["created"],
        })
    return rows


page = {"before": run("before.json"), "after": run("after.json"), "bench": bench()}
(root / "page.json").write_text(json.dumps(page, indent=1) + "\n")
