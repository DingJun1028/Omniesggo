// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * ==========================================
 * ESG 資料分析引擎 - 視覺化模組
 * ==========================================
 */

import {
  ESGAnalysisResult,
  ESGScores,
  ESGBenchmark,
  ESGTrend,
  ESGVisualizationConfig,
  VisualizationComponent,
} from './types';

// ==========================================
// ESG 視覺化引擎
// ==========================================

export class ESGVisualizationEngine {
  private static instance: ESGVisualizationEngine;

  private constructor() {}

  static getInstance(): ESGVisualizationEngine {
    if (!ESGVisualizationEngine.instance) {
      ESGVisualizationEngine.instance = new ESGVisualizationEngine();
    }
    return ESGVisualizationEngine.instance;
  }

  // ==========================================
  // 圖表生成
  // ==========================================

  /**
   * 生成雷達圖配置
   */
  generateRadarChart(scores: ESGScores): VisualizationComponent {
    return {
      id: 'radar-scores',
      type: 'radar',
      title: 'ESG 分數雷達圖',
      data: {
        labels: ['環境 (E)', '社會 (S)', '治理 (G)'],
        datasets: [
          {
            label: '當前分數',
            data: [
              scores.environmental.score,
              scores.social.score,
              scores.governance.score,
            ],
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
          },
          {
            label: '行業平均',
            data: [65, 60, 70],
            backgroundColor: 'rgba(156, 163, 175, 0.2)',
            borderColor: 'rgba(156, 163, 175, 1)',
            borderWidth: 2,
          },
        ],
      },
      position: { column: 1, row: 1, colspan: 2, rowspan: 2 },
      options: {
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
          },
        },
      },
    };
  }

  /**
   * 生成長條圖配置
   */
  generateBarChart(benchmarks: ESGBenchmark[]): VisualizationComponent {
    return {
      id: 'bar-benchmarks',
      type: 'bar',
      title: '基準比較',
      data: {
        labels: benchmarks.map((b) => b.metric),
        datasets: [
          {
            label: '公司表現',
            data: benchmarks.map((b) => b.value),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
          },
          {
            label: '行業平均',
            data: benchmarks.map((b) => b.industryAverage),
            backgroundColor: 'rgba(156, 163, 175, 0.8)',
          },
          {
            label: '行業最佳',
            data: benchmarks.map((b) => b.industryBest),
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
          },
        ],
      },
      position: { column: 3, row: 1, colspan: 2, rowspan: 2 },
      options: {
        indexAxis: 'y',
        scales: {
          x: {
            beginAtZero: true,
          },
        },
      },
    };
  }

  /**
   * 生成圓餅圖配置
   */
  generatePieChart(scores: ESGScores): VisualizationComponent {
    const _total = scores.environmental.score + scores.social.score + scores.governance.score;

    return {
      id: 'pie-scores',
      type: 'pie',
      title: 'ESG 分數佔比',
      data: {
        labels: ['環境 (E)', '社會 (S)', '治理 (G)'],
        datasets: [
          {
            data: [
              scores.environmental.score,
              scores.social.score,
              scores.governance.score,
            ],
            backgroundColor: [
              'rgba(34, 197, 94, 0.8)',
              'rgba(59, 130, 246, 0.8)',
              'rgba(168, 85, 247, 0.8)',
            ],
            borderWidth: 1,
          },
        ],
      },
      position: { column: 1, row: 3, colspan: 1, rowspan: 1 },
      options: {
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
      },
    };
  }

  /**
   * 生成儀錶板配置
   */
  generateGaugeChart(score: number, label: string): VisualizationComponent {
    return {
      id: `gauge-${label.toLowerCase()}`,
      type: 'gauge',
      title: `${label} 分數`,
      data: {
        value: score,
        min: 0,
        max: 100,
        zones: [
          { from: 0, to: 30, color: 'rgba(239, 68, 68, 0.8)' },
          { from: 30, to: 60, color: 'rgba(234, 179, 8, 0.8)' },
          { from: 60, to: 80, color: 'rgba(59, 130, 246, 0.8)' },
          { from: 80, to: 100, color: 'rgba(34, 197, 94, 0.8)' },
        ],
      },
      position: { column: 2, row: 3, colspan: 1, rowspan: 1 },
      options: {
        thickness: 15,
      },
    };
  }

  /**
   * 生成趨勢圖配置
   */
  generateLineChart(trends: ESGTrend[]): VisualizationComponent {
    return {
      id: 'line-trends',
      type: 'line',
      title: 'ESG 趨勢',
      data: {
        labels: trends.map((t) => t.metric),
        datasets: [
          {
            label: '變化率 (%)',
            data: trends.map((t) => t.changeRate),
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            fill: true,
            tension: 0.4,
          },
        ],
      },
      position: { column: 3, row: 3, colspan: 2, rowspan: 1 },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    };
  }

  /**
   * 生成表格配置
   */
  generateTable(benchmarks: ESGBenchmark[]): VisualizationComponent {
    return {
      id: 'table-benchmarks',
      type: 'table',
      title: '基準詳細比較',
      data: {
        headers: ['指標', '公司表現', '行業平均', '行業最佳', '狀態'],
        rows: benchmarks.map((b) => [
          b.metric,
          `${b.value} ${b.unit}`,
          `${b.industryAverage} ${b.unit}`,
          `${b.industryBest} ${b.unit}`,
          b.value >= b.industryAverage ? '✓ 高於平均' : '✗ 低於平均',
        ]),
      },
      position: { column: 1, row: 4, colspan: 4, rowspan: 1 },
      options: {
        striped: true,
        hover: true,
      },
    };
  }

  // ==========================================
  // 儀錶板生成
  // ==========================================

  /**
   * 生成完整儀錶板配置
   */
  generateDashboard(result: ESGAnalysisResult): ESGVisualizationConfig {
    const components: VisualizationComponent[] = [
      this.generateRadarChart(result.scores),
      this.generateBarChart(result.benchmarks),
      this.generatePieChart(result.scores),
      this.generateGaugeChart(result.scores.environmental.score, '環境'),
      this.generateLineChart(result.trends),
      this.generateTable(result.benchmarks),
    ];

    return {
      type: 'dashboard',
      title: 'ESG 分析儀錶板',
      description: `分析期間: ${result.period.start.toLocaleDateString()} - ${result.period.end.toLocaleDateString()}`,
      layout: {
        columns: 4,
        rows: 4,
        gap: 16,
      },
      components,
    };
  }

  // ==========================================
  // HTML 生成
  // ==========================================

  /**
   * 生成 HTML 報告
   */
  generateHTMLReport(result: ESGAnalysisResult): string {
    const _dashboard = this.generateDashboard(result);

    return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ESG 分析報告</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      background: linear-gradient(135deg, #1e1b4b 0%, #581c87 50%, #1e1b4b 100%);
      min-height: 100vh;
    }
    .glass {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
  </style>
</head>
<body class="text-white p-8">
  <div class="max-w-7xl mx-auto">
    <header class="text-center mb-12">
      <h1 class="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        ESG 分析報告
      </h1>
      <p class="text-gray-400 text-lg">
        ${result.period.start.toLocaleDateString()} - ${result.period.end.toLocaleDateString()}
      </p>
    </header>

    <!-- 總體分數 -->
    <div class="grid grid-cols-4 gap-6 mb-8">
      <div class="glass rounded-xl p-6 text-center">
        <div class="text-4xl font-bold text-white mb-2">${result.scores.overall}</div>
        <div class="text-gray-400">整體分數</div>
        <div class="text-sm text-purple-400 mt-1">/ 100</div>
      </div>
      <div class="glass rounded-xl p-6 text-center">
        <div class="text-4xl font-bold text-green-400 mb-2">${result.scores.environmental.score}</div>
        <div class="text-gray-400">環境 (E)</div>
        <div class="text-sm text-green-400 mt-1">${result.scores.environmental.rank}</div>
      </div>
      <div class="glass rounded-xl p-6 text-center">
        <div class="text-4xl font-bold text-blue-400 mb-2">${result.scores.social.score}</div>
        <div class="text-gray-400">社會 (S)</div>
        <div class="text-sm text-blue-400 mt-1">${result.scores.social.rank}</div>
      </div>
      <div class="glass rounded-xl p-6 text-center">
        <div class="text-4xl font-bold text-purple-400 mb-2">${result.scores.governance.score}</div>
        <div class="text-gray-400">治理 (G)</div>
        <div class="text-sm text-purple-400 mt-1">${result.scores.governance.rank}</div>
      </div>
    </div>

    <!-- 圖表區域 -->
    <div class="grid grid-cols-2 gap-8 mb-8">
      <div class="glass rounded-xl p-6">
        <h2 class="text-xl font-bold mb-4 text-purple-400">ESG 分數雷達圖</h2>
        <canvas id="radarChart"></canvas>
      </div>
      <div class="glass rounded-xl p-6">
        <h2 class="text-xl font-bold mb-4 text-blue-400">基準比較</h2>
        <canvas id="barChart"></canvas>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-8 mb-8">
      <div class="glass rounded-xl p-6">
        <h2 class="text-xl font-bold mb-4 text-green-400">分數佔比</h2>
        <canvas id="pieChart"></canvas>
      </div>
      <div class="glass rounded-xl p-6">
        <h2 class="text-xl font-bold mb-4 text-yellow-400">環境分數</h2>
        <div class="flex justify-center items-center h-48">
          <div class="relative">
            <svg class="w-32 h-32" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="10"/>
              <circle cx="50" cy="50" r="40" fill="none" stroke="url(#gaugeGradient)" stroke-width="10"
                stroke-dasharray="${(result.scores.environmental.score / 100) * 251.2} 251.2"
                transform="rotate(-90 50 50)"/>
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#22c55e"/>
                  <stop offset="100%" stop-color="#3b82f6"/>
                </linearGradient>
              </defs>
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-3xl font-bold">${result.scores.environmental.score}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="glass rounded-xl p-6">
        <h2 class="text-xl font-bold mb-4 text-cyan-400">趨勢分析</h2>
        <canvas id="lineChart"></canvas>
      </div>
    </div>

    <!-- 洞察與建議 -->
    <div class="grid grid-cols-2 gap-8 mb-8">
      <div class="glass rounded-xl p-6">
        <h2 class="text-xl font-bold mb-4 text-green-400">主要洞察</h2>
        <div class="space-y-3">
          ${result.insights
            .slice(0, 5)
            .map(
              (insight) => `
            <div class="bg-white/5 rounded-lg p-4">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-${insight.type === 'positive' ? 'green' : insight.type === 'negative' ? 'red' : 'yellow'}-400">
                  ${insight.type === 'positive' ? '✓' : insight.type === 'negative' ? '✗' : '⚠'}
                </span>
                <span class="font-medium">${insight.title}</span>
              </div>
              <p class="text-sm text-gray-400">${insight.description}</p>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
      <div class="glass rounded-xl p-6">
        <h2 class="text-xl font-bold mb-4 text-blue-400">改善建議</h2>
        <div class="space-y-3">
          ${result.recommendations
            .slice(0, 5)
            .map(
              (rec) => `
            <div class="bg-white/5 rounded-lg p-4">
              <div class="flex items-center gap-2 mb-2">
                <span class="px-2 py-0.5 rounded text-xs bg-${
                  rec.priority === 'critical' ? 'red' : rec.priority === 'high' ? 'yellow' : 'blue'
                }-500/30 text-${rec.priority === 'critical' ? 'red' : rec.priority === 'high' ? 'yellow' : 'blue'}-400">
                  ${rec.priority.toUpperCase()}
                </span>
                <span class="font-medium">${rec.title}</span>
              </div>
              <p class="text-sm text-gray-400">${rec.description}</p>
              <p class="text-xs text-gray-500 mt-2">預期效果: ${rec.expectedImpact}</p>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    </div>

    <footer class="text-center text-gray-500 text-sm">
      ESG GO Platform - 資料分析引擎
    </footer>
  </div>

  <script>
    // 雷達圖
    new Chart(document.getElementById('radarChart'), {
      type: 'radar',
      data: {
        labels: ['環境 (E)', '社會 (S)', '治理 (G)'],
        datasets: [{
          label: '當前分數',
          data: [${result.scores.environmental.score}, ${result.scores.social.score}, ${result.scores.governance.score}],
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2
        }, {
          label: '行業平均',
          data: [65, 60, 70],
          backgroundColor: 'rgba(156, 163, 175, 0.2)',
          borderColor: 'rgba(156, 163, 175, 1)',
          borderWidth: 2
        }]
      },
      options: {
        scales: { r: { beginAtZero: true, max: 100 } }
      }
    });

    // 長條圖
    new Chart(document.getElementById('barChart'), {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(result.benchmarks.map((b) => b.metric))},
        datasets: [{
          label: '公司表現',
          data: ${JSON.stringify(result.benchmarks.map((b) => b.value))},
          backgroundColor: 'rgba(59, 130, 246, 0.8)'
        }, {
          label: '行業平均',
          data: ${JSON.stringify(result.benchmarks.map((b) => b.industryAverage))},
          backgroundColor: 'rgba(156, 163, 175, 0.8)'
        }]
      },
      options: { indexAxis: 'y', scales: { x: { beginAtZero: true } } }
    });

    // 圓餅圖
    new Chart(document.getElementById('pieChart'), {
      type: 'pie',
      data: {
        labels: ['環境 (E)', '社會 (S)', '治理 (G)'],
        datasets: [{
          data: [${result.scores.environmental.score}, ${result.scores.social.score}, ${result.scores.governance.score}],
          backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(168, 85, 247, 0.8)']
        }]
      }
    });

    // 趨勢圖
    new Chart(document.getElementById('lineChart'), {
      type: 'line',
      data: {
        labels: ${JSON.stringify(result.trends.map((t) => t.metric))},
        datasets: [{
          label: '變化率 (%)',
          data: ${JSON.stringify(result.trends.map((t) => t.changeRate))},
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          fill: true,
          tension: 0.4
        }]
      }
    });
  </script>
</body>
</html>
    `.trim();
  }
}

// ==========================================
// 匯出單例
// ==========================================

export const esgVisualizationEngine = ESGVisualizationEngine.getInstance();
