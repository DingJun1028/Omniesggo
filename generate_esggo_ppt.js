// ESGGO · AI × ESG 發展現況與公司效益 — 5 頁 PPT 生成腳本
// 執行：node generate_esggo_ppt.js  （需先 npm install pptxgenjs）
const pptxgen = require("pptxgenjs");
const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
const TEAL = "0E7C66", SEA = "1F9E8A", DARK = "0E3B34", WHITE = "FFFFFF", INK = "1A2B3C";

// 1. 封面
slide = pptx.addSlide();
slide.background = { color: DARK };
slide.addText("ESGGO PLATFORM · 5-PAGE BRIEF", { x:0.7, y:1.0, w:8, h:0.4, color:SEA, fontSize:14, bold:true, charSpacing:3 });
slide.addText("AI × ESG\n發展現況與公司效益", { x:0.7, y:1.6, w:11, h:2.2, color:WHITE, fontSize:46, bold:true, lineSpacing:54 });
slide.addText("本簡報說明 ESGGO 平台在 AI 與 ESG 兩大軸線的發展狀態，以及其為公司帶來的具體效益。", { x:0.7, y:4.0, w:10, h:1, color:WHITE, fontSize:18, transparent:true });
slide.addText("OA-Team 30 萬能蜂群 ｜ 2026-08-12 ｜ 5 頁", { x:0.7, y:6.7, w:8, h:0.4, color:"9FE7D4", fontSize:12 });

// 2. AI 發展狀態
const ai = [["蜂","OA-Team 30 萬能蜂群","30 個專精代理，遵循 5T 協定（可溯源/可追蹤/可感知/可透明/不可篡改）與 4 可 1 不可狀態機。"],
  ["控","Hermes Agent 總控","任務編排、自動修復引擎與 CI/CD 串接，錯誤自動匹配並修復，分身追蹤進度。"],
  ["學","學習中心自動化","作業上傳、課程回放、諮詢預約、滿意度調查全模組自動化，Firestore 即時訂閱。"],
  ["部","雙通道部署","GitHub Actions 自動部署至 Vercel 與 Firebase Hosting 雙通道，Docker/Nginx 支援主站。"]];
let s2 = pptx.addSlide(); s2.background={color:WHITE};
s2.addText("AI DEVELOPMENT STATUS", { x:0.7, y:0.6, w:8, h:0.4, color:SEA, fontSize:14, bold:true, charSpacing:3 });
s2.addText("AI 發展狀態", { x:0.7, y:1.0, w:8, h:0.8, color:INK, fontSize:32, bold:true });
ai.forEach((c,i)=>{ const x=0.7+(i%2)*6.1, y=2.0+Math.floor(i/2)*2.3;
  s2.addText(c[0], { x, y, w:0.6, h:0.6, color:WHITE, fill:{color:SEA}, align:"center", valign:"middle", fontSize:20, bold:true, borderRadius:0.3 });
  s2.addText(c[1], { x:x+0.8, y:y-0.05, w:5.2, h:0.5, color:TEAL, fontSize:18, bold:true });
  s2.addText(c[2], { x:x+0.8, y:y+0.45, w:5.2, h:1.4, color:INK, fontSize:13, lineSpacing:20 }); });

// 3. ESG 發展狀態
let s3 = pptx.addSlide(); s3.background={color:WHITE};
s3.addText("ESG DEVELOPMENT STATUS", { x:0.7, y:0.6, w:8, h:0.4, color:SEA, fontSize:14, bold:true, charSpacing:3 });
s3.addText("ESG 發展狀態", { x:0.7, y:1.0, w:8, h:0.8, color:INK, fontSize:32, bold:true });
const esg=[["E","🌲 環境友善","e6f4ea","1e7a46",["FTG TOURS 無痕山林、低碳交通","生態保育、垃圾減量","每趟旅程經 ESG 檢核"]],
  ["S","🤝 社會共益","fde8f0","b8336a",["柏克萊人才培育課程","國際化包容（三語）","在地採購、部落文化尊重"]],
  ["G","📊 企業治理","e6f0fb","2a5db0",["Firestore 安全規則（Admin 視角）","5T 可溯源 / 不可篡改","安全 SOP、Impact Note"]]];
esg.forEach((p,i)=>{ const x=0.7+i*4.0;
  s3.addShape(pptx.ShapeType.rect, { x, y:2.0, w:3.7, h:4.2, fill:{color:p[2]} });
  s3.addText(p[1], { x:x+0.2, y:2.2, w:3.3, h:0.6, color:p[3], fontSize:20, bold:true });
  s3.addText(p[4].map(t=>({text:t,bullet:true})), { x:x+0.2, y:3.0, w:3.3, h:3.0, color:INK, fontSize:14, lineSpacing:24 }); });

// 4. 給公司帶來的好處
let s4 = pptx.addSlide(); s4.background={color:WHITE};
s4.addText("BENEFITS TO THE COMPANY", { x:0.7, y:0.6, w:8, h:0.4, color:SEA, fontSize:14, bold:true, charSpacing:3 });
s4.addText("給公司帶來的好處", { x:0.7, y:1.0, w:8, h:0.8, color:INK, fontSize:32, bold:true });
const ben=[["↑","開發效率：CI/CD 雙通道自動部署，減少人工發布與回滾時間"],["↓","營運成本：自動修復機制降低維運人力與停機損失"],
  ["✓","合規透明：5T 協定確保可溯源、不可篡改，符合 ESG 揭露要求"],["★","品牌價值：ESG 旅遊 + 人才培育強化雇主與永續品牌"],["🎓","人才沉澱：柏克萊課程知識庫內化為公司資產"]];
ben.forEach((b,i)=>{ const x=0.7+(i%3)*4.0, y=2.0+Math.floor(i/3)*2.2;
  s4.addText(b[0], { x, y, w:0.8, h:0.8, color:TEAL, fontSize:34, bold:true });
  s4.addText(b[1], { x:x+0.9, y:y-0.05, w:3.0, h:1.8, color:INK, fontSize:14, lineSpacing:20 }); });

// 5. 總結與下一步
let s5 = pptx.addSlide(); s5.background={color:DARK};
s5.addText("SUMMARY & ROADMAP", { x:0.7, y:0.7, w:8, h:0.4, color:SEA, fontSize:14, bold:true, charSpacing:3 });
s5.addText("總結與下一步", { x:0.7, y:1.1, w:8, h:0.8, color:WHITE, fontSize:32, bold:true });
const road=[["1","短期（本週）","修復主站 502 與學習中心上線，恢復三大陣列全服務。"],
  ["2","中期（本季）","AI 代理擴充至客服與數據分析；FTG 洽詢表單對接 CRM。"],
  ["3","長期（年度）","ESG 揭露自動化報表，將 5T 資料流轉為可被審計的永續報告。"]];
road.forEach((r,i)=>{ const y=2.2+i*1.4;
  s5.addText(r[0], { x:0.7, y, w:0.6, h:0.6, color:WHITE, fill:{color:SEA}, align:"center", valign:"middle", fontSize:20, bold:true, borderRadius:0.3 });
  s5.addText(r[1], { x:1.5, y:y-0.05, w:4, h:0.5, color:"9FE7D4", fontSize:17, bold:true });
  s5.addText(r[2], { x:5.5, y:y-0.05, w:7, h:1.0, color:WHITE, fontSize:14, lineSpacing:20 }); });

pptx.writeFile({ fileName: "ESGGO_AI_ESG_5pages.pptx" }).then(f=>console.log("SAVED:", f));
