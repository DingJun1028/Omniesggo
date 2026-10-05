#!/usr/bin/env ts-node
/**
 * API Architecture Optimizer - 無作妙德 API 架構優化工具
 * 
 * 自動修復雙重包裝問題，統一 API 響應格式
 * 替換原始 Response.json 為標準 jsonResponse/jsonError
 */

import * as fs from 'fs';
import * as path from 'path';

interface ApiIssue {
  file: string;
  line: number;
  type: 'double_envelope' | 'raw_response' | 'missing_error_code';
  context: string;
  severity: 'high' | 'medium' | 'low';
  autoFixable: boolean;
  suggestedFix: string;
}

interface ApiArchitectureReport {
  timestamp: string;
  totalIssues: number;
  issues: ApiIssue[];
  summary: {
    byFile: Record<string, number>;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  };
  fixed: number;
  failed: number;
}

class ApiArchitectureOptimizer {
  private targetRoutes: string[] = [
    'app/api/daily-report/route.ts',
    'app/api/user/growth/route.ts',
    'app/api/daily-report/generate/route.ts',
    'app/api/user/leaderboard/route.ts',
    'app/api/user/subscription/route.ts',
    'app/api/user/growth/xp/route.ts',
    'app/api/user/tasks/route.ts',
    'app/api/surveys/route.ts',
    'app/api/local-ai/chat/route.ts',
    'app/api/sustain-center/dashboard/route.ts',
    'app/api/sustain-write/c-version/route.ts',
    'app/api/data/export/route.ts',
    'app/api/omni-core/status/route.ts'
  ];

