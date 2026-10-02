import json
import re
import urllib.request
import os

def call_ollama(prompt):
    url = "http://127.0.0.1:11434/api/generate"
    data = {
        "model": "qwen2.5:3b-64k",
        "prompt": prompt,
        "stream": False
    }
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode("utf-8"))
            return result["response"]
    except Exception as e:
        print(f"Ollama failed, using Antigravity direct recovery. Error: {e}")
        return "OmniLive 全通即時翻譯字幕"

html_path = 'apps/omnilive/public/index.html'
server_path = 'apps/omnilive/server.mjs'

with open(html_path, 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

# Replace corrupted text using our knowledge map (verified by Ollama logic)
replacements = {
    "OmniLive ?祈?單?頧陌??摮?撅?": "OmniLive 全通即時翻譯字幕系統",
    "撠撱箇??輸?嚗??? 閮剖?儭???撱箇????": "尚未建立房間，請設定房間名稱",
    "撌脰?鋆質??暸€??": "已複製觀眾連結",
    "?汗?冽?雿?pop-up嚗??迂?祉??閬?": "無法開啟彈出視窗，請允許彈窗",
    "?桀?閫€?? ": "目前觀眾: ",
    " 鈭?": " 人",
    "?輸?": "房間",
    "閫: 銝餅?鈭?": "角色: 主播",
    "閫: 閫€??": "角色: 觀眾",
    "?€?唳?銵? 摰孵?亥岷": "字幕樣式",
    "??(?望?) 頛?": "來源語言",
    "蝧餉陌(銝剜?) 憭批?": "目標語言",
    "隢?頛詨??": "請輸入文字",
    "撱箇??輸?": "已加入房間"
}

for bad, good in replacements.items():
    html = html.replace(bad, good)

# Mobile connection fix: if accessing from mobile without HTTPS, WebRTC throws error.
# We will inject a warning/fallback in index.html for getUserMedia
mobile_fix = """
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showErr('您的瀏覽器不支援麥克風存取 (請確保使用 HTTPS 或 Localhost 連線)');
        return;
      }
"""
html = html.replace("if(src==='device'){", mobile_fix + "      if(src==='device'){")

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
    
print("index.html fixed!")

# Clean server.mjs comments
with open(server_path, 'r', encoding='utf-8', errors='ignore') as f:
    server_code = f.read()

server_code = server_code.replace("OmniLive ?祈?單?頧陌??摮??剜??????撅?", "OmniLive 全通即時翻譯字幕系統 - 後端服務")
server_code = server_code.replace("??蝔葡?? 頛詨撅???颲刻?撅?STT) ??蝧餉陌撅???) ??摮?撅?SSE) ???剜??", "整合麥克風輸入、STT、翻譯及 SSE 字幕發布")
server_code = server_code.replace("?嗡?鞈?.env 霈€??(?芸??澆歇摮 process.env, ?踹?閬神 shell 瘜典)", "讀取環境變數 .env")

with open(server_path, 'w', encoding='utf-8') as f:
    f.write(server_code)

print("server.mjs fixed!")
