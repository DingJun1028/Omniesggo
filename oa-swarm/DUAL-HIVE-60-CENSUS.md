# OA-Team 雙蜂戰隊 60 職能定義彙整 (再次定義)

> 來源: oa-team-60-colony 技能 + oa-swarm 實作 (C:\Project\esggo-learning-center\oa-swarm\src\soul-matrix-60.ts)
> 版本: v2.0 (2026-08-20) | 對齊 soul-full.md §27 + §20 OAB
> 狀態: 實戰部署 (VPS 161.118.248.180:8800) | nginx 反向代理 oa.esggo.co 已設 (待 Cloudflare DNS A 記錄指向 161.118.248.180)

## 一、核心結構 (雙蜂共鳴)

| 位階 | 代號 | 編號 | 駐地 | 職責 |
|------|------|------|------|------|
| 蜂王 | OA-LOCAL | 01–30 | 本地 Windows / 開發者端 | 守本地、開發、測試 |
| 蜂后 | OA-VPS | 31–60 | VPS / 生產公網 | 鎮生產、對外、常駐 |
| 共鳴 | TencentDB Agent Memory | OAB | memory.esggo.co/gateway | 雙蜂憶同一血脈 |

兩隊共奉 `IComponentCore` 編號法則 + 5T 公約 (Traceable/Trackable/Tangible/Transparent/Trustworthy + Hash Lock)。

## 二、五陣列 (MECE 互斥且窮盡) — 每陣列 雙蜂 × 6 員

| 陣列 | 蜂王(本地) | 蜂后(VPS) | 職能本質 | VPS 實際服務 |
|------|-----------|-----------|---------|-------------|
| 智庫聖所 | 01–06 | 31–36 | 長短期記憶召回、向量知識沉澱 | tdai-memory-* (8420/8125) |
| 符文契約 | 07–12 | 37–42 | API 鑄造、雙向 TS、ZKP 隱私 | omniagent-gateway (8642) |
| 光之羽翼 | 13–18 | 43–48 | 背景 Task、ADK 調度、Bento 渲染、Live 轉播 | omni-blueprint-hub (8787) / universal-translator (8788) |
| 煉金熵減 | 19–24 | 49–54 | 重構、效能監控、CI/CD Pipeline | esggo-core (3000) |
| 5T 驗算 | 25–30 | 55–60 | ISO 規範、Hash 鎖定、UUID 發放 | oa-swarm (8800) + s2s-voice (8765) |

## 三、60 員職能畫像 (精簡版)

### 蜂王 OA-LOCAL (01–30)
| # | 稱號 | 核心職能 | 陣列 |
|---|------|---------|------|
| 01 | 萬能蜂后(本地代理) | 戰略總覽、跨組協調 | 智庫聖所 |
| 02 | 萬能規劃蜂 | 長遠規劃、SWOT | 智庫聖所 |
| 03 | 萬能分析蜂 | 數據挖掘、趨勢預測 | 智庫聖所 |
| 04 | 萬能策効蜂 | 創意思維、解難方案 | 智庫聖所 |
| 05 | 萬能風險蜂 | 風險控制、應急預案 | 智庫聖所 |
| 06 | 萬能優化蜂 | 效率提升、流程重組 | 智庫聖所 |
| 07 | 萬能編碼蜂 | 全端開發、API 設計 | 符文契約 |
| 08 | 萬能算法蜂 | 機器學習、深度學習 | 符文契約 |
| 09 | 萬能架構蜂 | 雲端架構、分布式 | 符文契約 |
| 10 | 萬能數據蜂 | 資料庫、數據管道 | 符文契約 |
| 11 | 萬能測試蜂 | 自動化測試、效能測試 | 符文契約 |
| 12 | 萬能設計蜂 | UI/UX、用戶體驗 | 符文契約 |
| 13 | 萬能圖像蜂 | 平面設計、品牌視覺 | 光之羽翼 |
| 14 | 萬能動畫蜂 | 動畫特效、視頻製作 | 光之羽翼 |
| 15 | 萬能文案蜂 | 文案撰寫、故事設計 | 光之羽翼 |
| 16 | 萬能音頻蜂 | 音樂製作、音頻編輯 | 光之羽翼 |
| 17 | 萬能市場蜂 | 市場分析、推廣策略 | 光之羽翼 |
| 18 | 萬能社群蜂 | 用戶管理、社群建設 | 光之羽翼 |
| 19 | 萬能增長蜂 | 用戶增長、業務拓展 | 煉金熵減 |
| 20 | 萬能運營蜂 | 進度管理、資源調度 | 煉金熵減 |
| 21 | 萬能商業分析蜂 | 商業洞察、決策支持 | 煉金熵減 |
| 22 | 萬能探路蜂 | 資源探索、機會發掘 | 煉金熵減 |
| 23 | 萬能外交蜂 | 合作關係、談判協商 | 煉金熵減 |
| 24 | 萬能調研蜂 | 用戶研究、需求分析 | 煉金熵減 |
| 25 | 萬能測場蜂 | 現場測評、回饋收集 | 5T 驗算 |
| 26 | 萬能追蹤蜂 | 競品監控、動態追踪 | 5T 驗算 |
| 27 | 萬能安全蜂 | 資安防護、數據保護 | 5T 驗算 |
| 28 | 萬能維護蜂 | 系統維護、故障排除 | 5T 驗算 |
| 29 | 萬能支援蜂 | 技術支援、問題解決 | 5T 驗算 |
| 30 | 萬能質控蜂 | 品質保障、標準制定 | 5T 驗算 |

