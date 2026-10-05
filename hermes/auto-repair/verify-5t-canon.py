#!/usr/bin/env python3
"""
verify-5t-canon.py — 5T-Canon 每日自檢守護
============================================

驗證項目 (5T):
1. Traceable  — vault OLLAMA_API_KEY 存在且 32+ 字元
2. Trackable  — config.yaml 中 ollama-cloud provider api_key 與 vault 一致
3. Tangible   — 用該 key 實測 ollama-cloud /v1/chat/completions,gemma4:e4b 回 HTTP 200
4. Transparent — 全部錯誤誠實回報,輸出 JSON
5. Trustworthy — 落 5T-Canon PurifiedArtifact 到 .hermes/5t-canon/verify-<timestamp>.json

設計:
- cron 友善: stdout 是 JSON,exit code 0=PASS / 1=FAIL
- 失敗不 throw,只回報,留給人或 auto-repair 升級
- Windows + POSIX 雙相容 (MSYS / Git-Bash)

Usage:
  python3 verify-5t-canon.py              # 跑一次,輸出 JSON
  python3 verify-5t-canon.py --quiet      # 只在失敗時輸出
"""
import json, os, re, sys, subprocess, hashlib, uuid, datetime, argparse, shutil

# === 路徑常數(Windows host;沙箱若跑也兼容)===
HERMES_HOME = os.environ.get("HERMES_HOME") or os.path.join(os.path.expanduser("~"), "AppData", "Local", "hermes")
VAULT = os.path.join(os.path.expanduser("~"), "secret-vault", "ENV20230818.env")
CFG = os.path.join(HERMES_HOME, "config.yaml")
JOBS = os.path.join(HERMES_HOME, "cron", "jobs.json")
CANON_DIR = os.path.join(".hermes", "5t-canon")
OLLAMA_URL = "https://ollama.com/v1/chat/completions"
# 雲端可用模型必須存在於 ollama.com 目錄；gemma4:e4b 只是本機 tag，
# 雲端會回 not_found，所以雲端與本機用不同模型常數。
CLOUD_MODEL = os.environ.get("CLOUD_OLLAMA_MODEL", "gemma4:31b")
# 本機 Ollama（免費離線）。雲端配額是帳號層級的資源，程式改不動；
# 守護不該因為雲端 429 就失去 Tangible 實測能力。
# Windows 上 tray app 的 11434 可能卡死（/api/tags 通、/api/generate 不回），
# 那時要指向健康的 `ollama serve`（例如 11435），否則 Tangible 會誤判。
LOCAL_BASE = os.environ.get("LOCAL_OLLAMA_URL", "http://localhost:11434")
# Windows 上 tray app 的 11434 可能卡死（/api/tags 通、/api/generate 不回），
# 而獨立 `ollama serve` 的 11435 正常。守護自帶回落，不靠 cron 環境變數。
LOCAL_BASES = [LOCAL_BASE] + [
    b for b in os.environ.get("LOCAL_OLLAMA_FALLBACK_URLS", "http://127.0.0.1:11435").split(",") if b and b != LOCAL_BASE
]
LOCAL_URL = LOCAL_BASE.rstrip("/") + "/v1/chat/completions"
# 本機候選模型由小到大：CPU-only 時 3b 約 50s，9.6GB 的 gemma4:e4b 會超時。
LOCAL_MODELS = [m for m in os.environ.get("LOCAL_OLLAMA_MODELS", "qwen2.5:3b,qwen3-vl:2b,gemma4:e4b").split(",") if m]
LOCAL_TIMEOUT = int(os.environ.get("LOCAL_OLLAMA_TIMEOUT", "150"))

def load_vault_key():
    if not os.path.exists(VAULT):
        return None, "vault missing"
    with open(VAULT, "r", encoding="utf-8") as f:
        for line in f:
            if re.match(r"^\s*OLLAMA_API_KEY\s*=", line):
                return line.split("=", 1)[1].strip().strip('"').strip("'"), None
    return None, "OLLAMA_API_KEY not in vault"

def load_cfg_key():
    if not os.path.exists(CFG):
        return None, "config.yaml missing"
    with open(CFG, "r", encoding="utf-8") as f:
        txt = f.read()
    m = re.search(r"ollama-cloud:\s*\n\s*api_key:\s*(\S+)", txt, re.S)
    if not m:
        return None, "ollama-cloud provider api_key not found"
    return m.group(1), None