  private issuePatterns = [
    {
      type: 'double_envelope' as const,
      regex: /jsonResponse\(\{ success: true/g,
      severity: 'high' as const,
      suggestedFix: '移除內層 { success: true, ... }，直接傳遞數據'
    },
    {
      type: 'raw_response' as const,
      regex: /NextResponse\.json\(/g,
      severity: 'high' as const,
      suggestedFix: '使用 jsonResponse() 或 jsonError() 替代'
    },
    {
      type: 'raw_response' as const,
      regex: /Response\.json\(/g,
      severity: 'high' as const,
      suggestedFix: '使用 jsonResponse() 或 jsonError() 替代'
    },
    {
      type: 'missing_error_code' as const,
      regex: /jsonError\('[A-Z_]+',/g,
      severity: 'medium' as const,
      suggestedFix: '使用 @esggo/errors 中的標準錯誤代碼'
    }
  ];

  public analyzeApiIssues(): ApiIssue[] {
    const issues: ApiIssue[] = [];
    
    console.log('🔍 分析 API 架構問題...\n');

    for (const file of this.targetRoutes) {
      const filePath = path.resolve(file);
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  文件不存在: ${file}`);
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const lineNum = index + 1;
        
        for (const pattern of this.issuePatterns) {
          const matches = line.matchAll(pattern.regex);
          for (const match of matches) {
            if (match.index !== undefined) {
              issues.push({
                file,
                line: lineNum,
                type: pattern.type,
                context: line.trim(),
                severity: pattern.severity,
                autoFixable: this.isAutoFixable(line, pattern.type),
                suggestedFix: pattern.suggestedFix
              });
            }
          }
        }
      });
    }

    return issues;
  }

  private isAutoFixable(line: string, type: string): boolean {
    // 檢查是否可以安全地自動修復
    const hasJsonResponse = line.includes('jsonResponse');
    const hasJsonError = line.includes('jsonError');
    const hasNextResponse = line.includes('NextResponse.json');
    
    switch (type) {
      case 'double_envelope':
        return hasJsonResponse && !hasNextResponse;
      case 'raw_response':
        return hasNextResponse && !hasJsonResponse && !hasJsonError;
      case 'missing_error_code':
        return hasJsonError;
      default:
        return false;
    }
  }

  private fixApiIssue(issue: ApiIssue): boolean {
    const filePath = path.resolve(issue.file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const lineIndex = issue.line - 1;
    const originalLine = lines[lineIndex];
    
    // 修復策略
    let fixedLine = originalLine;
    
    switch (issue.type) {
      case 'double_envelope':
        // 移除雙重包裝
        fixedLine = originalLine.replace(/jsonResponse\(\{ success: true, data: /, 'jsonResponse(');
        break;
        
      case 'raw_response':
        // 替換原始 Response
        fixedLine = originalLine
          .replace(/NextResponse\.json\(/, 'jsonResponse(')
          .replace(/Response\.json\(/, 'jsonResponse(');
        break;
        
      case 'missing_error_code':
        // 使用標準錯誤代碼
        fixedLine = originalLine
          .replace(/jsonError\('[A-Z_]+',/, "jsonError('INTERNAL_ERROR',");
        break;
    }

    if (fixedLine !== originalLine) {
      lines[lineIndex] = fixedLine;
      fs.writeFileSync(filePath, lines.join('\n'));
      return true;
    }

    return false;
  }

  public generateReport(issues: ApiIssue[]): ApiArchitectureReport {
    const summary = {
      byFile: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>
    };

    for (const issue of issues) {
      summary.byFile[issue.file] = (summary.byFile[issue.file] || 0) + 1;
      summary.byType[issue.type] = (summary.byType[issue.type] || 0) + 1;
      summary.bySeverity[issue.severity] = (summary.bySeverity[issue.severity] || 0) + 1;
    }

    return {
      timestamp: new Date().toISOString(),
      totalIssues: issues.length,
      issues,
      summary,
      fixed: 0,
      failed: 0
    };
  }

  public printReport(report: ApiArchitectureReport): void {
    console.log('\n' + '='.repeat(60));
    console.log('🌐 API 架構優化報告');
    console.log('='.repeat(60));
    console.log(`📅 時間: ${report.timestamp}`);
    console.log(`🔢 總計問題: ${report.totalIssues}`);
    console.log(`✅ 已修復: ${report.fixed}`);
    console.log(`❌ 修復失敗: ${report.failed}`);
    
    console.log('\n📊 統計摘要:');
    console.log('-'.repeat(60));
    console.log('按文件統計:');
    for (const [file, count] of Object.entries(report.summary.byFile)) {
      console.log(`  ${file}: ${count} 處`);
    }
    
    console.log('\n按類型統計:');
    for (const [type, count] of Object.entries(report.summary.byType)) {
      console.log(`  ${type}: ${count} 處`);
    }
    
    console.log('\n按嚴重性統計:');
    for (const [severity, count] of Object.entries(report.summary.bySeverity)) {
      console.log(`  ${severity}: ${count} 處`);
    }

    if (report.issues.length > 0) {
      console.log('\n📋 詳細問題情況:');
      console.log('-'.repeat(60));
      for (const issue of report.issues) {
        const severityIcon = issue.severity === 'high' ? '🔴' : 
                            issue.severity === 'medium' ? '🟡' : '🟢';
        const autoFixIcon = issue.autoFixable ? '🔧' : '📝';
        
        console.log(`${severityIcon} ${autoFixIcon} ${issue.file}:${issue.line}`);
        console.log(`   類型: ${issue.type}`);
        console.log(`   建議: ${issue.suggestedFix}`);
        console.log(`   上下文: ${issue.context.substring(0, 80)}...`);
        console.log();
      }
    }

    console.log('\n' + '='.repeat(60));
  }

  public saveReport(report: ApiArchitectureReport, outputPath: string = '.devin/api-architecture-report.json'): void {
    const reportPath = path.resolve(outputPath);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 報告已保存到: ${reportPath}`);
  }

  public fixAllIssues(report: ApiArchitectureReport): void {
    console.log(`\n🔧 自動修復 ${report.issues.length} 個 API 問題...`);

    let fixedCount = 0;
    let failedCount = 0;

    for (const issue of report.issues) {
      if (issue.autoFixable) {
        const success = this.fixApiIssue(issue);
        if (success) {
          fixedCount++;
          console.log(`✅ 修復: ${issue.file}:${issue.line}`);
        } else {
          failedCount++;
          console.log(`❌ 修復失敗: ${issue.file}:${issue.line}`);
        }
      } else {
        console.log(`📝 需要手動修復: ${issue.file}:${issue.line}`);
      }
    }

    report.fixed = fixedCount;
    report.failed = failedCount;

    console.log('\n' + '='.repeat(60));
    console.log(`📊 修復完成`);
    console.log(`✅ 成功: ${fixedCount}`);
    console.log(`❌ 失敗: ${failedCount}`);
    console.log(`📝 需手動: ${report.issues.length - fixedCount - failedCount}`);
    console.log('='.repeat(60));
  }

  public generateManualFixGuide(issues: ApiIssue[]): string {
    let guide = '# API 架構手動修復指南\n\n';
    guide += `生成時間: ${new Date().toISOString()}\n\n`;
    
    const manualIssues = issues.filter(i => !i.autoFixable);
    
    if (manualIssues.length === 0) {
      guide += '✅ 所有 API 問題都可以自動修復\n';
      return guide;
    }

    guide += '## 需要手動修復的 API 問題\n\n';
    
    for (const issue of manualIssues) {
      guide += `### ${issue.file}:${issue.line}\n`;
      guide += `- 類型: ${issue.type}\n`;
      guide += `- 嚴重性: ${issue.severity}\n`;
      guide += `- 當前代碼: \`${issue.context}\`\n`;
      guide += `- 修復建議: ${issue.suggestedFix}\n\n`;
    }

    guide += '## API 響應格式標準\n\n';
    guide += '### 成功響應\n';
    guide += '```typescript\n';
    guide += '// ✅ 正確做法\n';
    guide += 'return jsonResponse(data);\n';
    guide += '// 返回: { success: true, data }\n';
    guide += '```\n\n';
    
    guide += '### 錯誤響應\n';
    guide += '```typescript\n';
    guide += '// ✅ 正確做法\n';
    guide += 'return jsonError(\'INTERNAL_ERROR\', \'Internal server error\');\n';
    guide += '// 返回: { success: false, error, code }\n';
    guide += '```\n\n';
    
    guide += '### 錯誤代碼\n';
    guide += '所有錯誤代碼必須從 @esggo/errors 導入:\n';
    guide += '```typescript\n';
    guide += 'import { ERROR_CODES, type ErrorCodeKey } from \'@esggo/errors\';\n';
    guide += '```\n';

    return guide;
  }
}

// 主程序
if (require.main === module) {
  const optimizer = new ApiArchitectureOptimizer();
  
  try {
    const issues = optimizer.analyzeApiIssues();
    const report = optimizer.generateReport(issues);
    
    optimizer.printReport(report);
    optimizer.saveReport(report);
    
    // 生成手動修復指南
    const manualGuide = optimizer.generateManualFixGuide(issues);
    const guidePath = '.devin/api-architecture-manual-fix.md';
    fs.writeFileSync(guidePath, manualGuide);
    console.log(`📄 手動修復指南已保存到: ${guidePath}`);
    
    // 檢查是否執行修復
    const shouldFix = process.argv.includes('--fix');
    if (shouldFix) {
      optimizer.fixAllIssues(report);
      // 保存更新後的報告
      optimizer.saveReport(report);
    } else {
      console.log('\n💡 使用 --fix 參數執行自動修復');
    }
    
    // 根據結果設置退出碼
    if (report.totalIssues > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('API architecture optimization failed:', error);
    process.exit(1);
  }
}

export { ApiArchitectureOptimizer, ApiIssue, ApiArchitectureReport };