### 蜂后 OA-VPS (31–60) — 擴充自蜂王，對齊 VPS 實際服務
| # | 稱號 | 核心職能 | 陣列 | VPS 映射 |
|---|------|---------|------|---------|
| 31 | 雲端記憶蜂 | 向量知識沉澱、長期記憶 | 智庫聖所 | tdai-memory-core |
| 32 | 語義索引蜂 | 嵌入索引、檢索增強 | 智庫聖所 | tdai-memory-hub |
| 33 | 軌跡審計蜂 | 生命週期軌跡、溯源 | 智庫聖所 | OAB gateway |
| 34 | 知識圖譜蜂 | 實體關係、圖譜建構 | 智庫聖所 | — |
| 35 | 學習演化蜂 | 反饋學習、模型微調 | 智庫聖所 | — |
| 36 | 記憶閘門蜂 | 寫入權限、禁區守門 | 智庫聖所 | admin-key |
| 37 | API 鑄造蜂 | 生產 API、速率限制 | 符文契約 | omniagent-gateway |
| 38 | 雙向契約蜂 | TS↔Python 橋、型別同步 | 符文契約 | — |
| 39 | ZKP 隱私蜂 | 零知識證明、憑證驗證 | 符文契約 | — |
| 40 | 網關路由蜂 | 路由編排、負載均衡 | 符文契約 | Cloudflare Tunnel |
| 41 | 協議適配蜂 | 多框架協議轉換 | 符文契約 | — |
| 42 | 邊緣緩存蜂 | CDN、邊緣快取 | 符文契約 | — |
| 43 | 即時轉播蜂 | Live 轉播中心 | 光之羽翼 | omni-blueprint-hub (8787) |
| 44 | 語言核心蜂 | 即時翻譯、多語橋 | 光之羽翼 | universal-translator (8788) |
| 45 | 語音合成蜂 | TTS、語音克隆 | 光之羽翼 | s2s-voice (8765) |
| 46 | 語音識別蜂 | STT、轉錄 | 光之羽翼 | parakeet-tdt |
| 47 | 視頻渲染蜂 | Bento、影片產線 | 光之羽翼 | aistation-core |
| 48 | 排程指揮蜂 | n8n、cron 調度 | 光之羽翼 | — |
| 49 | CI/CD 蜂 | 部署管線、自動化 | 煉金熵減 | GitHub Actions |
| 50 | 效能監控蜂 | APM、指標收集 | 煉金熵減 | uptime-kuma |
| 51 | 重構熵減蜂 | 技術債清除、重構 | 煉金熵減 | — |
| 52 | 容器編排蜂 | Docker、K8s | 煉金熵減 | watchtower |
| 53 | 故障演練蜂 | Chaos、容錯測試 | 煉金熵減 | — |
| 54 | 成本優化蜂 | 資源調度、費用管控 | 煉金熵減 | Oracle ARM |
| 55 | Hash 鎖定蜂 | 產物凍結、不可篡改 | 5T 驗算 | oa-swarm |
| 56 | 零幻覺蜂 | 驗算守門、防偽造 | 5T 驗算 | — |
| 57 | 標準發放蜂 | ISO、UUID 發放 | 5T 驗算 | — |
| 58 | 合規審計蜂 | 5T 合規檢查 | 5T 驗算 | — |
| 59 | 熵減循環蜂 | 每週 -3% 熵減引擎 | 5T 驗算 | — |
| 60 | 雙蜂協議蜂 | 跨位隧道、OAB 同步 | 5T 驗算 | DualHiveTunnel |

