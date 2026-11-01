#!/usr/bin/env python3
"""
ESG-GO Capability Explorer — 倉庫能力掃描與展現
Scans the actual repo and renders a browsable capability dashboard (dev-time)
with a live runtime-demo hook (system). 融會貫通: maps every capability to
soul.md canon (30 蜂群 / 12 大萬能 / 5T).

Usage:
    python capability_explorer.py                 # scan + render HTML to ./capability-dashboard.html
    python capability_explorer.py --json          # also emit capabilities.json
    python capability_explorer.py --demo esg-swarm  # runtime: invoke a Mistral workflow capability
"""
from __future__ import annotations
import json, os, re, sys, glob, html
from pathlib import Path

REPO = Path(os.environ.get("ESG_REPO", Path(__file__).resolve().parent.parent.parent))

# ---- Curated canon mappings (from docs/soul.md + packages/omni-arch) ----
THIRTY_AGENTS = [
    ("01","萬能蜂后","Queen Bee","策略組","指揮 / 編排","全蜂群總指揮，萬有引力協作協定發起者"),
    ("02","萬能記憶蜂","Hindsight","策略組","記憶召回","永憶聖所，95% 召回率"),
    ("03","萬能知識蜂","Knowledge","策略組","知識管理","中央知識聖所"),
    ("04","萬能脈絡蜂","Context","策略組","脈絡管理","時序上下文壓縮"),
    ("05","萬能標籤蜂","OmniTag","策略組","標籤分類","全域語義分類 6 維"),
    ("06","萬能結界蜂","Barrier","策略組","結界繼承","最佳實踐覺結界"),
    ("07","萬能編碼蜂","Coder","符文契約","全端開發","Traceable 代碼產出"),
    ("08","萬能 API 蜂","API","符文契約","API 設計","跨平台能力封裝"),
    ("09","萬能 ZKP 蜂","ZKP","符文契約","零知識證明","可驗算不可篡改"),
    ("10","萬能合約蜂","Contract","符文契約","契約簽署","TypeBox 契約正本"),
    ("11","萬能安全蜂","Security","符文契約","安全防護","OmniGateway 屏障"),
    ("12","萬能測試蜂","Tester","符文契約","測試守門","零幻覺驗算"),
    ("13","萬能動畫蜂","Animator","光之羽翼","動畫特效","可追蹤動畫資產"),
    ("14","萬能 VPS 蜂","VPS","光之羽翼","VPS 維運","Oracle VPS 守門"),
    ("15","萬能 Docker 蜂","Docker","光之羽翼","容器化","镜像 / 部署"),
    ("16","萬能 CI-CD 蜂","CI-CD","光之羽翼","管線自動化","5T Hyper-Awakened Gatekeeper"),
    ("17","萬能 Cron 蜂","Cron","光之羽翼","排程","定時自動化"),
    ("18","萬能部署蜂","Deploy","光之羽翼","部署上線","Cloudflare / VPS 部署"),
    ("19","萬能重構蜂","Refactor","煉金熵減","重構","技術債消除"),
    ("20","萬能 Lint 蜂","Lint","煉金熵減","程式碼品質","lint 守門"),
    ("21","萬能效能蜂","Perf","煉金熵減","效能優化","延遲 / 吞吐量"),
    ("22","萬能熵減蜂","Entropy","煉金熵減","熵減煉金","秩序是蜂群的產物"),
    ("23","萬能清理蜂","Cleaner","煉金熵減","清理","死碼 / 冗餘"),
    ("24","萬能自動化蜂","Automation","煉金熵減","自動化","五層自動化維度"),
    ("25","萬能 ISO 蜂","ISO","5T驗算","合規稽核","ISO-14064-1 存證"),
    ("26","萬能 Hash 蜂","HashLock","5T驗算","Hash Lock","Trustworthy 凍結"),
    ("27","萬能 UUID 蜂","UUID","5T驗算","唯一 ID","Traceable 溯源"),
    ("28","萬能調度蜂","Scheduler","5T驗算","調度","終始矩陣閉環"),
    ("29","萬能質控蜂","QC","5T驗算","品質控制","零幻覺驗算閘"),
    ("30","萬能恢復蜂","Recovery","5T驗算","災難恢復","RTO≤2h RPO=0"),
]
TWELVE_ARCH = [
    ("OmniBase","物理母體 + 運行時上下文","🧠 OmniBrain","base.ts"),
    ("OmniMemory","中央知識聖所 95% 召回","🧠 OmniBrain","memory.ts"),
    ("OmniTime","時間序列 + 事件重放","🧠 OmniBrain","time.ts"),
    ("OmniComponent","最小靜態單元 uuid/version","🌐 維度二","component.ts"),
    ("OmniTag","全域語義分類 6 維","🌐 維度二","tag.ts"),
    ("OmniEvidence","獨立合規存證 Hash Lock","🌐 維度二","evidence.ts"),
    ("OmniAgent","智慧代理純決策執行緒","⚡ 維度三","agent.ts"),
    ("OmniAPI","跨平台能力封裝","⚡ 維度三","api.ts"),
    ("OmniBus","異步事件中樞 + 背壓","⚡ 維度三","bus.ts"),
    ("OmniGateway","安全屏障 + Hash Lock","🛡 維度四","gateway.ts"),
    ("OmniHealing","主動免疫 + 混沌自癒","🛡 維度四","healing.ts"),
    ("OmniEvolution","熵減引擎 + 技術債獻祭","🛡 維度四","evolution.ts"),
    ("OmniHeart","全通之心 Eye/Core/Pulse/Bone","🫀 OmniHeart","heart.ts"),
    ("OmniHive","黑板投標 swarm bidding","🐝 canon §7","hive.ts"),
    ("OmniProphet","多宇宙預取 prefetch","🐝 canon §7","prophet.ts"),
]

