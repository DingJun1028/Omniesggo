#!/usr/bin/env bash
# kb — Hermes Kanban wrapper (繞過 delegate_task child context 環境汙染)
# 用法: kb <原 kanban 子命令>  (例如: kb list, kb show t_xxx, kb create ...)
# 修復: 紅字 "could not initialize database: delegate_task child contexts cannot mutate Kanban"
# 根因: HERMES_DELEGATED_CHILD_CONTEXT=1 殘留環境變數 (delegate_task 呼叫後未清理)
env -u HERMES_DELEGATED_CHILD_CONTEXT hermes kanban "$@"
