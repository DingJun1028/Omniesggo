import asyncio, hashlib, shutil, subprocess, tempfile, os, sys
from pathlib import Path

BRAND = {"deep_blue":"#10243f","warm_gold":"#c9a24b","cream":"#f3ede1","green":"#3c6e47"}
W, H, FPS = 1920, 1080, 30
FFMPEG = r"C:\Users\dingj\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.1-full_build\bin\ffmpeg.exe"
FFPROBE = r"C:\Users\dingj\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.1-full_build\bin\ffprobe.exe"

SCENES = [
    {"id":"intro",    "title":"2026 Berkeley ESG",              "subtitle":"國際永續策略與創新人才培訓課程",           "speaker":"楊坤修 博士",
     "narration":"大家好，歡迎來到 2026 Berkeley ESG 國際永續策略與創新人才培訓課程秋季班。"},
    {"id":"overview", "title":"課程特色",                        "subtitle":"理論 × 實戰 × 國際視野",                   "speaker":"",
     "narration":"課程內容涵蓋 ESG 策略規劃、永續報告書編製、碳盤查實務、綠色金融創新，以及國際永續案例分享。"},
    {"id":"topics",   "title":"五大核心模組",                    "subtitle":"",                                        "speaker":"",
     "narration":"課程包含五大核心模組：第一，ESG 基礎理論與國際趨勢。第二，永續報告書編製與確信。第三，碳盤查與淨零路徑規劃。"},
    {"id":"audience", "title":"適合對象",                        "subtitle":"",                                        "speaker":"",
     "narration":"本課程適合企業永續主管、財務人員、風險管理專業人士、投資人，以及有志於從事永續工作的各界人士參與。"},
    {"id":"details",  "title":"課程資訊",                        "subtitle":"2026 秋季班 ‧ 九週 ‧ 三小時/週",         "speaker":"加州大學柏克萊分校 結業證書",
     "narration":"課程時間為 2026 年秋季，共九週，每週三小時。結業通過者將頒授加州大學柏克萊分校結業證書。"},
    {"id":"cta",      "title":"立即報名",                        "subtitle":"名額有限 ‧ 把握機會",                     "speaker":"",
     "narration":"現在報名，掌握國際永續趨勢，成為企業最需要的永續人才。期待與您相見！"},
]

def ass_color(hex_str):
    h = hex_str.lstrip('#')
    return f"&H00{h[4:6]}{h[2:4]}{h[0:2]}".upper()

