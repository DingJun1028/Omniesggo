# 目錄總覽：omni-one 萬能筆記

> 萬能知識筆記本體的入口。記錄 OmniOne 自治知識代理的任務、記憶、5T 驗算與演化軌跡。

## 快速導引

| 欲找 | 路徑 |
|---|---|
| 任務日誌 | `logs/YYYY-MM-DD-<task-id>.md` |
| 記憶碎片 | `memories/<id>.json` |
| 5T 驗算 | `verification/<date>-<topic>.md` |
| 演化摘要 | `evolution/<date>.md` |
| 索引列表 | 本文件 |

## 目錄結構

```text
OmniOne-Note-Base/
├── README.md
├── index.md
├── 5T-protocols.md
├── logs/                ← 任務日誌
├── memories/            ← 記憶碎片
├── verification/        ← 5T 透明驗算
└── evolution/           ← 技能演化與熵減紀錄
```

## 命名慣例

| 項目 | 格式 |
|---|---|
| 任務日誌 | `logs/YYYY-MM-DD-TASK-<unix-timestamp>.md` |
| 記憶碎片 | `memories/MEM-<unix-timestamp>.json` |
| 5T 驗算 | `verification/YYYY-MM-DD-<topic>.md` |
| 演化摘要 | `evolution/YYYY-MM-DD.md` |

## 協作流程

1. **提交任務** → 建立 `logs/YYYY-MM-DD-TASK-<ts>.md`
2. **處理任務** → 記錄處理過程與結果
3. **提取記憶** → 將可重用知識寫入 `memories/MEM-<ts>.json`
4. **週期驗算** → 每周執行 5T 透明驗算，記入 `verification/`
5. **熵減演化** → 每月記錄演化摘要至 `evolution/`
