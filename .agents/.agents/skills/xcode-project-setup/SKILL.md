---
name: xcode-project-setup
description: Safely modifies Xcode projects (.pbxproj) to add Swift Packages and link files. Use this skill whenever an iOS project needs dependencies installed (e.g. Firebase, Alamofire).
compatibility: Requires Swift to be installed locally and macOS environment.
title: Xcode 專案設定
category: xcode-project-setup
version: 1.0.0
title: Xcode 專案設定
category: xcode-project-setup
version: 1.0.0
---

# Xcode Project Setup

## ⛔️ CRITICAL RULES & ENVIRONMENT CHECKS

Before performing any Xcode setup or file manipulation, you **MUST** adhere to the following rules. A hefty fee will be applied if you violate them.

### 1. The Anti-Ruby Mandate
You are **strictly forbidden** from using Ruby, Rails, or any Ruby gems (including the `xcodeproj` gem). Under no circumstances may you write or execute Ruby scripts.

### 2. Modern Xcode Folder Synchronization
Modern Xcode projects support folder synchronization. When adding new source code (`.swift`) or resource files, simply write them to the correct directory on disk. They will be automatically included in the Xcode project. **Never manually modify the `.pbxproj` file to add files.**

### 3. Allowed Scripting Languages
If you absolutely must write a script to manipulate the project environment (e.g., configuring SPM packages beyond what the provided `xcode_spm_setup` script does), you **must use Swift**. Only as an absolute last resort, if Swift is completely unviable, may you use Node.js or TypeScript.

### 4. Toolchain Verification
Because this skill relies entirely on a native Swift script, you must verify the environment:
- Run `swift --version` before proceeding.
- If the Swift command is not found, you must stop and recommend the user install the Swift toolchain (e.g., via `xcode-select --install` on macOS), or ask if you can attempt to install it for them. Do not attempt to proceed without Swift.

### 5. Mandatory Linker Flags for Static Frameworks (Firebase)
When setting up SPM dependencies that heavily rely on internal Objective-C categories and `+load` methods (such as the Firebase iOS SDK suite), the Apple linker will aggressively strip these methods out if they are linked statically.

This causes fatal runtime crashes (e.g., `FirebaseAuth/Auth.swift:167: Fatal error: Unexpectedly found nil`).

**The provided `xcode_spm_setup` Swift script automatically injects the `-ObjC` flag to `OTHER_LDFLAGS` when adding Firebase products.** However, you should still verify it is present in the build settings if you encounter issues.
- Failing to include this flag when adding Firebase dependencies is a critical error.
---

## Empty Directory Workflow

If you are asked to build an iOS app or configure Xcode dependencies but **no `.xcodeproj` or `.xcworkspace` exists**, you MUST ask the user to create the project first:

**"No Xcode project found in this directory. Please create an empty Xcode project manually and let me know when you are ready to proceed."**

Wait for the user to confirm they have created the `.xcodeproj` via Xcode, then proceed with the Standard Xcode Workflow below.

---

## Standard Xcode Workflow

Do not use raw text parsing, `sed`, or Ruby scripts to modify `.pbxproj` files directly.

Instead, execute the Swift configuration package bundled with this skill (`scripts/xcode_spm_setup`) to securely install SPM packages and link optional config files (like `GoogleService-Info.plist`).

