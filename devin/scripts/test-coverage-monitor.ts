#!/usr/bin/env ts-node
/**
 * Test Coverage Monitor - 無作妙德測試覆蓋監控系統
 * 
 * 用於監控和分析項目測試覆蓋率，生成覆蓋率報告
 * 並根據目標覆蓋率進行告警
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface CoverageTarget {
  current: number;
  target: number;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  estimatedEffort?: 'low' | 'medium' | 'high';
  deadline?: string;
}

interface CoverageConfig {
  version: string;
  lastUpdated: string;
  targets: {
    overall: CoverageTarget;
    modules: Record<string, CoverageTarget>;
  };
  excluded: string[];
  thresholds: {
    critical: number;
    warning: number;
    minimum: number;
  };
  alerts: {
    coverageDrop: {
      enabled: boolean;
      threshold: number;
      action: 'block_pr' | 'warning' | 'ignore';
    };
    belowTarget: {
      enabled: boolean;
      action: 'warning' | 'block_pr' | 'ignore';
    };
  };
}

interface CoverageReport {
  timestamp: string;
  overall: {
    files: number;
    testedFiles: number;
    coverage: number;
    target: number;
    gap: number;
    status: 'critical' | 'warning' | 'ok' | 'excellent';
  };
  modules: Array<{
    path: string;
    coverage: number;
    target: number;
    gap: number;
    priority: string;
    status: string;
  }>;
  alerts: string[];
  recommendations: string[];
}

class TestCoverageMonitor {
  private config: CoverageConfig;
  private configPath: string;

  constructor(configPath: string = '.devin/test-coverage-monitor.json') {
    this.configPath = path.resolve(configPath);
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      const configContent = fs.readFileSync(this.configPath, 'utf-8');
      this.config = JSON.parse(configContent);
    } catch (error) {
      console.error(`Failed to load config from ${this.configPath}:`, error);
      throw error;
    }
  }

  private saveConfig(): void {
    this.config.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
  }

  private runVitestCoverage(): string {
    try {
      const output = execSync('pnpm test:coverage', {
        encoding: 'utf-8',
        cwd: path.resolve('.')
      });
      return output;
    } catch (error) {
      console.error('Failed to run vitest coverage:', error);
      throw error;
    }
  }

  private parseCoverageOutput(output: string): Record<string, number> {
    // 簡化的覆蓋率解析 - 實際實現需要根據 vitest 輸出格式調整
    const coverage: Record<string, number> = {};
    
    // 解析 vitest 覆蓋率輸出
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.includes('%') && line.includes('src/')) {
        const match = line.match(/(\d+)%/);
        if (match) {
          const filePath = line.split(' ')[0];
          coverage[filePath] = parseInt(match[1], 10);
        }
      }
    }
    
    return coverage;
  }

  private calculateOverallCoverage(coverage: Record<string, number>): number {
    const values = Object.values(coverage);
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private getStatus(coverage: number, target: number): string {
    const gap = target - coverage;
    if (gap <= 0) return 'excellent';
    if (gap <= 10) return 'ok';
    if (gap <= 20) return 'warning';
    return 'critical';
  }

  private generateRecommendations(report: CoverageReport): string[] {
    const recommendations: string[] = [];

    // 整體覆蓋率建議
    if (report.overall.gap > 20) {
      recommendations.push('整體覆蓋率差距較大，建議優先處理 P0 關鍵路徑');
    }

    // 模組級別建議
    const criticalModules = report.modules.filter(m => m.status === 'critical');
    if (criticalModules.length > 0) {
      recommendations.push(`以下模組覆蓋率嚴重不足：${criticalModules.map(m => m.path).join(', ')}`);
    }

    // 優先級建議
    const p0Modules = report.modules.filter(m => m.priority === 'P0' && m.gap > 10);
    if (p0Modules.length > 0) {
      recommendations.push('P0 優先級模組需要立即處理測試覆蓋');
    }

    return recommendations;
  }

  private generateAlerts(report: CoverageReport): string[] {
    const alerts: string[] = [];

    // 覆蓋率下降告警
    if (this.config.alerts.coverageDrop.enabled) {
      const previousCoverage = this.config.targets.overall.current;
      const currentCoverage = report.overall.coverage;
      const drop = previousCoverage - currentCoverage;
      
      if (drop > this.config.alerts.coverageDrop.threshold) {
        alerts.push(`覆蓋率下降 ${drop}%，超過閾值 ${this.config.alerts.coverageDrop.threshold}%`);
        if (this.config.alerts.coverageDrop.action === 'block_pr') {
          alerts.push('ACTION: 此變更將被阻止合併');
        }
      }
    }

    // 低於目標告警
    if (this.config.alerts.belowTarget.enabled && report.overall.coverage < this.config.targets.overall.target) {
      alerts.push(`當前覆蓋率 ${report.overall.coverage}% 低於目標 ${this.config.targets.overall.target}%`);
    }

    return alerts;
  }

  public generateReport(): CoverageReport {
    console.log('Running test coverage analysis...');
    
    // 運行測試覆蓋
    const coverageOutput = this.runVitestCoverage();
    const coverage = this.parseCoverageOutput(coverageOutput);
    
    // 計算整體覆蓋率
    const overallCoverage = this.calculateOverallCoverage(coverage);
    const overallTarget = this.config.targets.overall.target;
    const overallGap = overallTarget - overallCoverage;
    
    // 生成模組報告
    const modules: CoverageReport['modules'] = [];
    for (const [modulePath, target] of Object.entries(this.config.targets.modules)) {
      const moduleCoverage = coverage[modulePath] || 0;
      const gap = target.target - moduleCoverage;
      const status = this.getStatus(moduleCoverage, target.target);
      
      modules.push({
        path: modulePath,
        coverage: moduleCoverage,
        target: target.target,
        gap,
        priority: target.priority,
        status
      });
    }

    // 生成報告
    const report: CoverageReport = {
      timestamp: new Date().toISOString(),
      overall: {
        files: Object.keys(coverage).length,
        testedFiles: Object.values(coverage).filter(c => c > 0).length,
        coverage: overallCoverage,
        target: overallTarget,
        gap: overallGap,
        status: this.getStatus(overallCoverage, overallTarget)
      },
      modules,
      alerts: [],
      recommendations: []
    };

    // 生成告警和建議
    report.alerts = this.generateAlerts(report);
    report.recommendations = this.generateRecommendations(report);

    // 更新配置中的當前覆蓋率
    this.config.targets.overall.current = overallCoverage;
    for (const module of modules) {
      if (this.config.targets.modules[module.path]) {
        this.config.targets.modules[module.path].current = module.coverage;
      }
    }
    this.saveConfig();

    return report;
  }

  public printReport(report: CoverageReport): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 測試覆蓋率監控報告');
    console.log('='.repeat(60));
    console.log(`📅 時間: ${report.timestamp}`);
    console.log(`🎯 整體覆蓋率: ${report.overall.coverage.toFixed(1)}% (目標: ${report.overall.target}%)`);
    console.log(`📈 狀態: ${report.overall.status.toUpperCase()}`);
    console.log(`📁 文件數: ${report.overall.files} / 測試文件: ${report.overall.testedFiles}`);
    
    console.log('\n📋 模組覆蓋率:');
    console.log('-'.repeat(60));
    for (const module of report.modules) {
      const statusIcon = module.status === 'excellent' ? '✅' : 
                        module.status === 'ok' ? '🟢' : 
                        module.status === 'warning' ? '⚠️' : '🔴';
      console.log(`${statusIcon} ${module.path}`);
      console.log(`   覆蓋率: ${module.coverage.toFixed(1)}% / 目標: ${module.target}% / 優先級: ${module.priority}`);
    }

    if (report.alerts.length > 0) {
      console.log('\n🚨 告警:');
      console.log('-'.repeat(60));
      for (const alert of report.alerts) {
        console.log(`⚠️ ${alert}`);
      }
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 建議:');
      console.log('-'.repeat(60));
      for (const recommendation of report.recommendations) {
        console.log(`📌 ${recommendation}`);
      }
    }

    console.log('\n' + '='.repeat(60));
  }

  public saveReport(report: CoverageReport, outputPath: string = '.devin/coverage-report.json'): void {
    const reportPath = path.resolve(outputPath);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 報告已保存到: ${reportPath}`);
  }
}

// 主程序
if (require.main === module) {
  const monitor = new TestCoverageMonitor();
  
  try {
    const report = monitor.generateReport();
    monitor.printReport(report);
    monitor.saveReport(report);
    
    // 根據狀態設置退出碼
    const status = report.overall.status;
    if (status === 'critical') {
      process.exit(1);
    } else if (status === 'warning') {
      process.exit(2);
    }
  } catch (error) {
    console.error('Coverage monitoring failed:', error);
    process.exit(1);
  }
}

export { TestCoverageMonitor, CoverageReport, CoverageConfig };