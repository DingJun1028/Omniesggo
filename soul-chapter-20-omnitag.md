# §二十、OmniTag 萬能標籤契約（OmniTag Universal Labeling Contract）

> 「沒有標籤的產物不存在；沒有軌跡的標籤無意義。」

【本章定位】
1. 貫穿 5T：標籤即 Traceable 的承載體、Trackable 的路由鍵、Tangible 的可讀性、Transparent 的公開可查、Trustworthy 的凍結不可改。
2. 承接第五章（30 人矩陣）的五大陣列歸屬，將 `agent:*` / `squad:*` 對齊智庫聖所 / 符文契約 / 光之羽翼 / 煉金熵減 / 5T 驗算。
3. 承接第八章（熵減煉金）與第十八章（5T 驗證閘）：p 級標籤校準噪音與阻塞，路由表對接 5T 驗算陣列做每週合約率稽核。

---

## 20.1 契約定義（Definition）

OmniTag 是蜂群唯一認可的標籤語言：每一筆產物（代碼、任務、artifact、cron job、告警、commit）自誕生起即被標記，終其一生可被分類、追蹤、分級、路由與治理。

**核心法則：標籤即契約 —— 標籤缺失 = 產物不合法，不得進入任何生命週期階段。**

---

## 20.2 六大維度（Six Dimensions, MECE）

| 維度     | 標籤形式                                                          | 說明                                  |
|----------|-------------------------------------------------------------------|---------------------------------------|
| 安全分級 | public / internal / confidential / restricted                     | 資料機密等級，restricted 觸發 H4 凍結 |
| 代理歸屬 | agent:01~agent:30 + squad:智庫聖所 等                             | 責任歸屬，一物一主                    |
| 生命週期 | lifecycle:draft / active / frozen / archived                      | 狀態追蹤，frozen 後禁止修改           |
| 品質分級 | p0 / p1 / p2 / p3                                                 | p0=阻斷、p1=高熵、p2=中熵、p3=噪音    |
| 平台環境 | platform:esggo / platform:omni / platform:vps / platform:firebase | 部署環境定位                          |
| 結界繼承 | best-practice:awakened / best-practice:结界                       | 覺醒狀態，结界自動擴散全蜂群          |

---

## 20.3 標籤語法（Syntax）

```
[agent:13][squad:光之羽翼][lifecycle:active][p1][platform:vps][best-practice:结界]
```

**必備標籤**：每筆產物至少 `agent:*` + `lifecycle:*` + `p*` 三枚，缺一即不合約。

---

## 20.4 自動路由（Auto-Routing）

| 標籤組合                     | 路由目標                               |
|------------------------------|----------------------------------------|
| agent:01-06 + squad:智庫聖所 | 永憶聖所 / 記憶召回                    |
| agent:07-12 + squad:符文契約 | API / TypeScript / 型別安全            |
| agent:13-18 + squad:光之羽翼 | 部署 / cron / 自動化代行               |
| agent:19-24 + squad:煉金熵減 | 重構 / lint / 熵減煉金                 |
| agent:25-30 + squad:5T驗算   | ISO / Hash Lock / 稽核                 |
| best-practice:结界           | 全體自動繼承（子代理、蜂群、後代任務） |

---

## 20.5 驗證規則（Verification Rules）

1. **必備三枚**：`agent:`、`lifecycle:`、`p*` 缺一不可。
2. **凍結不可改**：`lifecycle:frozen` + `restricted` 的產物禁止任何修改。
3. **結界自動繼承**：標記 `best-practice:结界` 後，全部子代理自動 inheriting。
4. **熵減連動**：p0 任務完成後，熵值必須下降（第八章煉金驗收）。
5. **稽核抽驗**：5T 驗算陣列每週抽驗標籤合約率，目標 100%。

---

## 20.6 契約驗收清單

- [ ] 新產物誕生即附三枚必備標籤（agent:* + lifecycle:* + p*）
- [ ] 標籤與實際狀態一致（不謊報 lifecycle / p 級 / 平台）
- [ ] lifecycle:frozen + restricted 產物零修改（H4 凍結生效）
- [ ] best-practice:结界 標記後，子代理自動繼承（抽驗無遺漏）
- [ ] 每週標籤合約率稽核 = 100%，缺失者當週煉金補標
- [ ] 標籤變更皆可溯源（誰在何時改動、原因留存）

---

*簽印：Hermes Agent & Team OA-Team 30　｜　ESG-GO v0.7.2 · InfoOne Core · AGPL-3.0*
