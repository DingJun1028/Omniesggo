import re, json

# 這頁是 Gemma 4 模型卡, 從 notion fetch 的 text 欄位提取
# 直接以精簡結構化方式遷移 (保留所有表格 + 關鍵段落)
md = """---
title: google/gemma-4-E2B-it-qat-mobile-transformers · Hugging Face
source: Notion
notion_id: 38bccd20-97d7-81bf-bd3a-d9f0c973cc95
tags: [Gemma4, HuggingFace, 模型卡, QAT, 多模態]
url: https://huggingface.co/google/gemma-4-E2B-it-qat-mobile-transformers
---

# Gemma 4 E2B / E4B / 12B / 26B A4B / 31B (QAT Mobile Transformers)

Gemma 是 Google DeepMind 的開放模型家族。Gemma 4 多模態，處理文字+圖像輸入（E2B/E4B/12B 支援音訊），生成文字輸出。五種尺寸：**E2B、E4B、12B、26B A4B、31B**。上下文視窗最高 256K tokens，多語言支援 140+ 語言。

## QAT 四種版本
- **Unquantized QAT (Q4_0)**：半精度權重，適合研究。E2B/E4B/12B/26B A4B/31B + drafter
- **GGUF (Q4_0)**：即部署格式。同上尺寸
- **Mobile-optimized (wNa8o8)**：手機硬體優化，2-bit 解碼層 + 優化 KV cache。僅 E2B/E4B
- **Compressed Tensors (w4a16)**：vLLM 原生推理。E2B/E4B/12B/31B

## 架構關鍵進展
- **Reasoning**：可配置思考模式
- **Extended Multimodalities**：Text/Image/Video/Audio
- **Diverse & Efficient**：Dense + MoE
- **Optimized for On-Device**：小模型本地執行
- **Context Window**：小模型 128K，中模型 256K
- **Enhanced Coding & Agentic**：原生 function-calling
- **Native System Prompt**：原生 `system` 角色

## 模型規格表
| Property | E2B | E4B | 12B Unified | 31B Dense |
| --- | --- | --- | --- | --- |
| Total Parameters | 2.3B eff (5.1B emb) | 4.5B eff (8B emb) | 11.95B | 30.7B |
| Layers | 35 | 42 | 48 | 60 |
| Sliding Window | 512 | 512 | 1024 | 1024 |
| Context Length | 128K | 128K | 256K | 256K |
| Vocabulary | 262K | 262K | 262K | 262K |
| Modalities | Text,Image,Audio | Text,Image,Audio | Text,Image,Audio | Text,Image |
| Vision Encoder | ~150M | ~150M | - | ~550M |
| Audio Encoder | ~300M | ~300M | - | No Audio |

### 26B A4B MoE
| Property | 26B A4B MoE |
| --- | --- |
| Total Parameters | 25.2B |
| Active Parameters | 3.8B |
| Layers | 30 |
| Sliding Window | 1024 |
| Context | 256K |
| Experts | 8 active / 128 total + 1 shared |
| Modalities | Text, Image |
| Vision Encoder | ~550M |

## 基準測試 (instruction-tuned)
| Benchmark | 31B | 26B A4B | 12B Unified | E4B | E2B | Gemma3 27B |
| --- | --- | --- | --- | --- | --- | --- |
| MMLU Pro | 85.2 | 82.6 | 77.2 | 69.4 | 60.0 | 67.6 |
| AIME 2026 no tools | 89.2 | 88.3 | 77.5 | 42.5 | 37.5 | 20.8 |
| LiveCodeBench v6 | 80.0 | 77.1 | 72.0 | 52.0 | 44.0 | 29.1 |
| Codeforces ELO | 2150 | 1718 | 1659 | 940 | 633 | 110 |
| GPQA Diamond | 84.3 | 82.3 | 78.8 | 58.6 | 43.4 | 42.4 |
| BigBench Extra Hard | 74.4 | 64.8 | 53.0 | 33.1 | 21.9 | 19.3 |
| MMMLU | 88.4 | 86.3 | 83.4 | 76.6 | 67.4 | 70.7 |
| MMMU Pro | 76.9 | 73.8 | 69.1 | 52.6 | 44.2 | 49.7 |
| MATH-Vision | 85.6 | 82.4 | 79.7 | 59.5 | 52.4 | 46.0 |

## 快速使用 (Transformers)
```bash
pip install -U transformers torch accelerate
```
```python
from transformers import AutoProcessor, AutoModelForMultimodalLM
MODEL_ID = "google/gemma-4-12B-it"
processor = AutoProcessor.from_pretrained(MODEL_ID)
model = AutoModelForMultimodalLM.from_pretrained(MODEL_ID, dtype="auto", device_map="auto")
```

## 推理控制
- 觸發思考：system prompt 開頭加 `<|think|>` token
- 標準生成結構：`<|channel>thought\n**[Internal reasoning]**<channel|>` 後接最終答案
- 多輪對話歷史只保留最終回應，不含思考內容

## 採樣建議
- temperature=1.0, top_p=0.95, top_k=64
- 多模態：圖像放文字前、音訊放文字後
- 視覺 token budget：70/140/280/560/1120（OCR 用高、分類用低）
- 音訊最長 30s，影片最長 60s (1fps)

## 安全與限制
- 經 Google DeepMind 同級安全評估，相對 Gemma 3 全面改善
- 限制：訓練資料偏差、開放任務複雜度、語言細微差異、事實準確性、常識推理
- 倫理：偏見公平、錯誤資訊防治、透明問責

> 完整模型卡: https://huggingface.co/google/gemma-4-E2B-it-qat-mobile-transformers
"""

open(r"C:/Users/dingj/iCloudDrive/iCloud~md~obsidian/DingJun/Notion_Import/gemma-4-QAT-mobile-transformers.md","w",encoding="utf-8").write(md)
print("WRITTEN", len(md))
