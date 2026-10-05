#!/usr/bin/env python3
# source_origin: 萬能分身修復機制（.hermes/auto-repair）— 本輪修三缺陷 + 多步續追
"""
Clone Tracker (萬能分身追蹤器) for esggo Auto-Repair
Tracks repair task progress and sends status updates.
"""

import json
import sys
import time
import uuid
import subprocess
from pathlib import Path
from datetime import datetime

TRACKER_FILE = Path(__file__).parent / "tracker-state.json"
LOG_FILE = Path(__file__).parent / "tracker-log.jsonl"

def gen_task_id() -> str:
    return f"TASK-{uuid.uuid4().hex[:8].upper()}"

def load_state() -> dict:
    if TRACKER_FILE.exists():
        with open(TRACKER_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"active_tasks": {}, "completed_tasks": {}, "failed_tasks": {}}

def save_state(state: dict):
    with open(TRACKER_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)

def log_event(task_id: str, event: str, detail: str = ""):
    entry = {
        "task_id": task_id,
        "timestamp": datetime.now().isoformat(),
        "event": event,
        "detail": detail,
    }
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")

def create_task(description: str, steps: list) -> str:
    """Create a new tracked repair task."""
    state = load_state()
    task_id = gen_task_id()
    state["active_tasks"][task_id] = {
        "description": description,
        "steps": steps,
        "current_step": 0,
        "status": "running",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
    }
    save_state(state)
    log_event(task_id, "CREATED", f"Task created: {description}")
    print(f"🆕 萬能分身啟動 [{task_id}]: {description}")
    return task_id

def update_step(task_id: str, step_index: int, status: str, output: str = ""):
    """Update progress of a specific step."""
    state = load_state()
    task = state["active_tasks"].get(task_id)
    if not task:
        return False

    task["current_step"] = step_index
    task["updated_at"] = datetime.now().isoformat()

    if status == "running":
        step_label = task["steps"][step_index] if step_index < len(task["steps"]) else f"step-{step_index}"
        log_event(task_id, "STEP_START", f"Step {step_index}: {step_label}")
        print(f"  🔄 [{task_id}] Step {step_index}: {step_label}...")
    elif status == "done":
        step_label = task["steps"][step_index] if step_index < len(task["steps"]) else f"step-{step_index}"
        log_event(task_id, "STEP_DONE", f"Step {step_index}: {step_label} ✅")
        print(f"  ✅ [{task_id}] Step {step_index}: {step_label} — 完成")
    elif status == "failed":
        step_label = task["steps"][step_index] if step_index < len(task["steps"]) else f"step-{step_index}"
        log_event(task_id, "STEP_FAILED", f"Step {step_index}: {step_label} ❌ | {output}")
        print(f"  ❌ [{task_id}] Step {step_index}: {step_label} — 失敗: {output[:100]}")

    save_state(state)
    return True