def read(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return ""

def scan_packages() -> list[dict]:
    out = []
    for d in sorted(glob.glob(str(REPO / "packages" / "*"))):
        pj = Path(d) / "package.json"
        if not pj.exists():
            continue
        try:
            j = json.loads(pj.read_text(encoding="utf-8", errors="replace"))
        except Exception:
            j = {}
        src = sorted(glob.glob(str(Path(d) / "src" / "*.ts")))
        out.append({
            "name": j.get("name", Path(d).name), "pkg": Path(d).name,
            "desc": (j.get("description") or "").strip(),
            "modules": [Path(s).stem for s in src],
            "module_count": len(src),
        })
    return out

def scan_apps() -> list[dict]:
    out = []
    for d in sorted(glob.glob(str(REPO / "apps" / "*"))):
        if not Path(d).is_dir():
            continue
        pj = Path(d) / "package.json"
        py = Path(d) / "pyproject.toml"
        worker = Path(d) / "worker.py"
        kind = "TS" if pj.exists() else ("Python" if py.exists() else "?")
        out.append({
            "name": Path(d).name, "kind": kind,
            "mistral_workflow": worker.exists(),
            "has_cli": (Path(d) / "cli.py").exists() or (Path(d) / "cli" / "__init__.py").exists(),
        })
    return out

def scan_skills() -> list[dict]:
    out = []
    for d in sorted(glob.glob(str(REPO / "agents" / "skills" / "*"))):
        sk = Path(d) / "SKILL.md"
        if not sk.exists():
            continue
        txt = read(sk)
        m = re.search(r"^description:\s*(.+)$", txt, re.M)
        desc = re.sub(r"[\#*`]", "", m.group(1)).strip()[:90] if m else ""
        out.append({"name": Path(d).name, "desc": desc})
    return out

def scan_workflows() -> list[dict]:
    out = []
    for w in sorted(glob.glob(str(REPO / "apps" / "*" / "worker.py"))):
        txt = read(Path(w))
        m = re.search(r'DEPLOYMENT_NAME\s*=\s*["\']([^"\']+)["\']', txt)
        name = m.group(1) if m else Path(w).parent.name
        reg = bool(re.search(r"register_workflow|WorkflowRegistry|register\(", txt))
        out.append({"name": name, "app": Path(w).parent.name, "registered": reg})
    return out

def build() -> dict:
    pkgs, apps, skills, wfs = scan_packages(), scan_apps(), scan_skills(), scan_workflows()
    return {
        "repo": REPO.name,
        "generated": __import__("datetime").datetime.now().strftime("%Y-%m-%d %H:%M"),
        "counts": {"packages": len(pkgs), "apps": len(apps), "skills": len(skills),
                   "agents": len(THIRTY_AGENTS), "arch": len(TWELVE_ARCH), "workflows": len(wfs)},
        "packages": pkgs, "apps": apps, "skills": skills, "workflows": wfs,
    }

def render(data: dict) -> str:
    c = data["counts"]
    def esc(s): return html.escape(str(s))
    # capability cards
    arch_cards = "".join(
        f'<div class="card"><b>{esc(a[0])}</b><div class="m">{esc(a[1])}</div>'
        f'<div class="tag {esc(a[2][:2])}">{esc(a[2])}</div><div class="f">{esc(a[3])}</div></div>'
        for a in TWELVE_ARCH)
    agent_rows = "".join(
        f'<tr><td>{esc(n)}</td><td>{esc(r[1])}</td><td><code>{esc(r[2])}</code></td>'
        f'<td>{esc(r[3])}</td><td>{esc(r[4])}</td><td class="d">{esc(r[5])}</td></tr>'
        for n, r in zip(range(1, 31), THIRTY_AGENTS))
    pkg_rows = "".join(
        f'<tr><td><code>{esc(p["name"])}</code></td><td class="d">{esc(p["desc"])}</td>'
        f'<td class="n">{p["module_count"]}</td></tr>' for p in data["packages"])
    app_rows = "".join(
        f'<tr><td>{esc(a["name"])}</td><td><span class="k {esc(a["kind"].lower())}">{esc(a["kind"])}</span></td>'
        f'<td>{"🐝" if a["mistral_workflow"] else ""}</td></tr>' for a in data["apps"])
    skill_rows = "".join(
        f'<tr><td>{esc(s["name"])}</td><td class="d">{esc(s["desc"])}</td></tr>' for s in data["skills"])
    wf_rows = "".join(
        f'<tr><td><code>{esc(w["name"])}</code></td><td>{esc(w["app"])}</td>'
        f'<td>{"✅" if w["registered"] else ""}</td>'
        f'<td><button onclick="demo(\x27{esc(w["name"])}\x27)">▶ run</button></td></tr>' for w in data["workflows"])
    cc = "".join(f'<div class="stat"><div class="num">{c[k]}</div><div>{esc(k)}</div></div>'
                 for k in ["agents","arch","packages","apps","skills","workflows"])
    return f"""<!doctype html><html lang=zh-Hant><head><meta charset=utf-8>
<meta name=viewport content="width=device-width,initial-scale=1">
<title>ESG-GO 能力展現 · Capability Explorer</title>
<style>
:root{{--bg:#0b0f14;--card:#131a22;--bd:#1f2a36;--fg:#e6edf3;--mut:#8b98a5;--acc:#58a6ff;--grn:#3fb950}}
*{{box-sizing:border-box}} body{{margin:0;background:var(--bg);color:var(--fg);
  font:14px/1.5 -apple-system,"Segoe UI",Roboto,"Microsoft JhengHei",sans-serif}}
.wrap{{max-width:1200px;margin:0 auto;padding:24px}}
h1{{font-size:22px;margin:0 0 4px}} .sub{{color:var(--mut);margin-bottom:18px}}
.stats{{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0}}
.stat{{background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:12px 18px;min-width:90px;text-align:center}}
.num{{font-size:26px;font-weight:700;color:var(--acc)}} .stat div:last-child{{color:var(--mut);font-size:12px}}
h2{{font-size:16px;margin:26px 0 10px;border-left:3px solid var(--acc);padding-left:8px}}
table{{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--bd);border-radius:8px;overflow:hidden}}
th,td{{text-align:left;padding:8px 10px;border-bottom:1px solid var(--bd)}} th{{color:var(--mut);font-weight:600;font-size:12px;text-transform:uppercase}}
td.d{{color:var(--mut)}} td.n{{text-align:center}} code{{background:#0d1117;padding:1px 5px;border-radius:4px;font-size:12px}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}}
.card{{background:var(--card);border:1px solid var(--bd);border-radius:8px;padding:10px 12px}}
.card b{{font-size:14px}} .card .m{{color:var(--mut);font-size:12px;margin:3px 0}}
.card .f{{color:var(--mut);font-size:11px;margin-top:4px}}
.tag{{display:inline-block;font-size:10px;padding:1px 6px;border-radius:10px;margin-top:4px}}
.tag 🧠,.tag Ba{{background:#1b2a1b;color:#56d364}}.tag 🌐{{background:#1b2433;color:#58a6ff}}
.tag 🛡,.tag Gu{{background:#2d2016;color:#e3b341}}.tag 🫀{{background:#2d1b1b;color:#f85149}}.tag 🐝{{background:#2a2410;color:#d29922}}
.k.ts{{background:#1b2433;color:#58a6ff}}.k.python{{background:#1b2a1b;color:#56d364}}.k.?{{background:#2a2a2a;color:#8b98a5}}
button{{background:var(--acc);color:#fff;border:0;border-radius:6px;padding:3px 10px;cursor:pointer;font-size:12px}}
button:hover{{filter:brightness(1.1)}} #out{{background:#0d1117;border:1px solid var(--bd);border-radius:8px;padding:12px;
  margin-top:10px;white-space:pre-wrap;font-family:ui-monospace,Consolas,monospace;min-height:20px;color:var(--grn)}}
details{{background:var(--card);border:1px solid var(--bd);border-radius:8px;padding:8px 12px;margin:8px 0}}
</style></head><body><div class=wrap>
<h1>🐝 ESG-GO 能力展現 · Capability Explorer</h1>
<div class=sub>倉庫：<code>{esc(data["repo"])}</code> ｜ 掃描：<code>{esc(data["generated"])}</code> ｜ 融會貫通 soul.md 正典（30 蜂群 · 12 大萬能 · 5T）</div>
<div class=stats>{cc}</div>

<h2>🫀🧠 12 大萬能架構（omni-arch · 可執行契約）</h2>
<div class=grid>{arch_cards}</div>

<h2>🐝 30 萬能蜂群靈魂（soul.md §二）</h2>
<table><tr><th>#</th><th>靈魂</th><th>英文</th><th>陣列</th><th>職責</th><th>描述</th></tr>{agent_rows}</table>

<h2>📦 @esggo 套件生態（{c["packages"]}）</h2>
<table><tr><th>套件</th><th>描述</th><th>模組</th></tr>{pkg_rows}</table>

<h2>🚀 Apps（{c["apps"]} · 🐝 = Mistral Workflow）</h2>
<table><tr><th>app</th><th>類型</th><th>Workflow</th></tr>{app_rows}</table>

<h2>⚙️ Mistral Studio Workflows（runtime 可執行）</h2>
<table><tr><th>workflow</th><th>app</th><th>註冊</th><th>執行</th></tr>{wf_rows}</table>
<div id=out>▶ 點選 workflow 的 run 按鈕，即時展現系統執行能力（runtime）。</div>

<h2>📚 技能集（{c["skills"]} · agents/skills）</h2>
<details open><summary>展開 {c["skills"]} 個技能</summary>
<table style="margin-top:8px"><tr><th>技能</th><th>說明</th></tr>{skill_rows}</table></details>

<h2>🛠 開發期用法（dev-time）</h2>
<pre>python capability_explorer.py                  # 重新掃描 + 重生成本頁
python capability_explorer.py --json           # 輸出 capabilities.json（程式化存取）
python capability_explorer.py --demo esg-swarm # runtime：即時執行 ESG swarm 能力</pre>
</div>
<script>
async function demo(name){{
  const out=document.getElementById('out'); out.textContent='⏳ 執行 {esc(data["repo"])} · '+name+' …';
  try{{
    const r=await fetch('/__demo?workflow='+encodeURIComponent(name));
    const j=await r.json(); out.textContent=(j.ok?'✅ ':'❌ ')+j.text;
  }}catch(e){{ out.textContent='ℹ️ 瀏覽器端請改用 CLI：python capability_explorer.py --demo '+name; }}
}}
</script></body></html>"""

def demo_run(name: str) -> dict:
    """Runtime: invoke a Mistral workflow capability (esg-swarm)."""
    app = REPO / "apps" / (name if (REPO / "apps" / name).is_dir() else "esg-swarm")
    if not (app / "run_local.py").exists():
        return {"ok": False, "text": f"no run_local.py in {app.name}"}
    # mistralai lives in the dev venv, not the repo default python
    venv_py = Path(os.environ.get(
        "ESG_SWARM_PY",
        r"C:\Users\Administrator\Documents\Project\mistral-workflows\.venv\Scripts\python.exe"))
    py = str(venv_py if venv_py.exists() else sys.executable)
    import subprocess
    try:
        p = subprocess.run([py, "run_local.py"], cwd=str(app),
                           capture_output=True, text=True, timeout=240)
        tail = (p.stdout + p.stderr).strip().splitlines()[-8:]
        return {"ok": p.returncode == 0, "text": "\n".join(tail)}
    except Exception as e:
        return {"ok": False, "text": f"{type(e).__name__}: {e}"}

def main():
    args = sys.argv[1:]
    data = build()
    if "--json" in args:
        (REPO / "tools" / "capability-explorer" / "capabilities.json").write_text(
            json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    if "--demo" in args:
        name = args[args.index("--demo") + 1] if "--demo" in args else "esg-swarm"
        r = demo_run(name)
        print(("OK " if r["ok"] else "FAIL ") + r["text"])
        sys.exit(0 if r["ok"] else 1)
    out = REPO / "tools" / "capability-explorer" / "capability-dashboard.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(render(data), encoding="utf-8")
    print(f"✅ rendered {out}  (packages={data['counts']['packages']} apps={data['counts']['apps']} "
          f"skills={data['counts']['skills']} agents={data['counts']['agents']} arch={data['counts']['arch']})")

if __name__ == "__main__":
    main()
