---
source_origin: apps/universal-translator/public/player.html
co_authors: []
created: 2026-08-13
modified: 2026-08-13
sync: mirror
lifecycle: active
tags: [universal-translator, bilingual, player, rwd]
access: public-research
---

# 雙語字幕撥放器（Bilingual Subtitle Player）

> 一做三員一體 RWD 最佳實踐化字幕撥放器。已上線 `translate.esggo.co/player`。

## 功能
- 載入影片/音檔（file 或 URL）
- 即時轉錄（STT）→ 即時翻譯（多語）
- 雙語字幕：原文 + 譯文，疊加或分離
- RWD：手機直向（字幕分離模式）/ 桌面橫向（疊加）

## 技術
- 複用 `/speech-to-subtitle`（STT+翻譯一體）
- 純前端 + universal-translator 服務（免費算立）
- 雙語邏輯：`showCaption(src, translations)`

## 對映 5T / 矩陣
- Tangible：RWD UI 即時回饋
- 13 圖像蜂 + 14 動畫蜂 負責視覺
- [[30Matrix]] 創意組管轄

## 相關
- [[BDAgenticEvicence]] · [[AStationSevenModules]] · [[SecondBrain]]