def complete_task(task_id: str, success: bool = True, final_output: str = "", final: bool = True):
    """Mark task as completed, or advance it when not the last step.

    假成功防護：命令回傳碼為 0 但 stdout 為空，代表修復「沒有留下任何證據」。
    舊版仍標記 status=success，導致 tracker-state.json 出現無法證實的
    completed_tasks（實測：TASK-CCA36E1A / TASK-AC526708 皆 final_output 為空）。
    此處改判為 failed，避免監看器與人工都被誤導。

    final=False 時不結案 —— 只更新該步的輸出並留在 active_tasks，
    讓多步任務能逐步追蹤。舊版無論第幾步都呼叫最終結案，導致
    「3 步任務」在 step 0 就被移出 active_tasks，step 1/2 直接報
    "task_id not found in active_tasks"（2026-09-28 實測）。
    """
    state = load_state()
    task = state["active_tasks"].pop(task_id, None)
    if not task:
        return False

    # 非最終步：記錄輸出後放回 active_tasks，維持可續追。
    if not final:
        task["step_outputs"] = task.get("step_outputs", {})
        task["step_outputs"][str(task.get("current_step", 0))] = final_output
        task["updated_at"] = datetime.now().isoformat()
        # 假成功在「每一步」就要攔截，不只在結案時。
        # 否則 3 步任務若前兩步都回傳空輸出，會一路靜默到最後一步才被判失敗，
        # 中間期間監看器看到的是「running 中」而非異常（2026-09-28 實測發現）。
        if success and not (final_output or "").strip():
            task["status"] = "failed"
            task["failed_reason"] = (
                f"步驟 {task.get('current_step', 0)} 命令回傳碼為 0 但輸出為空 —— 無證據顯示修復生效"
            )
            state["failed_tasks"][task_id] = task
            log_event(task_id, "FAILED",
                      f"Step {task.get('current_step', 0)} exited 0 with no output "
                      f"— unverified success, task failed")
            print(f"  ⚠️ [{task_id}] 步驟 {task.get('current_step', 0)} 成功但無輸出 "
                  f"→ 判定為未證實的修復，任務記為失敗")
            escalate(task_id, task)
        else:
            state["active_tasks"][task_id] = task
            log_event(task_id, "STEP_OUTPUT",
                      f"Step {task.get('current_step', 0)} output recorded "
                      f"({len(final_output)} chars), task remains active")
        save_state(state)
        return True

    # 假成功偵測：宣稱成功卻無任何輸出
    unverified_success = success and not (final_output or "").strip()
    if unverified_success:
        task["status"] = "failed"
        task["failed_reason"] = "命令回傳碼為 0 但輸出為空 —— 無證據顯示修復生效"
    else:
        task["status"] = "success" if success else "failed"
    task["completed_at"] = datetime.now().isoformat()
    task["final_output"] = final_output

    if unverified_success:
        state["failed_tasks"][task_id] = task
        log_event(task_id, "FAILED",
                  "Command exited 0 but produced no output — treated as failure (unverified success)")
        print(f"  ⚠️ [{task_id}] 命令成功但無輸出，判定為未證實的修復 → 記為失敗")
        escalate(task_id, task)
    elif success:
        state["completed_tasks"][task_id] = task
        log_event(task_id, "COMPLETED", f"Task completed successfully")
        print(f"  🎉 [{task_id}] 任務完成！✅")
    else:
        state["failed_tasks"][task_id] = task
        log_event(task_id, "FAILED", f"Task failed: {final_output[:200]}")
        print(f"  💥 [{task_id}] 任務失敗！❌")
        # Escalate after failure
        escalate(task_id, task)

    save_state(state)
    return True

def escalate(task_id: str, task: dict):
    """Escalate failed task to user."""
    print(f"\n{'='*60}")
    print(f"⚠️  任務升級通知")
    print(f"  任務 ID: {task_id}")
    print(f"  描述: {task['description']}")
    print(f"  當前步驟: {task['current_step']}")
    print(f"  建議: 請手動介入或查看 repair-log.jsonl")
    print(f"{'='*60}\n")

def get_status(task_id: str = None) -> dict:
    """Get current status of tasks."""
    state = load_state()
    if task_id:
        all_tasks = {**state["active_tasks"], **state["completed_tasks"], **state["failed_tasks"]}
        return all_tasks.get(task_id, {"error": "Task not found"})
    return {
        "active": len(state["active_tasks"]),
        "completed": len(state["completed_tasks"]),
        "failed": len(state["failed_tasks"]),
        "active_tasks": list(state["active_tasks"].keys()),
    }

