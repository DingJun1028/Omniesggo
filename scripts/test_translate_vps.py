import json
import urllib.request

test_cases = [
    ("歡迎來到全球永續發展峰會", "zh-TW", "en"),
    ("Artificial intelligence accelerates green transformation", "en", "zh-TW"),
    ("ESG 永續發展目標與碳中和", "zh-TW", "en"),
]

print("=== 測試 1: Next.js API (/api/omnisub/translate) ===")
for text, src, tgt in test_cases:
    payload = json.dumps({"text": text, "srcLang": src, "targetLang": tgt}).encode("utf-8")
    req = urllib.request.Request(
        "http://127.0.0.1:3000/api/omnisub/translate",
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode("utf-8"))
            data = res.get("data", {})
            print(f"[{data.get('sourceLang')} -> {data.get('targetLang')}] {data.get('originalText')} => {data.get('translatedText')}")
    except Exception as e:
        print(f"Error on Next.js: {e}")

print("\n=== 測試 2: Universal Translator (:8788/translate) ===")
for text, src, tgt in test_cases:
    payload = json.dumps({"text": text, "from": src, "to": tgt}).encode("utf-8")
    req = urllib.request.Request(
        "http://127.0.0.1:8788/translate",
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode("utf-8"))
            print(f"[:8788 engine={res.get('engine')}] {text} => {res.get('text')}")
    except Exception as e:
        print(f"Error on 8788: {e}")
