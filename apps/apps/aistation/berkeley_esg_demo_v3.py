# berkeley_esg_demo_v3.py - 自動 ffmpeg + 中文 drawtext + 真實錯誤
import shutil, subprocess, urllib.request, zipfile
from pathlib import Path

BRAND = {"deep_blue": "0x10243f", "warm_gold": "0xc9a24b"}
FONT = "C\\:/Windows/Fonts/msjh.ttc"
FFMPEG_URL = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
CACHE = Path.home() / ".aistation_ffmpeg"

def find_ffmpeg():
    p = shutil.which("ffmpeg")
    if p: return p
    for c in [CACHE / "bin/ffmpeg.exe", Path(r"C:\ffmpeg\bin\ffmpeg.exe")]:
        if c.exists(): return str(c)
    return None

def download_ffmpeg():
    print("未找到 ffmpeg，自動下載可攜版（~130MB，只需一次）...")
    CACHE.mkdir(exist_ok=True)
    z = CACHE / "ffmpeg.zip"
    urllib.request.urlretrieve(FFMPEG_URL, z)
    with zipfile.ZipFile(z) as f:
        member = [m for m in f.namelist() if m.endswith("bin/ffmpeg.exe")][0]
        f.extract(member, CACHE)
    dst = CACHE / "bin" / "ffmpeg.exe"
    dst.parent.mkdir(exist_ok=True)
    shutil.move(str(CACHE / member), str(dst))
    z.unlink()
    return str(dst)

def render(ffmpeg, title, duration, out):
    w, h = 1920, 1080
    draw = (f"drawtext=fontfile='{FONT}':text='{title}':fontcolor={BRAND['warm_gold']}:fontsize=56:x=100:y=100,"
            f"drawtext=fontfile='{FONT}':text='AI Station':fontcolor={BRAND['warm_gold']}:fontsize=28:x=w-tw-40:y=h-th-40")
    cmd = [ffmpeg, "-y", "-f", "lavfi", "-i", f"color=c={BRAND['deep_blue']}:s={w}x{h}:d={duration}:r=30",
           "-vf", draw, "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-an", str(out)]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    if r.returncode != 0:
        print("ffmpeg 失敗:", r.stderr[-1200:])
        return False
    print(f"完成：{out}（{out.stat().st_size/1e6:.1f} MB）")
    return True

if __name__ == "__main__":
    ff = find_ffmpeg() or download_ffmpeg()
    print("ffmpeg:", ff)
    out = Path.home() / "aistation_output" / "berkeley_esg_promo.mp4"
    out.parent.mkdir(exist_ok=True)
    title = "2026 Berkeley ESG 國際永續策略與創新人才培訓課程秋季班"
    if not render(ff, title, 558.0, out):
        print("降級渲染無字幕純色版...")
        r = subprocess.run([ff, "-y", "-f", "lavfi", "-i", "color=c=0x10243f:s=1920x1080:d=558:r=30",
                            "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-an", str(out)],
                           capture_output=True, text=True, timeout=600)
        print("fallback:", "成功" if r.returncode == 0 else r.stderr[-600:])
