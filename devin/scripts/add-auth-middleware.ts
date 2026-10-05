#!/usr/bin/env ts-node
/**
 * Auth Middleware Adder - 無作妙德認證中間件添加工具
 * 
 * 自動為缺少認證的 API 路由添加統一認證中間件
 */

import * as fs from 'fs';
import * as path from 'path';

interface RouteInfo {
  file: string;
  methods: string[];
  currentAuth: string;
  needsAuth: boolean;
  recommendedConfig: string;
}

class AuthMiddlewareAdder {
  private targetRoutes: RouteInfo[] = [
    {
      file: 'app/api/cron/route.ts',
      methods: ['POST'],
      currentAuth: 'none',
      needsAuth: true,
      recommendedConfig: 'system'
    },
    {
      file: 'app/api/memory/route.ts',
      methods: ['POST'],
      currentAuth: 'none',
      needsAuth: true,
      recommendedConfig: 'system'
    },
    {
      file: 'app/api/rag/ingest/route.ts',
      methods: ['POST'],
      currentAuth: 'none',
      needsAuth: true,
      recommendedConfig: 'user'
    },
    {
      file: 'app/api/sonnar/crawl/route.ts',
      methods: ['POST'],
      currentAuth: 'none',
      needsAuth: true,
      recommendedConfig: 'user'
    }
  ];

  private authImport = `import { UnifiedAuth, AUTH_CONFIGS, authErrorResponse } from '@/lib/unified-auth';`;
  
  private authWrapper = (config: string) => `
// 認證中間件
const authHandler = UnifiedAuth.withAuth(async (request, auth) => {
  // 認證通過，繼續處理請求
  return originalHandler(request, auth);
}, AUTH_CONFIGS.${config});

const originalHandler = async (request: NextRequest`;

  public analyzeRoutes(): void {
    console.log('🔍 分析需要添加認證的路由...\n');

    for (const route of this.targetRoutes) {
      const filePath = path.resolve(route.file);
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  文件不存在: ${route.file}`);
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      
      // 檢查現有認證
      const hasAuthCheck = content.includes('authenticate') || 
                         content.includes('auth') ||
                         content.includes('verifyIdToken') ||
                         content.includes('X-Omni-Token');
      
      route.currentAuth = hasAuthCheck ? 'partial' : 'none';
      
      console.log(`📋 ${route.file}`);
      console.log(`   方法: ${route.methods.join(', ')}`);
      console.log(`   當前認證: ${route.currentAuth}`);
      console.log(`   需要認證: ${route.needsAuth ? '是' : '否'}`);
      console.log(`   推薦配置: ${route.recommendedConfig}`);
      console.log();
    }
  }

  public addAuthMiddleware(route: RouteInfo): boolean {
    const filePath = path.resolve(route.file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 檢查是否已經有統一認證
    if (content.includes('UnifiedAuth')) {
      console.log(`✅ ${route.file} 已經使用統一認證`);
      return true;
    }

    console.log(`🔧 為 ${route.file} 添加認證中間件...`);

    // 添加 import
    let updatedContent = content;
    if (!content.includes('unified-auth')) {
      const lastImport = content.lastIndexOf('import');
      const importEnd = content.indexOf('\n', lastImport);
      updatedContent = content.slice(0, importEnd + 1) + 
                       this.authImport + '\n' + 
                       content.slice(importEnd + 1);
    }

    // 添加認證包裝
    const config = route.recommendedConfig;
    const wrapper = this.authWrapper(config);
    
    // 找到主要的 export async function
    const exportMatch = updatedContent.match(/export async function (POST|GET|PUT|DELETE)\(/);
    if (!exportMatch) {
      console.log(`❌ 無法找到導出函數: ${route.file}`);
      return false;
    }

    const exportIndex = exportMatch.index || 0;
    const exportStart = updatedContent.indexOf('export async function', exportIndex);
    
    // 包裝原有函數
    const functionStart = exportStart;
    const functionEnd = updatedContent.indexOf('}', updatedContent.lastIndexOf('}'));
    
    const originalFunction = updatedContent.slice(functionStart, functionEnd + 1);
    const wrappedFunction = wrapper + originalFunction.slice('async (request: NextRequest'.length);

    // 替換原函數
    updatedContent = updatedContent.slice(0, functionStart) + 
                     wrappedFunction + 
                     updatedContent.slice(functionEnd + 1);

    // 保存更新後的文件
    fs.writeFileSync(filePath, updatedContent);
    console.log(`✅ 成功為 ${route.file} 添加認證中間件`);
    
    return true;
  }

  public addAuthToAllRoutes(): void {
    console.log('🚀 為所有目標路由添加認證中間件...\n');

    let successCount = 0;
    let failCount = 0;

    for (const route of this.targetRoutes) {
      if (route.needsAuth) {
        const success = this.addAuthMiddleware(route);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 認證中間件添加完成`);
    console.log(`✅ 成功: ${successCount}`);
    console.log(`❌ 失敗: ${failCount}`);
    console.log('='.repeat(60));
  }

  public generateReport(): string {
    let report = '# 認證中間件添加報告\n\n';
    report += `生成時間: ${new Date().toISOString()}\n\n`;
    
    report += '## 目標路由\n\n';
    for (const route of this.targetRoutes) {
      report += `### ${route.file}\n`;
      report += `- 方法: ${route.methods.join(', ')}\n`;
      report += `- 當前認證: ${route.currentAuth}\n`;
      report += `- 需要認證: ${route.needsAuth ? '是' : '否'}\n`;
      report += `- 推薦配置: ${route.recommendedConfig}\n`;
      report += '\n';
    }

    report += '## 推薦配置說明\n\n';
    report += '- **system**: 系統服務認證，使用內部令牌\n';
    report += '- **user**: 用戶認證，需要 Firebase ID Token\n';
    report += '- **admin**: 管理員認證，需要管理員權限\n';
    report += '- **public**: 公開訪問，無需認證\n';

    return report;
  }
}

// 主程序
if (require.main === module) {
  const adder = new AuthMiddlewareAdder();
  
  try {
    // 分析路由
    adder.analyzeRoutes();
    
    // 生成報告
    const report = adder.generateReport();
    const reportPath = '.devin/auth-middleware-report.md';
    fs.writeFileSync(reportPath, report);
    console.log(`📄 報告已保存到: ${reportPath}`);
    
    // 檢查是否執行添加
    const shouldAdd = process.argv.includes('--add');
    if (shouldAdd) {
      adder.addAuthToAllRoutes();
    } else {
      console.log('\n💡 使用 --add 參數執行認證中間件添加');
    }
  } catch (error) {
    console.error('Auth middleware addition failed:', error);
    process.exit(1);
  }
}

export { AuthMiddlewareAdder, RouteInfo };