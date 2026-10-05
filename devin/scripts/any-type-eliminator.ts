#!/usr/bin/env ts-node
/**
 * Any Type Eliminator - 無作妙德類型安全工具
 * 
 * 自動檢測和分析代碼中的 any 類型使用
 * 生成具體的類型定義替換建議
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface AnyUsage {
  file: string;
  line: number;
  column: number;
  pattern: string;
  context: string;
  suggestedType: string;
  priority: 'high' | 'medium' | 'low';
  autoFixable: boolean;
}

interface TypeSafetyReport {
  timestamp: string;
  totalAnyUsages: number;
  usages: AnyUsage[];
  summary: {
    byFile: Record<string, number>;
    byPattern: Record<string, number>;
    byPriority: Record<string, number>;
  };
  recommendations: string[];
}

class AnyTypeEliminator {
  private targetFiles: string[];
  private excludedPatterns: string[];

  constructor() {
    this.targetFiles = [
      'src/impl/core.ts',
      'src/lib/omni-core/omni-function.ts',
      'app/api/ai-notes/search/route.ts',
      'app/api/village/trends/route.ts',
      'app/api/agent/[id]/thought/stream/route.ts',
      'app/omni-center/omni-note-crud.tsx',
      'app/omni-agent/page.tsx',
      'packages/omni-agent/src/types.ts'
    ];
    
    this.excludedPatterns = [
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/__tests__/**',
      '**/node_modules/**'
    ];
  }

  private searchAnyUsages(): AnyUsage[] {
    const usages: AnyUsage[] = [];
    
    for (const file of this.targetFiles) {
      const filePath = path.resolve(file);
      if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const lineNum = index + 1;
        
        // 檢測各種 any 使用模式
        const patterns = [
          { regex: /: any/g, type: 'type_annotation', priority: 'high' },
          { regex: /as any/g, type: 'type_assertion', priority: 'high' },
          { regex: /<any>/g, type: 'generic_parameter', priority: 'high' },
          { regex: /any\[\]/g, type: 'array_type', priority: 'medium' }
        ];

        for (const pattern of patterns) {
          const matches = line.matchAll(pattern.regex);
          for (const match of matches) {
            if (match.index !== undefined) {
              usages.push({
                file,
                line: lineNum,
                column: match.index + 1,
                pattern: pattern.type,
                context: line.trim(),
                suggestedType: this.suggestType(file, pattern.type, line),
                priority: pattern.priority as 'high' | 'medium' | 'low',
                autoFixable: this.isAutoFixable(file, pattern.type)
              });
            }
          }
        }
      });
    }

    return usages;
  }

  private suggestType(file: string, pattern: string, context: string): string {
    // 根據文件和上下文建議具體類型
    const fileSuggestions: Record<string, Record<string, string>> = {
      'src/impl/core.ts': {
        'type_annotation': 'unknown | Record<string, unknown>',
        'type_assertion': 'as unknown',
        'generic_parameter': '<unknown>'
      },
      'src/lib/omni-core/omni-function.ts': {
        'type_annotation': 'FnImplementation',
        'type_assertion': 'as FnImplementation'
      },
      'app/api/ai-notes/search/route.ts': {
        'type_annotation': 'VectorSearchResult',
        'type_assertion': 'as VectorSearchResult'
      },
      'app/api/village/trends/route.ts': {
        'type_annotation': 'VillageInteraction',
        'type_assertion': 'as VillageInteraction'
      },
      'app/api/agent/[id]/thought/stream/route.ts': {
        'type_annotation': 'BusEvent',
        'type_assertion': 'as BusEvent'
      },
      'app/omni-center/omni-note-crud.tsx': {
        'type_annotation': 'NoteData',
        'type_assertion': 'as NoteData'
      },
      'app/omni-agent/page.tsx': {
        'type_annotation': 'AgentData',
        'type_assertion': 'as AgentData'
      },
      'packages/omni-agent/src/types.ts': {
        'type_annotation': 'AgentResult',
        'type_assertion': 'as AgentResult'
      }
    };

    return fileSuggestions[file]?.[pattern] || 'unknown';
  }

  private isAutoFixable(file: string, pattern: string): boolean {
    // 某些情況下可以自動修復
    const autoFixableCases = [
      'src/impl/core.ts',
      'src/lib/omni-core/omni-function.ts'
    ];
    
    return autoFixableCases.includes(file) && pattern === 'type_annotation';
  }

  private generateRecommendations(usages: AnyUsage[]): string[] {
    const recommendations: string[] = [];
    
    // 高優先級建議
    const highPriorityUsages = usages.filter(u => u.priority === 'high');
    if (highPriorityUsages.length > 0) {
      recommendations.push(`發現 ${highPriorityUsages.length} 個高優先級 any 使用，建議立即處理`);
    }

    // 可自動修復建議
    const autoFixableUsages = usages.filter(u => u.autoFixable);
    if (autoFixableUsages.length > 0) {
      recommendations.push(`${autoFixableUsages.length} 個 any 使用可以自動修復`);
    }

    // 核心模組建議
    const coreFileUsages = usages.filter(u => u.file.includes('src/impl/core.ts'));
    if (coreFileUsages.length > 0) {
      recommendations.push(`核心模組 src/impl/core.ts 有 ${coreFileUsages.length} 處 any 使用，優先處理`);
    }

    return recommendations;
  }

  public generateReport(): TypeSafetyReport {
    console.log('🔍 Analyzing any type usage...');

    const usages = this.searchAnyUsages();
    
    // 生成統計摘要
    const summary = {
      byFile: {} as Record<string, number>,
      byPattern: {} as Record<string, number>,
      byPriority: {} as Record<string, number>
    };

    for (const usage of usages) {
      summary.byFile[usage.file] = (summary.byFile[usage.file] || 0) + 1;
      summary.byPattern[usage.pattern] = (summary.byPattern[usage.pattern] || 0) + 1;
      summary.byPriority[usage.priority] = (summary.byPriority[usage.priority] || 0) + 1;
    }

    const report: TypeSafetyReport = {
      timestamp: new Date().toISOString(),
      totalAnyUsages: usages.length,
      usages,
      summary,
      recommendations: this.generateRecommendations(usages)
    };

    return report;
  }

  public printReport(report: TypeSafetyReport): void {
    console.log('\n' + '='.repeat(60));
    console.log('🛡️ 類型安全檢查報告 - Any 類型分析');
    console.log('='.repeat(60));
    console.log(`📅 時間: ${report.timestamp}`);
    console.log(`🔢 總計 any 使用: ${report.totalAnyUsages}`);
    
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
    
    console.log('\n按優先級統計:');
    for (const [priority, count] of Object.entries(report.summary.byPriority)) {
      console.log(`  ${priority}: ${count} 處`);
    }

    console.log('\n📋 詳細使用情況:');
    console.log('-'.repeat(60));
    for (const usage of report.usages) {
      const priorityIcon = usage.priority === 'high' ? '🔴' : 
                          usage.priority === 'medium' ? '🟡' : '🟢';
      const autoFixIcon = usage.autoFixable ? '🔧' : '📝';
      
      console.log(`${priorityIcon} ${autoFixIcon} ${usage.file}:${usage.line}`);
      console.log(`   模式: ${usage.pattern}`);
      console.log(`   建議類型: ${usage.suggestedType}`);
      console.log(`   上下文: ${usage.context.substring(0, 80)}...`);
      console.log();
    }

    if (report.recommendations.length > 0) {
      console.log('💡 建議:');
      console.log('-'.repeat(60));
      for (const recommendation of report.recommendations) {
        console.log(`📌 ${recommendation}`);
      }
    }

    console.log('\n' + '='.repeat(60));
  }

  public saveReport(report: TypeSafetyReport, outputPath: string = '.devin/type-safety-report.json'): void {
    const reportPath = path.resolve(outputPath);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 報告已保存到: ${reportPath}`);
  }

  public autoFix(report: TypeSafetyReport): void {
    const autoFixableUsages = report.usages.filter(u => u.autoFixable);
    
    if (autoFixableUsages.length === 0) {
      console.log('沒有可自動修復的 any 使用');
      return;
    }

    console.log(`\n🔧 自動修復 ${autoFixableUsages.length} 個 any 使用...`);

    for (const usage of autoFixableUsages) {
      const filePath = path.resolve(usage.file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      const lineIndex = usage.line - 1;
      const oldLine = lines[lineIndex];
      const newLine = oldLine.replace(/: any/g, `: ${usage.suggestedType}`);
      
      lines[lineIndex] = newLine;
      
      fs.writeFileSync(filePath, lines.join('\n'));
      console.log(`✅ 修復: ${usage.file}:${usage.line}`);
    }

    console.log('自動修復完成');
  }
}

// 主程序
if (require.main === module) {
  const eliminator = new AnyTypeEliminator();
  
  try {
    const report = eliminator.generateReport();
    eliminator.printReport(report);
    eliminator.saveReport(report);
    
    // 檢查是否需要自動修復
    const autoFixArg = process.argv.includes('--auto-fix');
    if (autoFixArg) {
      eliminator.autoFix(report);
    }
    
    // 根據結果設置退出碼
    if (report.totalAnyUsages > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Type safety analysis failed:', error);
    process.exit(1);
  }
}

export { AnyTypeEliminator, TypeSafetyReport, AnyUsage };