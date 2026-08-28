"""ReachAgent — 冷郵件個人化管線 (免費算立適配版)
架構: Search → Fetch (parallel) → Analyze → Draft → Eval (retry loop)
LLM: Ollama 本地/CPU 推論 (禁用付費 API)
"""
import os
import json
import asyncio
import time
from typing import Any

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()

OLLAMA_BASE = os.getenv("OLLAMA_BASE", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
# 結構化抽取用較強模型 (可選, 預設同 OLLAMA_MODEL)
OLLAMA_MODEL_ANALYZE = os.getenv("OLLAMA_MODEL_ANALYZE", OLLAMA_MODEL)


# ── LLM 適配層 (Ollama 免費算立) ──────────────────────────────
def call_ollama(prompt: str, timeout: int = 60, model: str = None) -> str:
    """呼叫 Ollama 生成文本 (免費算立)"""
    m = model or OLLAMA_MODEL
    try:
        r = requests.post(
            f"{OLLAMA_BASE}/api/generate",
            json={"model": m, "prompt": prompt, "stream": False},
            timeout=timeout,
        )
        r.raise_for_status()
        return r.json().get("response", "").strip()
    except Exception as e:
        return f"[OLLAMA_FAIL] {e}"


def call_ollama_structured(prompt: str, schema_hint: str, timeout: int = 60, model: str = None) -> dict:
    """結構化輸出: 用 format=json + schema 提示詞 (Ollama 無原生 tool call)"""
    m = model or OLLAMA_MODEL_ANALYZE
    full = f"{prompt}\n\n回傳嚴格 JSON (勿 Markdown 區塊), schema:\n{schema_hint}\n只回 JSON:"
    try:
        r = requests.post(
            f"{OLLAMA_BASE}/api/generate",
            json={"model": m, "prompt": full, "format": "json", "stream": False},
            timeout=timeout,
        )
        r.raise_for_status()
        raw = r.json().get("response", "{}").strip()
        # 去 Markdown 包裹
        if raw.startswith("```"):
            raw = raw.split("```")[1].split("```")[0]
        return json.loads(raw)
    except Exception as e:
        print(f"[STRUCTURED_FAIL] {e}")
        return {}


# ── Search (DuckDuckGo, 無 API key) ───────────────────────────
def search_duckduckgo(query: str, max_results: int = 8) -> list[dict]:
    """用 ddgs 搜尋, 回傳 [{title, url, snippet}]"""
    try:
        from ddgs import DDGS
    except ImportError:
        print("[SEARCH] ddgs 未安裝, pip install ddgs")
        return []
    try:
        with DDGS() as ddgs:
            results = ddgs.text(query, max_results=max_results)
        return [
            {"title": r.get("title", ""), "url": r.get("href", ""), "snippet": r.get("body", "")}
            for r in results
        ]
    except Exception as e:
        print(f"[SEARCH_FAIL] {e}")
        return []


# ── Fetch (asyncio.to_thread 並發) ────────────────────────────
async def fetch_url(url: str, semaphore: asyncio.Semaphore) -> dict:
    """單頁抓取 (thread pool + semaphore)"""
    async with semaphore:
        def _fetch():
            try:
                r = requests.get(url, timeout=8, headers={"User-Agent": "Mozilla/5.0"})
                r.raise_for_status()
                soup = BeautifulSoup(r.text, "html.parser")
                for s in soup(["script", "style", "nav", "footer"]):
                    s.extract()
                text = " ".join(soup.stripped_strings)[:3000]
                return {"url": url, "text": text}
            except Exception as e:
                return {"url": url, "text": "", "error": str(e)}
        return await asyncio.to_thread(_fetch)


async def fetch_all(urls: list[str], concurrency: int = 6) -> list[dict]:
    """並發抓所有 URL"""
    sem = asyncio.Semaphore(concurrency)
    tasks = [fetch_url(u, sem) for u in urls if u]
    return await asyncio.gather(*tasks)


# ── Analyze (啟發式關鍵字萃取 personalization 信號) ──────────
def analyze_page(page: dict, factors: list[dict]) -> dict:
    """從網頁萃取 personalization 信號 (啟發式, 免 LLM 結構化 — CPU 推論慢)

    設計: 免費算立環境下 LLM 結構化對長文本太慢 (>45s/頁),
    改用啟發式關鍵字 + 公司/專案識別, 可靠且即時。
    Draft 階段仍用 LLM (短 prompt, 快) 引用這些信號。
    """
    text = page.get("text", "")
    if not text:
        return {"url": page["url"], "signals": []}
    low = text.lower()
    kw = []
    # 公司 / 機構
    orgs = ["Anthropic", "OpenAI", "Google", "DeepMind", "Meta", "Microsoft",
            "Stanford", "MIT", "Berkeley", "CMU", "Tsinghua", "Peking", "Tencent", "Alibaba"]
    for o in orgs:
        if o.lower() in low:
            kw.append(o)
    # 角色 / 成就
    roles = ["founder", "co-founder", "CTO", "CEO", "lead", "principal",
             "phd", "researcher", "scientist", "professor", "author", "speaker"]
    for r in roles:
        if r.lower() in low:
            kw.append(r)
    # 技術 / 興趣
    tech = ["transformer", "rlhf", "rag", "llm", "diffusion", "agent", "ml", "deep learning"]
    for t in tech:
        if t.lower() in low:
            kw.append(t)
    if not kw:
        return {"url": page["url"], "signals": []}
    # 去重, 取前 4
    seen = []
    for k in kw:
        if k.lower() not in [s.lower() for s in seen]:
            seen.append(k)
    seen = seen[:4]
    return {
        "url": page["url"],
        "signals": [{
            "dimension": "recent_work",
            "evidence": f"頁面提及: {', '.join(seen)}",
            "quote": "",
        }],
    }


# ── Draft (依信號 + 簡歷寫郵件) ───────────────────────────────
def draft_email(shared: dict, signals: list[dict], critique: str = "") -> str:
    """寫冷郵件, 挑 2-3 最相關憑證"""
    inp = shared["input"]
    sig_flat = json.dumps(signals, ensure_ascii=False)[:1500]
    critique_note = f"\n\n上次評分過低, 改進建議: {critique}" if critique else ""
    prompt = f"""你是 {inp.get('sender_bio', '一位專業人士')}。
寫一封給 {inp['first_name']} {inp['last_name']} 的冷郵件, 目標: {inp['target_role']}。

你的簡歷:
{inp.get('resume', inp.get('sender_bio', ''))[:1500]}

關於對方的真實信號 (從網路研究):
{sig_flat}

要求:
1. 開頭具體引用對方 1 個真實經歷 (非泛稱)
2. 挑你簡歷中 2-3 個最相關憑證, 自然連結
3. 簡潔 (<150 字), 真誠不推銷
4. 結尾輕量 CTA{critique_note}

只回郵件正文 (勿標 'Subject'/'Dear')。"""
    return call_ollama(prompt)


# ── Eval (評分 + critique) ────────────────────────────────────
def eval_email(email: str, signals: list[dict]) -> tuple[int, str]:
    """評 specificity/authenticity/conciseness (0-10), 回 (總分, critique)"""
    sig_flat = json.dumps(signals, ensure_ascii=False)[:800]
    prompt = f"""評此冷郵件 (針對下方信號)。
信號: {sig_flat}
郵件: {email}

評三維各 0-10: specificity(引用具體嗎) / authenticity(真誠嗎) / conciseness(簡潔嗎)。
若總分 <21, 給一句改進 critique。"""
    schema = '{"specificity": int, "authenticity": int, "conciseness": int, "critique": str}'
    r = call_ollama_structured(prompt, schema)
    total = (r.get("specificity", 0) + r.get("authenticity", 0) + r.get("conciseness", 0))
    return total, r.get("critique", "")


# ── 主流程 ────────────────────────────────────────────────────
async def run(shared: dict) -> dict:
    inp = shared["input"]
    query = f"{inp['first_name']} {inp['last_name']} {inp['keywords']}"
    print(f"[SEARCH] {query}")
    results = search_duckduckgo(query)
    urls = [r["url"] for r in results if r["url"]]
    print(f"[FETCH] {len(urls)} URLs (並發)")
    pages = await fetch_all(urls)
    pages = [p for p in pages if p.get("text")]

    print(f"[ANALYZE] {len(pages)} 頁")
    signals = []
    for p in pages:
        a = analyze_page(p, inp["personalization_factors"])
        if a.get("signals"):
            signals.extend(a["signals"])
    print(f"[SIGNALS] {len(signals)} 條")

    critique = ""
    email = ""
    for attempt in range(3):  # 0,1,2 (cap 2 retries)
        print(f"[DRAFT] attempt {attempt+1}")
        email = draft_email(shared, signals, critique)
        score, critique = eval_email(email, signals)
        print(f"[EVAL] score={score}/30 critique={critique[:60]}")
        if score >= 21:
            break
    return {"email": email, "signals": signals, "score": score}


def main():
    shared = {
        "input": {
            "first_name": "Jane", "last_name": "Smith",
            "keywords": "Anthropic research engineering",
            "resume": "MS CS, 2yr ML infra at startup, built RAG pipelines.",
            "target_role": "a research engineering role at Anthropic",
            "personalization_factors": [
                {"name": "recent_work", "description": "近期專案/論文/演講", "action": "具體引用"},
                {"name": "shared_interest", "description": "重疊技術興趣", "action": "點名重疊"},
                {"name": "alumni_connection", "description": "同校/實驗室", "action": "自然帶過"},
            ],
        }
    }
    res = asyncio.run(run(shared))
    print("\n" + "=" * 50)
    print("EMAIL DRAFT:")
    print(res["email"])
    print(f"\nSCORE: {res['score']}/30 | SIGNALS USED: {len(res['signals'])}")


if __name__ == "__main__":
    main()
