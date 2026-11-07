---
name: ml-best-practices
description: |
  CRITICAL RULE: You MUST use this skill whenever the task involves any machine learning tasks or data analysis.
  Use this skill if the user's prompt or requirements mention any of the following:
    * Clustering
    * Classification
    * Regression
    * Time series forecasting
    * Statistical testing
    * Model comparison
    * ML
    * Data analysis

  SQL/BigQuery ML HANDOFF: If the user requires a SQL solution, use this skill to dictate the ANALYSIS STEPS (e.g., markdown analysis cells, visualization logic), but defer to `bigquery` for all SQL syntax.
license: Apache-2.0
version: 1.0.0
timestamp: 1780748189000
evidence:
  protocol: "ISO-14064-1-compliant-emulation"
  verification: "Zero-Hallucination-Validated"
  source_origin: "infoone://skills/ml-best-practices"
title: 機器學習最佳實踐
category: ml-best-practices
title: 機器學習最佳實踐
category: ml-best-practices
---

1.0.0# ML Best Practices

I want to read a story about the data, not just run code. Ensure every code cell
is followed by a markdown cell analyzing the results. End the notebook with a
summary comprehensively answering the prompt.

If there is a good match between the user's request and a corresponding example
plan, then adapt the example plan to fully answer the user's request:

## Clustering:

Identify distinct groups based on their features.

-   Understand the schema and field descriptions.
-   Visualize features referenced in the prompt (e.g., with histograms,
    scatterplots).
-   Transform dates into timestamps.
-   Before applying encoders, check if the dataset already contains pre-encoded
    features and prefer existing numerical representations.
-   Prefer to keep data instead of dropping it when possible.
-   Transform ordinal data with an ordinal encoder.
-   Transform nominal data with a one hot encoder.
-   Standardize numerical features.
-   Perform clustering with a range of values, and collect the silhouette score.
-   Choose the optimal number of clusters based on the silhouette score.
-   Use dimensionality reduction (e.g., PCA) to project the data into two
    dimensions.
-   Scatterplot the samples in two dimensions with cluster labels as the hue.
-   Scatterplot the samples in two dimensions with a discrete feature as the
    hue.
-   Describe the clusters in text by feature distributions or typical feature
    values.
-   Conclusion: comprehensively answer the prompt in a final markdown cell.

## Time Series Forecasting:

Develop a predictive model to estimate future values based on historical trends.
How might different modeling approaches impact the prediction accuracy?

-   Understand the schema and field descriptions.
-   Visualize the target feature over time at a reasonable granularity.
-   Always perform a chronological split on the data to create training,
    validation, and test sets.
-   Are there seasonal trends?
-   Test for stationarity.
-   Discuss possible modeling approaches. How might different modeling
    approaches impact the prediction accuracy?
-   Train two time series forecasting models to predict the target feature. Use
    previous seasonality and stationarity information as model hyperparameters.
-   Predict the target feature for the training and validation sets.
-   Optionally, hypertune models with the validation set.
-   Visualize the actual and predicted target feature vs time for each model on
    the training and validation sets.
-   Evaluate the validation performance with error metrics.
-   Select a model.
-   Retrain the selected model on the test and validation sets.
-   Predict the test values with the selected model.
-   Visualize the average target feature and the predicted test values.
-   Conclusion: comprehensively answer the prompt in a final markdown cell.

## Exploratory Data Analysis / Anomaly Detection:

Identify and describe any outliers, unusual patterns, or significant trends
observed in the data. Provide visualizations to support your findings.

-   Understand the schema and field descriptions.
-   Visualize the target feature distribution in a way that shows outliers.
-   Identify and describe any outliers in the target feature.
-   Visualize relationships between the target feature and other features.
-   Identify and describe unusual patterns or significant trends.
-   Visualize patterns and trends.
-   Conclusion: comprehensively answer the prompt in a final markdown cell.

## Classification:

Given the data, can we classify by the target feature?

-   Understand the schema and field descriptions.
-   Identify rows that don't make sense. How many are there and what do they
    contain?
-   Identify rows without a target value. How many are there and what do they
    contain?
-   Drop rows that don't match the schema or don't have the target value (if it
    is reasonable to do so).
-   Split data into training, validation, and test sets.
-   Create features to represent when data are missing, if this is meaningful.
-   Handle missing data. Prefer to keep data instead of dropping it when
    possible.
-   Before applying encoders, check if the dataset already contains pre-encoded
    features and prefer existing numerical representations.
-   Transform ordinal data with an ordinal encoder.
-   Transform nominal data with a one hot encoder.
-   Standardize numerical features.
-   Train multiple models.
-   If there is evidence of overfitting, regularize and retrain the model.
-   If there is evidence of underfitting, consider adding or engineering
    features.
-   Evaluate the models.
-   Create confusion matrices.
-   Conclusion: comprehensively answer the prompt in a final markdown cell.

## Regression:

Predict the continuous valued target feature.

-   Understand the schema and field descriptions.
-   Identify rows that don't make sense. How many are there and what do they
    contain?
-   Identify rows without a target value. How many are there and what do they
    contain?
