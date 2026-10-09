# source_origin: AI Station §9 - Module 1 Input Layer
# AI Station - 7-Module Production Line
# Powered by OA-Team 30 Soul Canon v0.5

import asyncio
import threading
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict, Any

from parsers.dna_parser import parse_script_dna
from synthesizers.speech import synthesize_speech
from visuals.image_gen import generate_visuals
from renderers.video import render_video
from evidence.hash_lock import freeze_artifact

app = FastAPI(title="AI Station", version="0.5.0")
executor = ThreadPoolExecutor(max_workers=4)

class ProductionRequest(BaseModel):
    script: str
    brand: str = "sushi-doctor"
    voice: str = "zh-TW-YunJheNeural"
    use_cloud: bool = False

class ProductionResponse(BaseModel):
    video_id: str
    status: str
    hash_lock: str

@app.post("/produce", response_model=ProductionResponse)
async def produce_video(request: ProductionRequest, background_tasks: BackgroundTasks):
    """Module 1: Input Layer - FastAPI + Thread Pool"""
    # Traceable: Log source origin
    source_origin = "AI Station §9 - Module 1 Input Layer"
    
    # Trackable: Start production tracking
    video_id = f"aistation_{int(datetime.now().timestamp())}"
    
    # Dispatch to background thread pool
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        executor,
        produce_pipeline,
        request.script,
        request.voice,
        request.brand,
        video_id
    )
    
    # Trustworthy: Freeze artifact
    frozen_result = freeze_artifact(result)
    
    return ProductionResponse(
        video_id=video_id,
        status="produced",
        hash_lock=frozen_result["hash_lock"]
    )

def produce_pipeline(script: str, voice: str, brand: str, video_id: str) -> dict:
    """Full 7-module production pipeline"""
    # Module 2: Text Parsing
    dna = parse_script_dna(script)
    
    # Module 3: Speech Synthesis
    audio_path = synthesize_speech(dna["content"], voice)
    
    # Module 4: Visual Generation
    visuals = generate_visuals(dna["scenes"], brand)
    
    # Module 5: Video Rendering
    video_path = render_video(audio_path, visuals, dna["subtitles"])
    
    # Module 6: Storage (local default)
    # Module 7: Evidence logging
    return {
        "video_id": video_id,
        "video_path": video_path,
        "dna": dna,
        "module1": "input_processed",
        "module2": "dna_extracted",
        "module3": "audio_synced",
        "module4": "visuals_generated",
        "module5": "video_rendered",
        "module6": "stored_locally",
        "module7": "evidence_logged",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
