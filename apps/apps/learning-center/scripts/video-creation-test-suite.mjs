#!/usr/bin/env node
/**
 * AI永續議題影片創作測試流程
 * 用於驗證七道門檻是否通過
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 測試配置
const CONFIG = {
  projectRoot: __dirname,
  testSubject: "永續發展與技術規模化",
  outputDir: path.join(__dirname, '..', 'test-output'),
  reportFile: path.join(__dirname, '..', 'test-reports', 'evaluation-report.json')
};

// 七道門檻驗證規則
const EVALUATION_GATES = [
  {
    id: "gate-01",
    name: "腳本匯入場景生成",
    check: (videoData) => {
      const issues = [];
      
      // 檢查場景數量
      if (videoData.scenes && videoData.scenes.length < 6) {
        issues.push("場景數量不足（應6-16場）");
      }
      
      // 檢查時間碼（允許緊銈相接：endTime === next.startTime 為正常）
      if (videoData.scenes) {
        for (let i = 0; i < videoData.scenes.length - 1; i++) {
          const current = videoData.scenes[i];
          const next = videoData.scenes[i + 1];
          if (current.endTime > next.startTime) {
            issues.push(`場景${i}與${i+1}時間碼重疊`);
          }
        }
      }
      
      return {
        pass: issues.length === 0,
        issues,
        score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 20)
      };
    }
  },
  {
    id: "gate-02",
    name: "數據圖卡準確性",
    check: (videoData) => {
      const issues = [];
      
      if (videoData.dataCards) {
        videoData.dataCards.forEach((card, idx) => {
          if (!card.value || isNaN(card.value)) {
            issues.push(`數據卡${idx}缺少數字`);
          }
          if (!card.year || card.year < 1900 || card.year > 2030) {
            issues.push(`數據卡${idx}年份不合理`);
          }
          if (!card.source) {
            issues.push(`數據卡${idx}缺少來源標籤`);
          }
        });
      }
      
      return {
        pass: issues.length === 0,
        issues,
        score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 25)
      };
    }
  },
  {
    id: "gate-03",
    name: "視覺一致性",
    check: (videoData) => {
      const issues = [];
      
      if (videoData.thresholds && videoData.thresholds.length > 1) {
        const first = videoData.thresholds[0];
        videoData.thresholds.forEach((t, idx) => {
          if (t.color !== first.color) issues.push(`門檻${idx}顏色不一致`);
          if (t.font !== first.font) issues.push(`門檻${idx}字體不一致`);
          if (t.layout !== first.layout) issues.push(`門檻${idx}版面不一致`);
        });
      }
      
      return {
        pass: issues.length === 0,
        issues,
        score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 15)
      };
    }
  },
  {
    id: "gate-04",
    name: "AI B-roll人本感",
    check: (videoData) => {
      // 這裡需要人工評分，簡化為檢查標記
      const issues = [];
      
      if (videoData.broll && videoData.broll.flagging) {
        if (videoData.broll.flagging.includes("機器感")) {
          issues.push("B-roll存在機器感");
        }
        if (videoData.broll.flagging.includes("恐懼")) {
          issues.push("B-roll過度恐懼化");
        }
        if (videoData.broll.flagging.includes("悲情")) {
          issues.push("B-roll過度悲情化");
        }
      }
      
      return {
        pass: issues.length === 0,
        issues,
        score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 30)
      };
    }
  },
  {
    id: "gate-05",
    name: "品牌真實感",
    check: (videoData) => {
      const issues = [];
      
      // 檢查聲音比例
      if (videoData.audio) {
        if (videoData.audio.realVoiceRatio < 0.25) {
          issues.push("真實人聲比例不足（目標30%）");
        }
        if (videoData.audio.brollRatio < 0.40) {
          issues.push("B-roll音效比例不足（目標50%）");
        }
      }
      
      // 檢查語言風格
      if (videoData.metadata?.style !== "professor") {
        issues.push("語言風格不符合壽司博士風格");
      }
      
      return {
        pass: issues.length === 0,
        issues,
        score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 20)
      };
    }
  },
  {
    id: "gate-06",
    name: "子影片切割",
    check: (videoData) => {
      const issues = [];
      
      if (videoData.subVideos && videoData.subVideos.length !== 4) {
        issues.push(`子影片數量不符（應4支，實${videoData.subVideos?.length || 0}支）`);
      }
      
      if (videoData.thresholdCard) {
        // 檢查是否為單一圖卡
        if (typeof videoData.thresholdCard === 'object' && !videoData.thresholdCard.single) {
          issues.push("門檻圖卡應為單一圖片");
        }
      }
      
      return {
        pass: issues.length === 0,
        issues,
        score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 25)
      };
    }
  },
  {
    id: "gate-07",
    name: "最終定錨驗證",
    check: (videoData) => {
      const metrics = videoData.metrics || {};
      const issues = [];
      
      if ((metrics.completionRate || 0) < 0.70) {
        issues.push(`觀眻完成率不足（${(metrics.completionRate || 0) * 100}% < 70%）`);
      }
      if ((metrics.factErrorRate || 0) > 0.01) {
        issues.push(`事實錯誤率過高（${(metrics.factErrorRate || 0) * 100}% > 1%）`);
      }
      if ((metrics.humanFeelScore || 0) < 4) {
        issues.push(`人本感評分不足（${metrics.humanFeelScore || 0} < 4）`);
      }
      if ((metrics.visualConsistency || 0) < 0.90) {
        issues.push(`視覺一致性不足（${(metrics.visualConsistency || 0) * 100}% < 90%）`);
      }
      
      return {
        pass: issues.length === 0,
        issues,
        score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 20)
      };
    }
  }
];

// 執行測試
function runTestSuite(videoData) {
  console.log("=== AI永續議題影片創作測試 ===\n");
  
  const results = [];
  let totalScore = 0;
  
  EVALUATION_GATES.forEach(gate => {
    const result = gate.check(videoData);
    results.push({
      gateId: gate.id,
      gateName: gate.name,
      pass: result.pass,
      score: result.score,
      issues: result.issues
    });
    totalScore += result.score;
    
    console.log(`[ ${result.pass ? "✓" : "✗"} ] ${gate.name}`);
    console.log(`    得分: ${result.score}/100`);
    if (result.issues.length > 0) {
      console.log(`    問題: ${result.issues.join(", ")}`);
    }
    console.log("");
  });
  
  const averageScore = totalScore / EVALUATION_GATES.length;
  const allPassed = results.every(r => r.pass);
  
  console.log("=== 測試結果 ===");
  console.log(`總平均得分: ${averageScore.toFixed(1)}/100`);
  console.log(`是否全部通過: ${allPassed ? "是" : "否"}`);
  
  // 寫入報告
  const report = {
    timestamp: new Date().toISOString(),
    videoData,
    results,
    summary: {
      averageScore,
      allPassed,
      gatesPassed: results.filter(r => r.pass).length,
      gatesTotal: EVALUATION_GATES.length
    }
  };
  
  // 確保目錄存在
  const reportDir = path.dirname(CONFIG.reportFile);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(CONFIG.reportFile, JSON.stringify(report, null, 2));
  console.log(`\n報告已寫入: ${CONFIG.reportFile}`);
  
  return report;
}

// 從檔案載入測試資料
function loadVideoData(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("載入測試資料失敗:", error.message);
    return null;
  }
}

// 主程式
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("用法: node video-creation-test-suite.js <測試資料檔案.json>");
  console.log("範例: node video-creation-test-suite.js test-video.json");
  process.exit(1);
}

const videoData = loadVideoData(args[0]);

if (!videoData) {
  process.exit(1);
}

const report = runTestSuite(videoData);

// 退出碼：0 = 全部通過, 1 = 至少一個失敗
process.exit(report.summary.allPassed ? 0 : 1);