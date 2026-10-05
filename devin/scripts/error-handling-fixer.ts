#!/usr/bin/env ts-node
/**
 * Error Handling Fixer - 無作妙德錯誤處理修復工具
 * 
 * 自動修復錯誤訊息洩漏問題，建立圓通錯誤流
 * 替換所有 error.message 和 err.message 為通用錯誤訊息
 */

import * as fs from 'fs';
import * as path from 'path';

interface ErrorLeak {
  file: string;
  line: number;
  pattern: string;
  context: string;
  severity: 'high' | 'medium' | 'low';
  autoFixable: boolean;
}

interface ErrorHandlingReport {
  timestamp: string;
  totalLeaks: number;
  leaks: ErrorLeak[];
  summary: {
    byFile: Record<string, number>;
    byPattern: Record<string, number>;
    bySeverity: Record<string, number>;
  };
  fixed: number;
  failed: number;
}

class ErrorHandlingFixer {
  private targetRoutes: string[] = [
    'app/api/sustain-write/v5/preview/route.ts',
    'app/api/sustain-write/v5/download/route.ts',
    'app/api/data/export/route.ts',
    'app/api/daily-report/route.ts',
    'app/api/daily-report/generate/route.ts',
    'app/api/user/growth/route.ts',
    'app/api/user/leaderboard/route.ts',
    'app/api/user/subscription/route.ts',
    'app/api/user/growth/xp/route.ts',
    'app/api/user/tasks/route.ts',
    'app/api/nexus/route.ts',
    'app/api/village/data/route.ts',
    'app/api/village/members/route.ts',
    'app/api/village/projects/route.ts',
    'app/api/village/trends/route.ts',
    'app/api/village/vote/route.ts',
    'app/api/omni/plugins/route.ts',
    'app/api/omni-agent/console/route.ts',
    'app/api/omni-user-registry/route.ts',
    'app/api/omni-core/status/route.ts'
  ];

  private errorPatterns = [
    { regex: /error\.message/g, type: 'error_message', severity: 'high' },
    { regex: /err\.message/g, type: 'err_message', severity: 'high' },
    { regex: /error instanceof Error/g, type: 'error_instance', severity: 'medium' },
    { regex: /err instanceof Error/g, type: 'err_instance', severity: 'medium' }
  ];

  private genericErrorMessage = 'Internal server error';
  private genericErrorCode = 'INTERNAL_ERROR';