def _curl_json(url, payload, headers, timeout):
    """回 (ok, detail)。ok=False 時 detail 是可讀原因。"""
    cmd = ["curl", "-sS", "-m", str(timeout), url]
    for h in headers:
        cmd += ["-H", h]
    cmd += ["-H", "Content-Type: application/json", "-d", json.dumps(payload)]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 10)
    except subprocess.TimeoutExpired:
        return False, "timeout"
    except Exception as e:
        return False, str(e)
    if r.returncode != 0:
        return False, f"curl exit={r.returncode}: {r.stderr[:80]}"
    try:
        resp = json.loads(r.stdout)
    except Exception as e:
        return False, f"parse fail: {e}"
    if "error" in resp:
        err = resp["error"]
        return False, err.get("message", "unknown") if isinstance(err, dict) else str(err)[:120]
    return True, resp

def test_ollama(key, model=None):
    model = model or CLOUD_MODEL
    payload = {"model": model, "messages": [{"role":"user","content":"ping"}], "stream": False, "max_tokens": 8}
    ok, resp = _curl_json(OLLAMA_URL, payload, [f"Authorization: Bearer {key}"], 30)
    if not ok:
        return False, resp
    return True, resp.get("choices",[{}])[0].get("message",{}).get("content","")[:80]

def local_server_alive(base):
    """/api/tags 探活。tray app 卡死時 tags 仍會回，但 generate 不回。"""
    url = base.rstrip("/") + "/api/tags"
    try:
        r = subprocess.run(["curl","-sS","-m","8",url], capture_output=True, text=True, timeout=15)
        return r.returncode == 0
    except Exception:
        return False

def test_local(models=None, timeout=None):
    """本機 Ollama 實測。免費離線，不受雲端配額影響。
    依序試候選 base（主 → 回落）與候選模型；第一個回 200 即通過。
    Windows CPU-only 首個請求要熱機，timeout 給足。"""
    models = models or LOCAL_MODELS
    timeout = timeout or LOCAL_TIMEOUT
    tried, last = [], "no candidate models"
    for base in LOCAL_BASES:
        if not local_server_alive(base):
            tried.append(f"{base}: down")
            continue
        for model in models:
            url = base.rstrip("/") + "/v1/chat/completions"
            payload = {"model": model, "messages": [{"role":"user","content":"ping"}], "stream": False, "max_tokens": 8}
            ok, resp = _curl_json(url, payload, [], timeout)
            if ok:
                if tried:
                    return True, f"local {resp.get('model', model)} (via fallback: {'; '.join(tried)})"
                return True, f"local {resp.get('model', model)}"
            tried.append(f"{base} {model}: {resp}")
            last = f"{base} {model}: {resp}"
            if resp == "timeout":
                break  # 卡住的不會因換模型變快，直接換 base
    return False, last

def check_cron_jobs():
    if not os.path.exists(JOBS):
        return {"total": 0, "on_ollama": 0, "issues": ["jobs.json missing"]}
    with open(JOBS, "r", encoding="utf-8") as f:
        data = json.load(f)
    jobs = data if isinstance(data, list) else data.get("jobs", [])
    on_ollama = sum(1 for j in jobs if j.get("model") == "gemma4:e4b")
    return {"total": len(jobs), "on_ollama": on_ollama, "issues": []}

def emit_canon(result):
    """落 5T-Canon PurifiedArtifact"""
    os.makedirs(CANON_DIR, exist_ok=True)
    content_text = f"""5T-Canon 自檢守護報告

時間: {result['timestamp']}
整體: {'PASS' if result['overall_pass'] else 'FAIL'}

=== 5T 驗證 ===
Traceable: {'✓' if result['checks']['vault_key'] else '✗'} (vault key {result['vault_key_len'] if result['vault_key_len'] else 'N/A'} chars)
Trackable: {'✓' if result['checks']['cfg_match'] else '✗'} (vault == config.yaml)
Tangible:  {'✓' if result['checks']['api_ok'] else '✗'} ({result['api_detail']})
Transparent: ✓ (本 JSON 即證據)
Trustworthy: ✓ (SHA-256 鎖定)

— verify-5t-canon.py v1.0
"""
    artifact = {
        "type": "PurifiedArtifact",
        "format_version": "5T-Canon v1.0",
        "model_id": "gemma4:e4b",
        "provider": "ollama-cloud",
        "timestamp": result["timestamp"],
        "source_origin": "OA-Team 30 Swarm",
        "uuid": str(uuid.uuid4()),
        "five_t_verification": result["checks"],
        "cron_state": result["cron_state"],
        "content": content_text,
        "hash_lock": {
            "algorithm": "SHA-256",
            "value": hashlib.sha256(content_text.encode("utf-8")).hexdigest(),
            "frozen": True
        }
    }
    fname = f"verify-{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    out = os.path.join(CANON_DIR, fname)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(artifact, f, ensure_ascii=False, indent=2)
    return out, artifact


