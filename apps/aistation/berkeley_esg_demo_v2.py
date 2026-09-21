import subprocess
from pathlib import Path
from tempfile import mkdtemp

BRAND = {"deep_blue":"#10243f","warm_gold":"#c9a24b"}

class EnhancedOrchestrator:
    def __init__(self, wd=None):
        self.wd = Path(wd or mkdtemp(prefix="aistation_"))
        self.wd.mkdir(parents=True, exist_ok=True)

    def process_template(self, ttype, params, output_name="output.mp4"):
        duration = float(params.get("duration", 60))
        w, h = 1920, 1080
        out = self.wd / output_name
        vf = f"color=c={BRAND['deep_blue'][1:]}:s={w}x{h}:d={duration}[v];"
        vf += f"drawtext=text='{params.get('title','')}':fontcolor={BRAND['warm_gold']}:fontsize=48:x=100:y=100"
        cmd = ["ffmpeg","-y","-f","lavfi","-i",f"color=c={BRAND['deep_blue'][1:]}:s={w}x{h}:d={duration}",
            "-vf",vf,"-c:v","libx264","-preset","ultrafast","-pix_fmt","yuv420p","-an",str(out)]
        print("Running:"," ".join(cmd))
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        print("stdout:", r.stdout)
        print("stderr:", r.stderr[-2000:] if r.stderr else "")
        if r.returncode != 0: print("RETURN CODE:", r.returncode)
        return out

if __name__ == "__main__":
    cfg = {"title":"2026 Berkeley ESG 國際永續策略與創新人才培訓課程秋季班","speaker":"楊坤修 博士","duration":558.0}
    o = EnhancedOrchestrator(Path.home()/"aistation_output")
    o.process_template("keynote", cfg, "berkeley_esg_promo.mp4")