  public analyzeErrorLeaks(): ErrorLeak[] {
    const leaks: ErrorLeak[] = [];
    
    console.log('🔍 分析錯誤訊息洩漏...\n');

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
        
        for (const pattern of this.errorPatterns) {
          const matches = line.matchAll(pattern.regex);
          for (const match of matches) {
            if (match.index !== undefined) {
              leaks.push({
                file,
                line: lineNum,
                pattern: pattern.type,
                context: line.trim(),
                severity: pattern.severity as 'high' | 'medium' | 'low',
                autoFixable: this.isAutoFixable(line, pattern.type)
              });
            }
          }
        }
      });
    }

    return leaks;
  }

  private isAutoFixable(line: string, pattern: string): boolean {
    // 檢查是否可以安全地自動修復
    const hasJsonError = line.includes('jsonError');
    const hasCatchBlock = line.includes('catch');
    const hasReturn = line.includes('return');
    
    // 只有在 catch 塊中的錯誤訊息洩漏才能安全修復
    return hasCatchBlock && hasReturn && !hasJsonError;
  }

  private fixErrorLeak(leak: ErrorLeak): boolean {
    const filePath = path.resolve(leak.file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const lineIndex = leak.line - 1;
    const originalLine = lines[lineIndex];
    
    // 修復策略
    let fixedLine = originalLine;
    
    switch (leak.pattern) {
      case 'error_message':
      case 'err_message':
        // 替換 error.message 或 err.message 為通用錯誤訊息
        fixedLine = originalLine
          .replace(/error\.message/g, `'${this.genericErrorMessage}'`)
          .replace(/err\.message/g, `'${this.genericErrorMessage}'`);
        break;
        
      case 'error_instance':
      case 'err_instance':
        // 移除 instanceof Error 檢查，直接使用通用錯誤處理
        fixedLine = originalLine
          .replace(/error instanceof Error/g, 'true')
          .replace(/err instanceof Error/g, 'true');
        break;
    }

    if (fixedLine !== originalLine) {
      lines[lineIndex] = fixedLine;
      fs.writeFileSync(filePath, lines.join('\n'));
      return true;
    }

    return false;
  }

  public generateReport(leaks: ErrorLeak[]): ErrorHandlingReport {
    const summary = {
      byFile: {} as Record<string, number>,
      byPattern: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>
    };

    for (const leak of leaks) {
      summary.byFile[leak.file] = (summary.byFile[leak.file] || 0) + 1;
      summary.byPattern[leak.pattern] = (summary.byPattern[leak.pattern] || 0) + 1;
      summary.bySeverity[leak.severity] = (summary.bySeverity[leak.severity] || 0) + 1;
    }

    return {
      timestamp: new Date().toISOString(),
      totalLeaks: leaks.length,
      leaks,
      summary,
      fixed: 0,
      failed: 0
    };
  }

  public printReport(report: ErrorHandlingReport): void {
    console.log('\n' + '='.repeat(60));
    console.log('🛡️  錯誤處理修復報告');
    console.log('='.repeat(60));
    console.log(`📅 時間: ${report.timestamp}`);
    console.log(`🔢 總計洩漏: ${report.totalLeaks}`);
    console.log(`✅ 已修復: ${report.fixed}`);
    console.log(`❌ 修復失敗: ${report.failed}`);
    
    console.log('\n📊 統計摘要:');
    console.log('-'.repeat(60));
    console.log('按文件統計:');
    for (const [file, count] of Object.entries(report.summary.byFile)) {
      console.log(`  ${file}: ${count} 處`);
    }
    
    console.log('\n按模式統計:');
    for (const [pattern, count] of Object.entries(report.summary.byPattern)) {
      console.log(`  ${pattern}: ${count} 處`);
    }
    
    console.log('\n按嚴重性統計:');
    for (const [severity, count] of Object.entries(report.summary.bySeverity)) {
      console.log(`  ${severity}: ${count} 處`);
    }

    if (report.leaks.length > 0) {
      console.log('\n📋 詳細洩漏情況:');
      console.log('-'.repeat(60));
      for (const leak of report.leaks) {
        const severityIcon = leak.severity === 'high' ? '🔴' : 
                            leak.severity === 'medium' ? '🟡' : '🟢';
        const autoFixIcon = leak.autoFixable ? '🔧' : '📝';
        
        console.log(`${severityIcon} ${autoFixIcon} ${leak.file}:${leak.line}`);
        console.log(`   模式: ${leak.pattern}`);
        console.log(`   上下文: ${leak.context.substring(0, 80)}...`);
        console.log();
      }
    }

    console.log('\n' + '='.repeat(60));
  }

  public saveReport(report: ErrorHandlingReport, outputPath: string = '.devin/error-handling-report.json'): void {
    const reportPath = path.resolve(outputPath);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 報告已保存到: ${reportPath}`);
  }

  public fixAllLeaks(report: ErrorHandlingReport): void {
    console.log(`\n🔧 自動修復 ${report.leaks.length} 個錯誤洩漏...`);

    let fixedCount = 0;
    let failedCount = 0;

    for (const leak of report.leaks) {
      if (leak.autoFixable) {
        const success = this.fixErrorLeak(leak);
        if (success) {
          fixedCount++;
          console.log(`✅ 修復: ${leak.file}:${leak.line}`);
        } else {
          failedCount++;
          console.log(`❌ 修復失敗: ${leak.file}:${leak.line}`);
        }
      } else {
        console.log(`📝 需要手動修復: ${leak.file}:${leak.line}`);
      }
    }

    report.fixed = fixedCount;
    report.failed = failedCount;

    console.log('\n' + '='.repeat(60));
    console.log(`📊 修復完成`);
    console.log(`✅ 成功: ${fixedCount}`);
    console.log(`❌ 失敗: ${failedCount}`);
    console.log(`📝 需手動: ${report.leaks.length - fixedCount - failedCount}`);
    console.log('='.repeat(60));
  }

  public generateManualFixGuide(leaks: ErrorLeak[]): string {
    let guide = '# 錯誤處理手動修復指南\n\n';
    guide += `生成時間: ${new Date().toISOString()}\n\n`;
    
    const manualLeaks = leaks.filter(l => !l.autoFixable);
    
    if (manualLeaks.length === 0) {
      guide += '✅ 所有錯誤洩漏都可以自動修復\n';
      return guide;
    }

    guide += '## 需要手動修復的錯誤洩漏\n\n';
    
    for (const leak of manualLeaks) {
      guide += `### ${leak.file}:${leak.line}\n`;
      guide += `- 模式: ${leak.pattern}\n`;
      guide += `- 嚴重性: ${leak.severity}\n`;
      guide += `- 當前代碼: \`${leak.context}\`\n`;
      guide += `- 修復建議: \n`;
      
      switch (leak.pattern) {
        case 'error_message':
        case 'err_message':
          guide += `  替換 \`${leak.pattern}\` 為 \`'${this.genericErrorMessage}'\`\n`;
          break;
        case 'error_instance':
        case 'err_instance':
          guide += `  移除類型檢查，直接使用通用錯誤處理\n`;
          break;
      }
      
      guide += '\n';
    }

    guide += '## 通用修復模式\n\n';
    guide += '```typescript\n';
    guide += '// ❌ 錯誤做法\n';
    guide += 'catch (error) {\n';
    guide += '  return jsonError(\'INTERNAL_ERROR\', error.message); // 洩漏錯誤訊息\n';
    guide += '}\n\n';
    guide += '// ✅ 正確做法\n';
    guide += 'catch (error) {\n';
    guide += '  return jsonError(\'INTERNAL_ERROR\', \'Internal server error\'); // 通用錯誤訊息\n';
    guide += '}\n';
    guide += '```\n';

    return guide;
  }
}

// 主程序
if (require.main === module) {
  const fixer = new ErrorHandlingFixer();
  
  try {
    const leaks = fixer.analyzeErrorLeaks();
    const report = fixer.generateReport(leaks);
    
    fixer.printReport(report);
    fixer.saveReport(report);
    
    // 生成手動修復指南
    const manualGuide = fixer.generateManualFixGuide(leaks);
    const guidePath = '.devin/error-handling-manual-fix.md';
    fs.writeFileSync(guidePath, manualGuide);
    console.log(`📄 手動修復指南已保存到: ${guidePath}`);
    
    // 檢查是否執行修復
    const shouldFix = process.argv.includes('--fix');
    if (shouldFix) {
      fixer.fixAllLeaks(report);
      // 保存更新後的報告
      fixer.saveReport(report);
    } else {
      console.log('\n💡 使用 --fix 參數執行自動修復');
    }
    
    // 根據結果設置退出碼
    if (report.totalLeaks > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error handling fix failed:', error);
    process.exit(1);
  }
}

export { ErrorHandlingFixer, ErrorLeak, ErrorHandlingReport };