def track_command(task_id: str, step_index: int, cmd: str, description: str = "") -> tuple:
    """Run a command and track its progress."""
    update_step(task_id, step_index, "running", description)
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, timeout=120,
            errors="replace"
        )
        if result.returncode == 0:
            update_step(task_id, step_index, "done")
            return True, result.stdout
        else:
            update_step(task_id, step_index, "failed", result.stderr)
            return False, result.stderr
    except subprocess.TimeoutExpired:
        update_step(task_id, step_index, "failed", "Command timed out")
        return False, "Timeout"
    except Exception as e:
        update_step(task_id, step_index, "failed", str(e))
        return False, str(e)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="萬能分身追蹤器 (Clone Tracker)")
    parser.add_argument("command", nargs="?", default="status",
                        help="Command: status, create-task, track, get")
    parser.add_argument("--task", type=str, help="Task description for tracking")
    parser.add_argument("--task-id", type=str, help="Resume an existing TASK-XXXXXXXX (skips create-task)")
    parser.add_argument("--steps", type=str, help="Comma-separated steps")
    parser.add_argument("--cmd", type=str, help="Command to track")
    parser.add_argument("--step", type=int, default=0, help="Step index")
    parser.add_argument("--success", type=str, default="true",
                        help="'true'/'1' = 修復成功；其餘皆視為失敗")
    parser.add_argument("--evidence-file", type=str, default="",
                        help="engine 輸出檔；供結案時作為證據（空檔 = 未證實成功）")
    args = parser.parse_args()
    
    if args.command == "create-task":
        description = args.task or "Auto-fix task"
        steps = args.steps.split(",") if args.steps else ["Execute", "Verify", "Complete"]
        task_id = create_task(description, steps)
        print(f"TASK_ID={task_id}")
    elif args.command == "track":
        if not args.cmd:
            print("Error: --cmd required for 'track' command", file=sys.stderr)
            sys.exit(1)
        # --task-id 續追既有任務；未給定才新建。
        # 舊版無論如何都 create_task()，導致「track 一步」= 開一個新任務，
        # 多步任務會散成多個互不相關的 TASK ID（tracker-log 實測可見）。
        if args.task_id:
            task_id = args.task_id
            state = load_state()
            if task_id not in state.get("active_tasks", {}):
                print(f"Error: task_id {task_id} not found in active_tasks", file=sys.stderr)
                sys.exit(1)
        else:
            if not args.task:
                print("Error: --task or --task-id required for 'track' command", file=sys.stderr)
                sys.exit(1)
            task_id = create_task(args.task, args.steps.split(",") if args.steps else ["Execute", "Verify", "Complete"])
        success, output = track_command(task_id, args.step, args.cmd)
        # 僅在最後一步才結案；中間步驟保持 active 以供續追。
        # （修正 2026-09-28：舊版每步都結案，3 步任務在 step 0 即被移出 active_tasks）
        state_now = load_state()
        task_now = state_now.get("active_tasks", {}).get(task_id, {})
        total_steps = len(task_now.get("steps", []))
        is_last = args.step >= total_steps - 1 if total_steps else True
        if success:
            complete_task(task_id, success=True, final_output=output, final=is_last)
        else:
            complete_task(task_id, success=False, final_output=output, final=is_last)
    elif args.command == "complete":
        # 由 auto-fix.sh 在 engine 結束後呼叫 —— 這是 engine 與 tracker 唯一的回寫橋。
        # 舊版無此子命令，engine 只寫 repair-log.jsonl，任務永遠卡在 active_tasks。
        if not args.task_id:
            print("Error: --task-id required for 'complete' command", file=sys.stderr)
            sys.exit(1)
        evidence = args.evidence_file or ""
        if evidence and Path(evidence).exists():
            try:
                evidence = Path(evidence).read_text(encoding="utf-8", errors="replace")
            except Exception:
                evidence = ""
        else:
            evidence = ""
        ok = str(args.success).lower() in ("1", "true", "yes")
        rc = complete_task(args.task_id, success=ok, final_output=evidence, final=True)
        if not rc:
            # 已在 completed/failed（非 active）時不視為錯誤，讓呼叫端冪等重跑。
            existing = get_status(args.task_id)
            if "error" not in existing:
                print(f"[{args.task_id}] already settled; idempotent no-op")
                sys.exit(0)
            print(f"Error: task_id {args.task_id} not found in active_tasks", file=sys.stderr)
            sys.exit(1)
        print(f"[{args.task_id}] settled")
    elif args.command == "get":
        task_id = args.task_id or args.task
        if task_id:
            status = get_status(task_id)
            print(json.dumps(status, ensure_ascii=False, indent=2))
        else:
            print("Error: --task-id required for 'get' command", file=sys.stderr)
            sys.exit(1)
    else:
        # Default: show status
        status = get_status()
        print(json.dumps(status, ensure_ascii=False, indent=2))