def make_ass(scene, ass_path, duration):
    gold = ass_color(BRAND["warm_gold"])
    cream = ass_color(BRAND["cream"])
    lines = [
        "[Script Info]", "ScriptType: v4.00+", f"PlayResX: {W}", f"PlayResY: {H}",
        "ScaledBorderAndShadow: yes", "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, Backcare, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
        f"Style: Title,Microsoft JhengHei,80,{gold},&H000000FF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,3,0,2,100,100,340,1",
        f"Style: Subtitle,Microsoft JhengHei,48,{cream},&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,100,100,460,1",
        f"Style: Speaker,Microsoft JhengHei,40,{gold},&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,100,100,920,1",
        "", "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ]
    dur_h = int(duration)
    dur_m = int((duration - dur_h) * 60)
    dur_s = int((duration * 3600) % 60)
    dur_f = int((duration * 360000) % 100)
    time_str = f"0:00:{dur_h:02d}.{dur_f:02d}"
    lines.append(f"Dialogue: 0,0:00:00.00,{time_str},Title,,0,0,0,,{scene['title']}")
    if scene.get('subtitle'):
        lines.append(f"Dialogue: 0,0:00:00.00,{time_str},Subtitle,,0,0,0,,{scene['subtitle']}")
    if scene.get('speaker'):
        lines.append(f"Dialogue: 0,0:00:00.00,{time_str},Speaker,,0,0,0,,{scene['speaker']}")
    ass_path.write_text("\n".join(lines), encoding="utf-8")

def get_duration(path):
    cmd = [FFPROBE,"-v","quiet","-show_entries","format=duration","-of","csv=p=0", str(path)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    try: return float(r.stdout.strip())
    except: return 10.0

async def gen_narration(text, out):
    import edge_tts
    comm = edge_tts.Communicate(text, "zh-TW-YunJheNeural")
    await comm.save(str(out))

def build_scene(scene, out, ass_path):
    ass_name = ass_path.name
    work_dir = ass_path.parent
    vf = f"color=c={BRAND['deep_blue']}:s={W}x{H}:d={scene['duration']}:r={FPS},subtitles=f={ass_name}"
    cmd = [FFMPEG,"-y","-f","lavfi","-i", vf, "-c:v","libx264","-preset","fast","-pix_fmt","yuv420p","-an", str(out)]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=120, cwd=str(work_dir))
    if r.returncode != 0:
        print(f"    ERR: {r.stderr[-400:]}")
    return r.returncode == 0

def concat_clips(clips, output):
    list_file = clips[0].parent / "list.txt"
    list_file.write_text("\n".join(f"file '{c}'" for c in clips), encoding="utf-8")
    cmd = [FFMPEG,"-y","-f","concat","-safe","0","-i",str(list_file),"-c","copy",str(output)]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if r.returncode != 0:
        print(f"  concat ERR: {r.stderr[-400:]}")
    return r.returncode == 0

async def main():
    print("=== AI Station v5: ASS + TTS ===")
    work = Path(tempfile.mkdtemp(prefix="v5_"))
    clips, nars = [], []

    for i, scene in enumerate(SCENES):
        print(f"[{i+1}/{len(SCENES)}] {scene['title']}")
        nar = work / f"nar_{i:02d}.mp3"
        try:
            await gen_narration(scene["narration"], nar)
            nars.append(nar)
            scene["duration"] = get_duration(nar)
            print(f"  nar {scene['duration']:.1f}s")
        except Exception as e:
            print(f"  nar fail {e}, 10s fallback")
            scene["duration"] = 10

        ass = work / f"ass_{i:02d}.ass"
        make_ass(scene, ass, scene["duration"])
        clip = work / f"clip_{i:02d}.mp4"
        ok = build_scene(scene, clip, ass)
        if ok and clip.exists():
            clips.append(clip)
            print(f"  clip OK {clip.stat().st_size/1024:.0f}KB")
        else:
            print(f"  clip FAIL")

    if not clips:
        print("no clips"); return

    temp_mp4 = work / "concat.mp4"
    print(f"\nconcat {len(clips)} clips...")
    if not concat_clips(clips, temp_mp4):
        print("concat failed"); return

    final = Path.home() / "aistation_output" / "berkeley_esg_promo_v5.mp4"
    final.parent.mkdir(parents=True, exist_ok=True)

    if nars:
        # Concat audio separately, then mux
        audio_list = work / "audio_list.txt"
        audio_list.write_text("\n".join(f"file '{n.name}'" for n in nars), encoding="utf-8")
        temp_audio = work / "audio_concat.mp3"
        cmd = [FFMPEG,"-y","-f","concat","-safe","0","-i",str(audio_list),"-c","copy",str(temp_audio)]
        r = subprocess.run(cmd, capture_output=True, text=True, cwd=str(work), timeout=60)
        if r.returncode != 0:
            print(f"audio concat ERR: {r.stderr[-300:]}")
            # fallback: use first audio only
            temp_audio = nars[0]

        cmd = [FFMPEG,"-y","-i",str(temp_mp4),"-i",str(temp_audio),
               "-c:v","copy","-c:a","aac","-b:a","128k","-shortest","-movflags","+faststart", str(final)]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if r.returncode != 0:
            print(f"mux ERR: {r.stderr[-500:]}")
            return
    else:
        shutil.copy(str(temp_mp4), str(final))

    size = final.stat().st_size / (1024*1024)
    sha = hashlib.sha256(final.read_bytes()).hexdigest()[:32]
    print(f"\nDONE! {final}")
    print(f"  size: {size:.1f}MB  SHA: {sha}")

asyncio.run(main())
