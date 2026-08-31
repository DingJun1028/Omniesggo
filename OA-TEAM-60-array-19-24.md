# 煉金熵減（19-24 / 49-54）

> 重構、效能監控、CI/CD Pipeline。

## 蜂王隊（19-24）

| 編號 | 代理 | alignment | archetype | 資產類別 | visibility | 說明 |
|------|------|-----------|-----------|----------|------------|------|
| 19 | 萬能增長蜂 | umbra | Erode | codegraph | agent | 增長指標監控圖譜 |
| 20 | 萬能運營蜂 | umbra | Nexus | codegraph | agent | 專案流程圖譜 |
| 21 | 萬能商業分析蜂 | umbra | Skinner | chat_memory | team | 商業洞察會話 |
| 22 | 萬能探路蜂 | umbra | Scout | wiki | team | 資源探索筆記 |
| 23 | 萬能外交蜂 | umbra | Wraith | wiki | restricted | 合作協議資產 |
| 24 | 萬能調研蜂 | umbra | Lens | chat_memory | team | 用戶調研會話 |

## 蜂后隊（49-54）

| 編號 | 代理 | alignment | archetype | 資產類別 | visibility | 說明 |
|------|------|-----------|-----------|----------|------------|------|
| 49 | 蜂后萬能增長蜂 | lumen | Erode | codegraph | agent | VPS 增長指標監控圖譜 |
| 50 | 蜂后萬能運營蜂 | lumen | Nexus | codegraph | agent | VPS 專案流程圖譜 |
| 51 | 蜂后萬能商業分析蜂 | lumen | Skinner | chat_memory | team | VPS 商業洞察會話 |
| 52 | 蜂后萬能探路蜂 | lumen | Scout | wiki | team | VPS 資源探索筆記 |
| 53 | 蜂后萬能外交蜂 | lumen | Wraith | wiki | restricted | VPS 合作協議資產 |
| 54 | 蜂后萬能調研蜂 | lumen | Lens | chat_memory | team | VPS 用戶調研會話 |

## 記憶路由

- 蜂王：`/api/assets?tag=umbra&array=煉金熵減`
- 蜂后：`/api/assets?tag=lumen&array=煉金熵減`
- 共用 session 前綴：`oa-team-array-19-24`