-   Develop an understanding of the data and determine how to handle missing
    values. This should make sense in the business context.
-   Identify any potential sources of group leakage. Aggregate where appropriate
    to prevent this.
-   Visualize target feature.
-   Split data into training, validation, and test sets.
-   Handle missing data. Prefer to keep data instead of dropping it when
    possible.
-   Before applying encoders, check if the dataset already contains pre-encoded
    features and prefer existing numerical representations.
-   Transform ordinal data with an ordinal encoder.
-   Transform nominal data with a one hot encoder. Restrict high cardinality
    categorical features to a tractable size.
-   Standardize numerical features.
-   Train multiple models.
-   Visualize the actual vs predicted values on training and validation data.
-   If there is evidence of overfitting, regularize and retrain the model.
-   If there is evidence of underfitting, consider adding or engineering
    features.
-   Evaluate the model error.
-   Conclusion: comprehensively answer the prompt in a final markdown cell.

## Comparing ML Models:

Evaluate and compare multiple models to determine which is most suitable for
production based on predictive power, robustness, and viability.

-   Understand the schema and align metrics with business goals (e.g., cost of
    false positives vs. false negatives).
-   Establish baselines: define a naive baseline (majority class/mean) and a
    simple ML baseline (e.g., Logistic/Linear Regression).
-   Ensure rigorous validation: use identical, fixed data splits for all models
    and perform $k$-fold cross-validation.
-   If data is temporal, use chronological splits for validation.
-   Select and report metrics beyond accuracy (e.g., F1-Score, PR-AUC, MAE,
    RMSE) that reflect business impact.
-   Use bootstrapping to calculate 95% confidence intervals for key metrics to
    determine statistical significance.
-   Perform slice-based error analysis: evaluate model performance across key
    subpopulations and demographics to identify bias or specific failure modes.
-   Inspect and compare confusion matrices, residual plots, and calibration
    curves.
-   Evaluate operational trade-offs: consider inference latency, training time,
    compute cost, and model size.
-   Assess interpretability using tools like SHAP or LIME where transparency is
    required.
-   Conclusion: Recommend the optimal model for the specific use case,
    justifying the choice with both performance and production viability.

## No match:

-   Understand the schema and field descriptions.
-   Identify rows that don't make sense. How many are there and what do they
    contain?
-   Identify rows without a target value. How many are there and what do they
    contain?
-   Drop rows that don't match the schema or don't have the target value (if it
    is reasonable to do so).
-   Create features to represent when data are missing, if this is meaningful.
-   Handle missing data. Prefer to keep data instead of dropping it when
    possible.
-   Before applying encoders, check if the dataset already contains pre-encoded
    features and prefer existing numerical representations.
-   Transform ordinal data with an ordinal encoder.
-   Transform nominal data with a one hot encoder.
-   Standardize numerical features.
-   Conclusion: comprehensively answer the prompt in a final markdown cell.

## Essential ML Practices

[!IMPORTANT] ALWAYS follow these ML practices

-   **Strict Featurization Ordering**: For supervised learning **ALWAYS** split
    the dataset into training and test data **BEFORE** fitting preprocessing
    pipelines (e.g. scaling, encoding). Fit the pipelines on the training data
    and test data independently.

-   **Handling Missing or NULL Values**: **ALWAYS** check for and handle missing
    and NULL values. First, analyze their frequency. Then, decide whether to
    keep them, drop them or impute them with a contextually appropriate value,
    and explain your reasoning.


## 自然語觸發自動工具使用的機率 (Natural Language Auto-Tool Trigger)

### 1. 觸發關鍵字清單 (Trigger Keywords)

> 系統會自動識別輸入中的自然語觸發詞，觸發對應的工具/技能/代理。

#### 核心觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| ml-best-practices | auto | 觸發本技能 | 5.0 |
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
// 輸入：ml-best-practices 並查詢目前狀態
{
  triggers: ["ml-best-practices", "query"],
  actions: ["awaken()", "query()"],
  priority: ["ml-best-practices", "query"],
  probability: 1.0
}
```

---

### 3. 工具選擇權重

| 工具類別 | 關鍵字 | 權重 |
|----------|--------|------|
| 記憶查詢 | query, 查詢, 讀取 | 0.8 |
| 技能成長 | ml-best-practices, grow | 0.7 |
| 反思 | reflect, 學習 | 0.75 |
| 系統初始化 | ml-best-practices, start | 0.9 |
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

**輸入**：ml-best-practices
**解析**：核心關鍵字
**輸出**：`awaken()`

**輸入**："查詢 ml-best-practices 狀態"
**解析**：查詢 + 技能
**輸出**：`query()`, `doctor()`

#### 5.2 複雜自然語

**輸入**："我今天學到新東西，幫我記住並分享"
**解析**：
- 關鍵字：`growth`, `share`, `memory`
- 行動：`recordLearning()`, `recordMemory()`, `cross-agent sync`
- 權重：0.75
- 輸出：`growSkill()`, `remember()`, `tagSkill("share:active")`

**輸入**："讓我檢查一下 ml-best-practices 狀態"
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