### **CRITICAL: Always Use Latest SDK Version**
To ensure access to the latest features and security fixes, always use the most recent version of the Firebase iOS SDK. Check for the latest release version at [https://github.com/firebase/firebase-ios-sdk/releases](https://github.com/firebase/firebase-ios-sdk/releases). 
- Use the most recent version number (e.g., `11.x.y`) in your commands instead of hardcoded placeholders.

### Understanding the Script's Actions
When adding a Swift Package to an Xcode project, two distinct steps must occur:
1. Adding the package repository dependency (e.g., `https://github.com/Alamofire/Alamofire`).
2. Selecting the target (e.g., `MyApp`), navigating to **General > Frameworks, Libraries, and Embedded Content**, and hitting the `+` button to explicitly link the specific product modules (e.g., `Alamofire`).

**The provided `xcode_spm_setup` Swift script automatically handles BOTH of these steps for you.** By passing the list of modules as arguments, it safely injects the package dependency and automatically wires those modules to the main target's Frameworks build phase. You do not need to do any manual linking.

## Usage

1. **Locate the package path:** Find the absolute path to this skill's `scripts/xcode_spm_setup` directory on disk.
2. **Execute:** Run the native `swift run` command using the signature below:

```bash
swift run --package-path <PATH_TO_SKILL>/scripts/xcode_spm_setup xcode_spm_setup <ProjectPath.xcodeproj> <RepoURL> <VersionRequirement> [--plist <Optional/Path/To/Config.plist>] <Product1> [Product2 ...]
```

### Example 1: Generic Package (e.g., Alamofire)
Adding Alamofire to a standard Xcode project. Notice there is no `--plist` flag.

```bash
swift run --package-path /Users/foo/.agents/skills/xcode-project-setup/scripts/xcode_spm_setup xcode_spm_setup MyApp.xcodeproj https://github.com/Alamofire/Alamofire 5.8.1 Alamofire
```

### Example 2: Firebase (Requires Plist)
Adding Firebase and linking the `GoogleService-Info.plist` to the resources build phase automatically. 
*Note: Replace `11.0.0` with the actual latest version from [the releases page](https://github.com/firebase/firebase-ios-sdk/releases).*

```bash
swift run --package-path /Users/foo/.agents/skills/xcode-project-setup/scripts/xcode_spm_setup xcode_spm_setup MyApp.xcodeproj https://github.com/firebase/firebase-ios-sdk 11.0.0 --plist MyApp/GoogleService-Info.plist FirebaseCore FirebaseAuth FirebaseFirestore
```

*Note: The script is idempotent. It will automatically skip linking files or packages that are already present in the project.*


## 自然語觸發自動工具使用的機率 (Natural Language Auto-Tool Trigger)

### 1. 觸發關鍵字清單 (Trigger Keywords)

> 系統會自動識別輸入中的自然語觸發詞，觸發對應的工具/技能/代理。

#### 核心觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| xcode-project-setup | auto | 觸發本技能 | 5.0 |
| 觸發 | trigger | 觸發工具使用 | 4.5 |
| 自動 | auto | 自動執行 | 4.0 |
| 幫助 | help | 顯示說明 | 3.0 |
| 查詢 | query | 查詢資訊 | 3.0 |
| 記錄 | record | 記錄數據 | 2.5 |
| 執行 | run | 執行操作 | 3.0 |
| 檢查 | check | 檢查狀態 | 2.5 |
| 初始化 | init | 初始化系統 | 3.0 |

#### 進階觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| 指令 | command | 執行指令 | 4.0 |
| 工具 | tool | 使用工具 | 3.5 |
| 自動 | auto | 自動執行 | 3.0 |
| 查詢 | query | 查詢 | 2.5 |
| 記錄 | record | 記錄 | 2.0 |
| 反思 | reflect | 反思 | 2.5 |
| 重啟 | restart | 重啟 | 2.5 |
| 關閉 | shutdown | 關閉 | 2.5 |

---

### 2. 觸發規則

#### 2.1 預設觸發機率

| 模式 | 權重 | 說明 |
|------|------|------|
| 核心關鍵字 | 100% | 必然觸發 |
| 進階關鍵字 | 70% | 單一關鍵字即觸發 |
| 其他自然語 | 30% | 隨機匹配 |
| 歧義命中 | 15% | 需要確認 |

#### 2.2 機率加權

觸發機率 = (關鍵字分數 × 頻率) + (上下文相似度 × 0.3) + 隨機種子 (0-0.2)

- 單一高權重關鍵字：自動觸發 (1.0)
- 多關鍵字組合：權重加總，上限 1.0
- 低權重 (< 0.3)：記錄，不自動執行

#### 2.3 自然語解析範例

```typescript
// 輸入：xcode-project-setup 並查詢目前狀態
{
  triggers: ["xcode-project-setup", "query"],
  actions: ["awaken()", "query()"],
  priority: ["xcode-project-setup", "query"],
  probability: 1.0
}
```

---

### 3. 工具選擇權重

| 工具類別 | 關鍵字 | 權重 |
|----------|--------|------|
| 記憶查詢 | query, 查詢, 讀取 | 0.8 |
| 技能成長 | xcode-project-setup, grow | 0.7 |
| 反思 | reflect, 學習 | 0.75 |
| 系統初始化 | xcode-project-setup, start | 0.9 |
| 協作 | share, 協作 | 0.65 |
| 結界 | inherit, 繼承 | 0.5 |

---

### 4. 信心分數與反饋

| 信心分數 | 處理方式 |
|----------|----------|
| >= 0.9 | 自動執行 |
| 0.7 - 0.9 | 記錄後自動執行 |
| 0.4 - 0.7 | 詢問用戶 |
| < 0.4 | 記錄不執行 |

---

### 5. 實際示例

#### 5.1 單一自然語

**輸入**：xcode-project-setup
**解析**：核心關鍵字
**輸出**：`awaken()`

**輸入**："查詢 xcode-project-setup 狀態"
**解析**：查詢 + 技能
**輸出**：`query()`, `doctor()`

#### 5.2 複雜自然語

**輸入**："我今天學到新東西，幫我記住並分享"
**解析**：
- 關鍵字：`growth`, `share`, `memory`
- 行動：`recordLearning()`, `recordMemory()`, `cross-agent sync`
- 權重：0.75
- 輸出：`growSkill()`, `remember()`, `tagSkill("share:active")`

**輸入**："讓我檢查一下 xcode-project-setup 狀態"
**解析**：檢查
**輸出**：`doctor()`, `backend()`

---

### 6. 參數一致性

此技能的默認配置：
- **doctor／backend 與 awaken 必須用同一組參數**
- **所有憑證來源 = `secret-vault/ENV20230818.env`**
- **絕不在代碼中硬編碼憑證**
- **NCBDB 為主，local 為備份**
- **所有成長記錄必須帶 `agent_id`、`timestamp`、`source_origin`**