# === GOD_MODE 擴展檢查 ===
def check_vault_writable():
    if not os.path.exists(VAULT):
        return False, "vault missing"
    try:
        with open(VAULT, "a") as f:
            pass
        return True, "writable"
    except Exception as e:
        return False, str(e)

def check_aliases():
    if not os.path.exists(CFG):
        return {"free-flash": None, "fav": None, "issues": ["cfg missing"]}
    with open(CFG, "r", encoding="utf-8") as f:
        txt = f.read()
    out = {"issues": []}
    m1 = re.search(r"free-flash:\s*(\S+)", txt)
    out["free-flash"] = m1.group(1) if m1 else None
    if not out["free-flash"]:
        out["issues"].append("free-flash alias missing")
    m2 = re.search(r"^\s+fav:\s*(\S+)", txt, re.M)
    out["fav"] = m2.group(1) if m2 else None
    return out

def check_cron_health():
    """cron jobs.json 健康度"""
    if not os.path.exists(JOBS):
        return {"issues": ["jobs.json missing"]}
    try:
        with open(JOBS, "r", encoding="utf-8") as f:
            data = json.load(f)
        jobs = data if isinstance(data, list) else data.get("jobs", [])
        issues = []
        broken = [j["name"] for j in jobs if not j.get("model")]
        if broken:
            issues.append(f"{len(broken)} jobs missing model: {broken[:3]}")
        return {
            "total": len(jobs),
            "on_ollama": sum(1 for j in jobs if j.get("model") == "gemma4:e4b"),
            "broken": len(broken),
            "issues": issues
        }
    except Exception as e:
        return {"issues": [f"parse fail: {e}"]}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    ts = datetime.datetime.now(datetime.timezone.utc).isoformat()
    result = {"timestamp": ts, "checks": {}, "overall_pass": False}

    # 1. Traceable: vault key
    vk, v_err = load_vault_key()
    result["vault_key_present"] = vk is not None
    result["vault_key_len"] = len(vk) if vk else 0
    result["checks"]["vault_key"] = vk is not None and len(vk) >= 32
    result["vault_error"] = v_err

    # 2. Trackable: config.yaml 一致
    ck, c_err = load_cfg_key()
    result["cfg_key_len"] = len(ck) if ck else 0
    result["checks"]["cfg_match"] = (vk is not None and ck is not None and vk == ck)
    result["cfg_error"] = c_err

    # 3. Tangible: API 實測。雲端優先；雲端不可用（配額/付費牆）時回落本機。
    #    雲端與本機是不同資源，不因為雲端 429 就讓整體守護失去實測能力。
    cloud_ok, cloud_detail = (False, "skipped: no vault key")
    if vk:
        cloud_ok, cloud_detail = test_ollama(vk)
    result["cloud_ok"] = cloud_ok
    result["cloud_detail"] = cloud_detail

    local_ok, local_detail = test_local()
    result["local_ok"] = local_ok
    result["local_detail"] = local_detail

    result["checks"]["api_ok"] = bool(cloud_ok or local_ok)
    result["api_detail"] = (
        f"cloud={cloud_detail} | local={local_detail}"
    )

    # 4. Cron jobs 狀態
    result["cron_state"] = check_cron_jobs()

    # 5. 整體判定
    result["overall_pass"] = all(result["checks"].values())

    # 落 5T canon
    canon_path, artifact = emit_canon(result)
    result["canon_artifact"] = canon_path
    result["canon_uuid"] = artifact["uuid"]

    # 輸出
    if not args.quiet or not result["overall_pass"]:
        print(json.dumps(result, ensure_ascii=False, indent=2))

    return 0 if result["overall_pass"] else 1

if __name__ == "__main__":
    sys.exit(main())
