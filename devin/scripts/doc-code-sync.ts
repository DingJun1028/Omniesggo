#!/usr/bin/env ts-node
/**
 * Doc-Code Sync - 無作妙德文檔代碼同步工具
 * 
 * 自動生成和同步 JSDoc 文檔，確保文檔與代碼一致性
 * 建立深冠知識體系
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface DocCodeSync {
  file: string;
  hasDoc: boolean;
  docQuality: 'excellent' | 'good' | 'poor' | 'missing';
  issues: string[];
  suggestions: string[];
}

interface SyncReport {
  timestamp: string;
  totalFiles: number;
  documentedFiles: number;
  syncPercentage: number;
  issues: DocCodeSync[];
  summary: {
    byQuality: Record<string, number>;
    totalIssues: number;
  };
}

class DocCodeSync {
  private targetFiles: string[] = [
    'src/lib/zkp-service.ts',
    'src/lib/five-t-protocol.ts',
    'src/lib/omni-tag.ts',
    'src/lib/unified-auth.ts',
    'src/core/omni-core.ts',
    'src/core/services/report-generator-v5.ts',
    'src/core/services/async-task-manager.ts',
    'src/components/AgnesProvider.tsx',
    'src/components/AuthProvider.tsx',
    'src/components/omni-todo-panel.tsx'
  ];

  public analyzeDocCodeSync(): DocCodeSync[] {
    const syncs: DocCodeSync[] = [];
    
    console.log('🔍 分析文檔代碼同步狀態...\n');

    for (const file of this.targetFiles) {
      const filePath = path.resolve(file);
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  文件不存在: ${file}`);
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const sync = this.analyzeFileDoc(file, content);
      syncs.push(sync);
    }

    return syncs;
  }

  private analyzeFileDoc(file: string, content: string): DocCodeSync {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // 檢查 JSDoc 註解
    const hasFileDoc = content.includes('/**');
    const hasFunctionDocs = (content.match(/\/\*\*/g) || []).length;
    
    // 檢查導出函數/類別
    const exports = (content.match(/export (function|class|const|interface|type)/g) || []).length;
    
    // 檢查註解質量
    const docQuality = this.assessDocQuality(content, hasFileDoc, hasFunctionDocs, exports);
    
    // 生成問題和建議
    if (!hasFileDoc) {
      issues.push('缺少文件級 JSDoc 註解');
      suggestions.push('添加文件級 JSDoc 註解，描述模組用途');
    }
    
    if (hasFunctionDocs < exports) {
      issues.push(`${exports - hasFunctionDocs} 個導出缺少 JSDoc 註解`);
      suggestions.push('為所有公共導出添加 JSDoc 註解');
    }
    
    // 檢查參數文檔
    if (!content.includes('@param') && exports > 0) {
      issues.push('缺少參數文檔 (@param)');
      suggestions.push('為函數參數添加 @param 標記');
    }
    
    // 檢查返回值文檔
    if (!content.includes('@return') && !content.includes('@returns') && content.includes('function')) {
      issues.push('缺少返回值文檔 (@return/@returns)');
      suggestions.push('為函數返回值添加 @return/@returns 標記');
    }
    
    // 檢查類型文檔
    if (!content.includes('@type') && content.includes('interface')) {
      issues.push('缺少類型文檔 (@type)');
      suggestions.push('為接口屬性添加 @type 標記');
    }
    
    // 檢查示例文檔
    if (!content.includes('@example') && exports > 0) {
      suggestions.push('考慮添加使用示例 (@example)');
    }

    return {
      file,
      hasDoc: hasFileDoc,
      docQuality,
      issues,
      suggestions
    };
  }

  private assessDocQuality(
    content: string,
    hasFileDoc: boolean,
    hasFunctionDocs: number,
    exports: number
  ): 'excellent' | 'good' | 'poor' | 'missing' {
    if (!hasFileDoc && hasFunctionDocs === 0) {
      return 'missing';
    }
    
    if (!hasFileDoc) {
      return 'poor';
    }
    
    const docCoverage = exports > 0 ? hasFunctionDocs / exports : 1;
    
    if (docCoverage >= 0.8 && content.includes('@example')) {
      return 'excellent';
    }
    
    if (docCoverage >= 0.5) {
      return 'good';
    }
    
    return 'poor';
  }

  public generateReport(syncs: DocCodeSync[]): SyncReport {
    const summary = {
      byQuality: {
        excellent: 0,
        good: 0,
        poor: 0,
        missing: 0
      },
      totalIssues: 0
    };

    for (const sync of syncs) {
      summary.byQuality[sync.docQuality]++;
      summary.totalIssues += sync.issues.length;
    }

    const documentedFiles = syncs.filter(s => s.hasDoc).length;
    const syncPercentage = syncs.length > 0 ? (documentedFiles / syncs.length) * 100 : 0;

    return {
      timestamp: new Date().toISOString(),
      totalFiles: syncs.length,
      documentedFiles,
      syncPercentage,
      issues: syncs,
      summary
    };
  }

  public printReport(report: SyncReport): void {
    console.log('\n' + '='.repeat(60));
    console.log('📚 文檔代碼同步報告');
    console.log('='.repeat(60));
    console.log(`📅 時間: ${report.timestamp}`);
    console.log(`📁 總計文件: ${report.totalFiles}`);
    console.log(`📝 已文檔化: ${report.documentedFiles}`);
    console.log(`📊 同步率: ${report.syncPercentage.toFixed(1)}%`);
    console.log(`⚠️  總問題: ${report.summary.totalIssues}`);
    
    console.log('\n📊 文檔質量分布:');
    console.log('-'.repeat(60));
    for (const [quality, count] of Object.entries(report.summary.byQuality)) {
      const icon = quality === 'excellent' ? '✅' : 
                  quality === 'good' ? '🟢' : 
                  quality === 'poor' ? '🟡' : '🔴';
      console.log(`${icon} ${quality}: ${count}`);
    }

    console.log('\n📋 詳細同步狀態:');
    console.log('-'.repeat(60));
    for (const sync of report.issues) {
      const qualityIcon = sync.docQuality === 'excellent' ? '✅' : 
                          sync.docQuality === 'good' ? '🟢' : 
                          sync.docQuality === 'poor' ? '🟡' : '🔴';
      
      console.log(`${qualityIcon} ${sync.file}`);
      console.log(`   質量: ${sync.docQuality}`);
      console.log(`   問題數: ${sync.issues.length}`);
      
      if (sync.issues.length > 0) {
        console.log('   問題:');
        for (const issue of sync.issues) {
          console.log(`     - ${issue}`);
        }
      }
      
      if (sync.suggestions.length > 0) {
        console.log('   建議:');
        for (const suggestion of sync.suggestions) {
          console.log(`     - ${suggestion}`);
        }
      }
      
      console.log();
    }

    console.log('\n' + '='.repeat(60));
  }

  public saveReport(report: SyncReport, outputPath: string = '.devin/doc-code-sync-report.json'): void {
    const reportPath = path.resolve(outputPath);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 報告已保存到: ${reportPath}`);
  }

  public generateJSDoc(file: string): string {
    // 自動生成 JSDoc 註解
    const filePath = path.resolve(file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 解析文件結構
    const imports = this.parseImports(content);
    const exports = this.parseExports(content);
    const functions = this.parseFunctions(content);
    const classes = this.parseClasses(content);
    const interfaces = this.parseInterfaces(content);
    
    // 生成文件級文檔
    let jsdoc = '/**\n';
    jsdoc += ` * ${path.basename(file, '.ts')} - 自動生成文檔\n`;
    jsdoc += ' * \n';
    jsdoc += ' * @module\n';
    jsdoc += ' * @description\n';
    jsdoc += ' * TODO: 添加模組描述\n';
    jsdoc += ' */\n\n';
    
    // 為導出添加文檔
    for (const exp of exports) {
      jsdoc += this.generateExportDoc(exp);
    }
    
    return jsdoc;
  }

  private parseImports(content: string): string[] {
    const importRegex = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
    const imports: string[] = [];
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }

  private parseExports(content: string): string[] {
    const exportRegex = /export\s+(function|class|const|interface|type)\s+(\w+)/g;
    const exports: string[] = [];
    let match;
    
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[2]);
    }
    
    return exports;
  }

  private parseFunctions(content: string): string[] {
    const functionRegex = /function\s+(\w+)/g;
    const functions: string[] = [];
    let match;
    
    while ((match = functionRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }
    
    return functions;
  }

  private parseClasses(content: string): string[] {
    const classRegex = /class\s+(\w+)/g;
    const classes: string[] = [];
    let match;
    
    while ((match = classRegex.exec(content)) !== null) {
      classes.push(match[1]);
    }
    
    return classes;
  }

  private parseInterfaces(content: string): string[] {
    const interfaceRegex = /interface\s+(\w+)/g;
    const interfaces: string[] = [];
    let match;
    
    while ((match = interfaceRegex.exec(content)) !== null) {
      interfaces.push(match[1]);
    }
    
    return interfaces;
  }

  private generateExportDoc(exportName: string): string {
    return `/**\n * ${exportName} - TODO: 添加描述\n */\n`;
  }

  public addMissingDocs(report: SyncReport): void {
    console.log('\n🔧 為缺少文檔的文件添加 JSDoc...');

    let added = 0;
    let skipped = 0;

    for (const sync of report.issues) {
      if (sync.docQuality === 'missing' || sync.docQuality === 'poor') {
        try {
          const jsdoc = this.generateJSDoc(sync.file);
          const filePath = path.resolve(sync.file);
          const content = fs.readFileSync(filePath, 'utf-8');
          
          // 在文件開頭添加 JSDoc
          const updatedContent = jsdoc + content;
          fs.writeFileSync(filePath, updatedContent);
          
          console.log(`✅ 添加文檔: ${sync.file}`);
          added++;
        } catch (error) {
          console.log(`❌ 添加文檔失敗: ${sync.file}`);
          skipped++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 文檔添加完成`);
    console.log(`✅ 成功: ${added}`);
    console.log(`❌ 跳過: ${skipped}`);
    console.log('='.repeat(60));
  }

  public generateTypeDocTypes(): void {
    // 生成 TypeScript 類型定義文檔
    console.log('🔧 生成 TypeScript 類型定義文檔...');
    
    try {
      // 使用 TypeDoc 生成文檔
      const cmd = 'npx typedoc --out docs/api --excludePrivate --excludeProtected';
      execSync(cmd, { cwd: path.resolve('.') });
      console.log('✅ TypeDoc 文檔生成完成');
    } catch (error) {
      console.log('⚠️  TypeDoc 不可用，跳過自動生成');
    }
  }
}

// 主程序
if (require.main === module) {
  const syncer = new DocCodeSync();
  
  try {
    const syncs = syncer.analyzeDocCodeSync();
    const report = syncer.generateReport(syncs);
    
    syncer.printReport(report);
    syncer.saveReport(report);
    
    // 檢查是否執行文檔添加
    const shouldAddDocs = process.argv.includes('--add-docs');
    if (shouldAddDocs) {
      syncer.addMissingDocs(report);
    } else {
      console.log('\n💡 使用 --add-docs 參數執行文檔添加');
    }
    
    // 檢查是否生成 TypeDoc
    const shouldGenTypedoc = process.argv.includes('--typedoc');
    if (shouldGenTypedoc) {
      syncer.generateTypeDocTypes();
    }
    
    // 根據同步率設置退出碼
    if (report.syncPercentage < 80) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Doc-code sync failed:', error);
    process.exit(1);
  }
}

export { DocCodeSync, SyncReport, DocCodeSync as DocCodeSyncInterface };