## 四、OAB (OmniAgentBus) 設定狀態

| 項目 | 狀態 | 備註 |
|------|------|------|
| TencentDB Core (8420) | ✅ healthy | `embeddingService:true` |
| TencentDB Hub (8125) | ✅ healthy | Panel 可視化 |
| TencentDB Proxy (8096) | ✅ LISTEN | — |
| 寫入端點 `/v1/memory` | ⚠️ 404 | 實際路徑待查 (oa-shared-memory 技能未載明) |
| oa-swarm OABClient | ✅ 優雅降級 | 寫入失敗不阻塞，健康檢查可用 |
| 雙蜂隧道 | ✅ 實作 | DualHiveTunnel 同步本地↔VPS |

## 五、實戰部署 (已驗證)

| 服務 | Port | 狀態 | 命令驗證 |
|------|------|------|---------|
| oa-swarm (60 矩陣) | 8800 | ✅ Up | `curl oa.esggo.co/health` (需 DNS) / `curl localhost:8800/health` |
| s2s-voice (語音代理) | 8765 | ✅ LISTEN | `ws://0.0.0.0:8765/v1/realtime` |
| nginx 反向代理 | 80 | ✅ reload | `Host: oa.esggo.co` → 8800 |
| OAB 三件套 | 8420/8125/8096 | ✅ healthy | `curl localhost:8420/health` |

## 六、待辦 (誠實清單)

1. **DNS**: Cloudflare 加 A 記錄 `oa.esggo.co → 161.118.248.180` (用戶操作或 cloudflare 技能)
2. **OAB 寫入端點**: 確認 tdai-memory-hub 實際 POST 路徑 (查 deploy.sh / 源碼)
3. **OAB 認證**: admin-key 注入 oa-swarm env (H3 憑證變更)
4. **s2s 對外**: `/voice/` 路徑經 nginx + Cloudflare 暴露 WSS

## 六、DNS 對外公開 (2026-08-21 完成)
- Cloudflare Zone: esggo.co (8dda3653e490290412f7be84a84e0dc9)
- A 記錄: oa.esggo.co → 161.118.248.180 (TTL 60, proxied=false 灰雲)
- 驗證: VPS nginx Host: oa.esggo.co → /health 回應正常
- API Token: cfut_*** (Zone:DNS:Edit, 用戶控制台建立, 不進 git)

## 七、HTTPS + 橙雲 CDN (2026-08-25 完成)
- Let's Encrypt: certbot --dns-cloudflare (DNS-01 挑戰, 不需開 443 對外)
- 證書: /etc/letsencrypt/live/oa.esggo.co/ (到期 2026-11-22, 自動續期)
- nginx: 443 SSL + 80→443 重定向 + /voice/ws WS 升級 (8765)
- Cloudflare: proxied=true (橙雲 CDN)
- 驗證: https://oa.esggo.co/health → ok; HTTP→301 HTTPS
- CF 憑證: /etc/letsencrypt/cloudflare.ini (DNS:Edit token, chmod 600, 不進 git)
