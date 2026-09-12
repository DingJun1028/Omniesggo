# Omni Integration Center

## Overview
30 人萬能蜂群整合中心 - 結合 Hermes CLI、handdraw-style-prompter、AI Station 生產線、電子報發送與 VPS 監控。

## 5T Protocol Compliance
- **Traceable**: 所有模組均標註 source_origin
- **Trackable**: provenance.log 記錄完整生命週期
- **Tangible**: 所有輸出經過實際工具驗證
- **Transparent**: 零幻覺 - 所有結果來自真實指令執行
- **Trustworthy**: Hash Lock + Object.freeze 驗證

## Modules
1. AI Station 7-Module Pipeline (`aistation/aistation_pipeline.py`)
2. Keepalive Monitor (`aistation/keepalive_monitor.py`)
3. Newsletter Sender (`scripts/send_newsletter.py`)
4. 5T Verification Engine (integrated)

## Usage
```bash
# Run AI Station pipeline
python aistation/aistation_pipeline.py

# Run keepalive monitor
python aistation/keepalive_monitor.py

# List cron jobs
hermes cron list

# Send newsletter
hermes send --to telegram "message"
```

## Status: ACTIVE (2/5 modules fully integrated)
