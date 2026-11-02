# OmniBitwarden — 萬能金庫系統

> 萬能金庫系統（OmniBitwarden）是一套融合 Bitwarden 的通用憑證存取與安全金鑰管理系統，專為 Omniesggo 設計。

## 📋 功能特色

- ✅ **多層憑證架構**：L0 JunAikey 成長層 → L1 OmniKey 憑證權威 → L2 OmniMasterKey 統一憑證存取 → L3 SUMMON_LAYERS → L4 已部署代理
- ✅ **多種存放位置**：本機開發 `.env.local`、生產環境 `secret-vault/`、萬能金庫 `omni-bitwarden/`
- ✅ **安全原則**：絕不硬編碼、Masked 輸出、權限控制、出口清理
- ✅ **統一存取介面**：`omni_get_secret()` 函數存取
- ✅ **自動輪替**：90 天輪替高風險金鑰
- ✅ **TypeBox Schema**：型別安全的配置驗證
- ✅ **Bitwarden 集成**：支援 Bitwarden CLI 存取與同步

## 📋 目錄結構

```
omni-bitwarden/
├── SKILL.md              # 技能文件
├── config.yaml           # 配置文件
├── configs/
│   └── omni-bitwarden.example.yaml # 配置模板
├── scripts/
│   ├── omni-bitwarden.ts       # 主程式 (TypeScript)
│   ├── verify-omni-bitwarden.ts # 驗證腳本
│   └── omni-bitwarden-update.ts # 更新腳本
├── tests/
│   └── omni-bitwarden.test.ts  # 單元測試
├── templates/
│   └── config.template.yaml    # 配置模板
└── README.md                   # 說明文件
```

## 🔧 安裝指南

### 1. 安裝必要工具
```bash
# 檢查 Bitwarden CLI
bitwarden --version

# 初始化 npm 專案
cd omni-bitwarden/scripts
npm install
```

### 4. 驗證安裝
```bash
# 執行驗證腳本
npx tsx scripts/verify-omni-bitwarden.ts

# 更新金鑰
npx tsx scripts/omni-bitwarden-update.ts update NCBDB_API_TOKEN

# 輪替金鑰
npx tsx scripts/omni-bitwarden-update.ts rotate MISTRAL_API_KEY

# 同步到 Bitwarden
npx tsx scripts/omni-bitwarden.ts sync
```

## 🔐 安全原則

1. **絕不硬編碼**：任何 API 金鑰、機密資料均不得寫入程式碼
2. **環境變數**：本地開發使用 `.env.local`（已 `.gitignore` 忽略）
3. **機密聖櫃**：生產環境使用 `secret-vault/` 目錄
4. **統一存取**：透過 `omni_get_secret()` 函數存取
5. **MASKED 輸出**：所有憑證查詢結果均以 `***MASKED***` 顯示
6. **權限控制**：`secret-vault/` 目錄權限 600，僅所有者可讀寫
7. **出口清理**：程式結束時清理環境變數中的機密值

## ⚠️ 注意事項

1. **金鑰輪替**：每 90 天輪替一次高風險金鑰
2. **密碼管理**：勿將真實密碼寫入程式碼或版本庫
3. **最小權限**：僅授予必要的服務存取權限
4. **密碼輪替**：定期輪替敏感密碼
5. **安全教訓**：參考 `.security-lesson-20261102.md` 學習經驗

---

## 📖 參考資源

- [Bitwarden CLI Documentation](https://bitwarden.com/help/cli/)
- [OmniMasterKey 系統設計](./omni-master-key/SKILL.md)
- [Junaikey 成長層](./omni-master-key/SKILL.md)
- [安全原則與密碼學](./OMNISKILL_BOOK.md#37-安全與密碼學原則)
```

