import json
import urllib.request

for text in ["歡迎來到全球永續發展峰會", "Artificial intelligence accelerates green transformation"]:
    payload = json.dumps({"text": text}).encode("utf-8")
    req = urllib.request.Request(
        "http://127.0.0.1:3000/api/omnisub/translate",
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        print(f"[{res['data']['sourceLang']} -> {res['data']['targetLang']}] {res['data']['originalText']} => {res['data']['translatedText']}")
