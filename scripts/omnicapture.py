#!/usr/bin/env python3
"""OmniCapture — 万能擷取：自動將所有型別檔案做詳細文檔分析（Groq / Ollama）"""
import os, sys, json, subprocess, pathlib, datetime, hashlib

# --- Provider selection ---
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "").strip()
GROQ_BASE_URL = os.environ.get("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

OLLAMA = r"C:\Users\Administrator\AppData\Local\Programs\Ollama\ollama.exe"
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen2.5:3b")
VAULT = pathlib.Path(r"C:\Users\Administrator\Documents\Project\Omniesggo\docs\vault-canon")
INBOX = VAULT / "OmniCapture" / "inbox"
ANALYSIS = VAULT / "OmniCapture" / "analysis"
ARCHIVE = VAULT / "OmniCapture" / "archive"
FAILED = VAULT / "OmniCapture" / "failed"

for d in (INBOX, ANALYSIS, ARCHIVE, FAILED):
    d.mkdir(parents=True, exist_ok=True)

def run_ollama(prompt: str) -> str:
    env = os.environ.copy()
    env["PATH"] = r"C:\Users\Administrator\AppData\Local\Programs\Ollama;" + env.get("PATH", "")
    r = subprocess.run([OLLAMA, "run", OLLAMA_MODEL], input=prompt, capture_output=True, text=True,
                       encoding="utf-8", timeout=300, env=env)
    return r.stdout.strip()

def run_groq(prompt: str) -> str:
    import requests
    url = f"{GROQ_BASE_URL.rstrip('/')}/chat/completions"
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
    payload = {"model": GROQ_MODEL, "messages": [{"role": "user", "content": prompt}], "temperature": 0.3}
    r = requests.post(url, headers=headers, json=payload, timeout=120)
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"].strip()

def run_llm(prompt: str) -> tuple[str, str]:
    if GROQ_API_KEY:
        try:
            return run_groq(prompt), f"groq:{GROQ_MODEL}"
        except Exception as e:
            print(f"[WARN] Groq failed, falling back to Ollama: {e}")
    return run_ollama(prompt), f"ollama:{OLLAMA_MODEL}"

def extract_text(path: pathlib.Path) -> str:
    suf = path.suffix.lower()
    if suf in {".md", ".txt", ".json", ".yaml", ".yml", ".toml", ".py", ".ts", ".js", ".tsx", ".jsx", ".css", ".html", ".csv"}:
        return path.read_text(encoding="utf-8", errors="replace")[:20000]
    if suf == ".pdf":
        try:
            import pypdf
            rd = pypdf.PdfReader(str(path))
            return "\n".join(p.extract_text() or "" for p in rd.pages)[:20000]
        except Exception as e:
            return f"[PDF extract failed: {e}]"
    if suf == ".docx":
        try:
            import docx
            d = docx.Document(str(path))
            return "\n".join(p.text for p in d.paragraphs)[:20000]
        except Exception as e:
            return f"[DOCX extract failed: {e}]"
    if suf == ".pptx":
        try:
            import pptx
            prs = pptx.Presentation(str(path))
            out = []
            for slide in prs.slides:
                for shape in slide.shapes:
                    txt = getattr(shape, "text", "")
                    if txt:
                        out.append(txt)
            return "\n".join(out)[:20000]
        except Exception as e:
            return f"[PPTX extract failed: {e}]"
    if suf == ".xlsx":
        try:
            import openpyxl
            wb = openpyxl.load_workbook(str(path), data_only=True)
            out = []
            for ws in wb.worksheets:
                for row in ws.iter_rows(values_only=True):
                    out.append(" | ".join(str(c) for c in row if c is not None))
            return "\n".join(out)[:20000]
        except Exception as e:
            return f"[XLSX extract failed: {e}]"
    if suf in {".png", ".jpg", ".jpeg", ".webp", ".bmp"}:
        return f"[Image file: {path.name}; OCR not available (tesseract not installed) — record filename + type only]"
    return f"[binary/unsupported type {suf}; filename={path.name}]"

def analyze(path: pathlib.Path):
    text = extract_text(path)
    prompt = (
        "你是一個文件分析助手。請用繁體中文對以下文件做詳細分析，輸出：\n"
        "1. 一句話摘要\n2. 關鍵要點（3-7 條）\n3. 標籤（#tag 形式，5-10 個）\n4. 可能的應用場景\n"
        "文件內容：\n" + text
    )
    summary, model_name = run_llm(prompt)
    cid = "OMN-CAP-" + hashlib.sha256(str(path).encode()).hexdigest()[:8]
    out = ANALYSIS / (path.stem + " — OmniCapture 分析.md")
    now = datetime.datetime.now().isoformat()
    content = f"""---
title: {path.name} — OmniCapture 分析
canon_id: {cid}
source: {path}
source_origin: omnicapture
analyzed_at: {now}
model: {model_name}
tags: [omnicapture, auto-analysis]
---

# {path.name} — OmniCapture 分析

{summary}
"""
    out.write_text(content, encoding="utf-8")
    path.rename(ARCHIVE / path.name)
    print(f"[OK] {path.name} -> {out.name}")

def main():
    files = [f for f in INBOX.iterdir() if f.is_file()]
    if not files:
        print("inbox empty")
        return
    for f in files:
        try:
            analyze(f)
        except Exception as e:
            print(f"[FAIL] {f.name}: {e}")
            try:
                f.rename(FAILED / f.name)
            except Exception:
                pass

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # analyze a specific file path
        p = pathlib.Path(sys.argv[1])
        if p.is_file():
            INBOX.mkdir(parents=True, exist_ok=True)
            dst = INBOX / p.name
            if not dst.exists():
                import shutil; shutil.copy2(p, dst)
            analyze(dst)
        else:
            print("file not found")
    else:
        main()
