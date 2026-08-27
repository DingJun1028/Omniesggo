# Proposal: timeout

# ssh-timeout-guard
自動為 SSH/CI 指令加 command_timeout + 模型 fallback，避免 45s 阻塞。
觸發: 任何 ssh/git/curl 遠端呼叫前先設 timeout。
