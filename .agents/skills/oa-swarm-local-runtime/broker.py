#!/usr/bin/env python3
"""
broker.py — 5T: traceable, trackable, trustworthy 代理總線
授權: AGPL-3.0
"""

import json
import signal
import sys
import time
from pathlib import Path
from typing import Any, Callable

VERSION_FILE = Path(__file__).parent / "VERSION"

def load_version() -> str:
    try:
        text = VERSION_FILE.read_text(encoding="utf-8")
        for line in text.splitlines():
            if line.startswith("source_origin:"):
                return line.split(":", 1)[1].strip()
    except Exception:
        pass
    return "unknown"

class Broker:
    def __init__(self, name: str):
        self.name = name
        self.tasks: list[dict[str, Any]] = []
        self.observers: list[Callable[[dict[str, Any]], None]] = []

    def subscribe(self, observer: Callable[[dict[str, Any]], None]) -> None:
        self.observers.append(observer)

    def publish(self, event: dict[str, Any]) -> None:
        event["source_origin"] = load_version()
        self.tasks.append(event)
        for obs in self.observers:
            obs(event)

    def subscribe_task(self, task_id: str) -> dict[str, Any] | None:
        for t in reversed(self.tasks):
            if t.get("task_id") == task_id:
                return t
        return None

def main() -> None:
    broker = Broker("local-workflow")
    print(f"Broker initialized: {broker.name} (version {load_version()})", flush=True)

    def _signal_handler(sig, frame):
        print(f"Broker {broker.name} received signal {sig}, flushing tasks...", flush=True)
        for t in broker.tasks:
            print(json.dumps(t, ensure_ascii=False, indent=2), flush=True)
        sys.exit(0)

    signal.signal(signal.SIGTERM, _signal_handler)
    signal.signal(signal.SIGINT, _signal_handler)

    # 模擬輕量任務
    for i in range(1, 4):
        task = {"task_id": f"task-{i}", "status": "pending", "data": f"sample-{i}"}
        broker.publish(task)
        time.sleep(0.05)

    print("Broker tasks flushed", flush=True)

if __name__ == "__main__":
    main()
