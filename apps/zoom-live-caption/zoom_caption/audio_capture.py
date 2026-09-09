"""
audio_capture.py — 雙聲道音訊擷取 (Mic + WASAPI Loopback)
"""
import sounddevice as sd
import numpy as np
import threading
from collections import deque
from typing import Callable, Optional


class AudioCapture:
    """雙聲道音訊擷取器：麥克風 + 喇叭迴路"""

    def __init__(self, sample_rate: int = 16000, block_size: int = 4000,
                 mic_device: Optional[str] = None, loopback_device: Optional[str] = None):
        self.sample_rate = sample_rate
        self.block_size = block_size
        self.mic_device = mic_device
        self.loopback_device = loopback_device
        self._mic_stream = None
        self._loopback_stream = None
        self._running = False
        self._mic_buffer = deque(maxlen=100)
        self._loopback_buffer = deque(maxlen=100)
        self._lock = threading.Lock()

    def list_devices(self) -> list:
        """列出所有音訊裝置"""
        devices = sd.query_devices()
        result = []
        for i, dev in enumerate(devices):
            result.append({
                'index': i,
                'name': dev['name'],
                'max_input_channels': dev['max_input_channels'],
                'max_output_channels': dev['max_output_channels'],
                'default_samplerate': dev['default_samplerate'],
            })
        return result

    def _mic_callback(self, indata: np.ndarray, frames, time_info, status):
        if status:
            print(f"[Mic] status: {status}", flush=True)
        with self._lock:
            self._mic_buffer.append(indata.copy())

    def _loopback_callback(self, indata: np.ndarray, frames, time_info, status):
        if status:
            print(f"[Loopback] status: {status}", flush=True)
        with self._lock:
            self._loopback_buffer.append(indata.copy())

    def start(self):
        """啟動雙聲道擷取"""
        self._running = True

        # 麥克風輸入
        self._mic_stream = sd.InputStream(
            samplerate=self.sample_rate,
            blocksize=self.block_size,
            device=self.mic_device,
            channels=1,
            dtype='float32',
            callback=self._mic_callback,
        )
        self._mic_stream.start()

        # 喇叭迴路 (WASAPI loopback)
        try:
            if self.loopback_device:
                loop_dev = self.loopback_device
            else:
                # 找第一個有 output 的 WASAPI 裝置
                loop_dev = self._find_loopback_device()
            
            self._loopback_stream = sd.InputStream(
                samplerate=self.sample_rate,
                blocksize=self.block_size,
                device=loop_dev,
                channels=1,
                dtype='float32',
                callback=self._loopback_callback,
                wasapi_loopback=True,
            )
            self._loopback_stream.start()
            print(f"[Audio] Loopback started on device: {loop_dev}", flush=True)
        except Exception as e:
            print(f"[Audio] Loopback failed: {e}", flush=True)

        print(f"[Audio] Mic started on device: {self.mic_device or 'default'}", flush=True)

    def _find_loopback_device(self) -> int:
        """找第一個支援 WASAPI loopback 的輸出裝置"""
        devices = sd.query_devices()
        for i, dev in enumerate(devices):
            if dev['max_output_channels'] > 0:
                hostapi = sd.query_hostapis(dev['hostapi'])
                if 'wasapi' in hostapi['name'].lower():
                    return i
        # fallback: 用預設輸出裝置
        return sd.default.device[1]

    def get_mic_audio(self) -> Optional[np.ndarray]:
        """取得麥克風音訊區塊 (無資料回傳 None)"""
        with self._lock:
            if self._mic_buffer:
                return self._mic_buffer.popleft()
        return None

    def get_loopback_audio(self) -> Optional[np.ndarray]:
        """取得喇叭音訊區塊 (無資料回傳 None)"""
        with self._lock:
            if self._loopback_buffer:
                return self._loopback_buffer.popleft()
        return None

    def stop(self):
        """停止擷取"""
        self._running = False
        if self._mic_stream:
            self._mic_stream.stop()
            self._mic_stream.close()
        if self._loopback_stream:
            self._loopback_stream.stop()
            self._loopback_stream.close()
        print("[Audio] Stopped", flush=True)
