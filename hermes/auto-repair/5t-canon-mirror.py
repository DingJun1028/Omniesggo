#!/usr/bin/env python3
"""5t-canon-mirror.py — Herme cron 友善的 mirror wrapper
直接讀 .hermes/5t-canon/ 所有 .json + MOC,呼叫 PowerShell mirror 到 Obsidian vault
不依賴 ps1,但若主機有 ps1 也呼叫
"""
import os, sys, json, shutil, subprocess, datetime, glob

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "5t-canon")
SRC = os.path.abspath(SRC)
DST_WIN = r"D:\Obsidian Vault\AI Research\5t-canon"

def try_powershell():
    """若 PS1 存在,呼叫它"""
    ps1 = os.path.join(os.path.dirname(__file__), "5t-canon-mirror.ps1")
    if not os.path.exists(ps1):
        return None
    try:
        r = subprocess.run(
            ["powershell","-ExecutionPolicy","Bypass","-File", ps1],
            capture_output=True, text=True, timeout=30
        )
        return {"exit": r.returncode, "stdout": r.stdout, "stderr": r.stderr}
    except Exception as e:
        return {"exit": -1, "error": str(e)}

def mirror_python():
    """純 Python fallback(沙箱或 PS 不通時)"""
    # Windows host 直接 shutil;沙箱若 D: 不可見就跳過
    dst = DST_WIN
    try:
        os.makedirs(dst, exist_ok=True)
    except Exception as e:
        return {"exit": 2, "error": f"DST not accessible: {e}", "fallback": True}
    copied = []
    for src_file in glob.glob(os.path.join(SRC, "*.json")) + glob.glob(os.path.join(SRC, "MOC-*.md")):
        fn = os.path.basename(src_file)
        shutil.copy2(src_file, os.path.join(dst, fn))
        copied.append(fn)
    return {"exit": 0, "copied": copied, "dst": dst}

def main():
    result = try_powershell()
    if result is None or result.get("exit") != 0:
        # PS1 不存在或失敗 → 用 Python fallback
        if result:
            print(f"[ps1] exit={result['exit']}: {result.get('stderr','')[:100]}")
        py_result = mirror_python()
        if py_result.get("fallback"):
            print(f"[skip] {py_result['error']}")
            print("[hint] 沙箱看不到 D:,請在 Windows host 直接跑 mirror")
            return 0  # 不算失敗
        print(f"[python mirror] copied {len(py_result['copied'])} files")
        for f in py_result['copied']:
            print(f"  → {f}")
        return py_result['exit']
    print(f"[ps1] exit={result['exit']}")
    print(result['stdout'][:500])
    return result['exit']

if __name__ == "__main__":
    sys.exit(main())
