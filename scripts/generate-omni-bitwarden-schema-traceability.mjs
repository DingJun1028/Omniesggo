#!/usr/bin/env node
/**
 * OmniBitwarden Schema Traceability Generator
 * 整合 OMN-PRD-001 追蹤矩陣
 * 掃描 .agents/skills/omni-bitwarden/ 目錄中的 TypeBox schema
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const SKILL_DIR = join(process.cwd(), '.agents', 'skills', 'omni-bitwarden');
const OUTPUT_FILE = join(process.cwd(), '.agents', 'skills', 'omni-bitwarden', 'OMN-PRD-001-OMNI-BITWARDEN-TRACEABILITY.md');

const SCHEMA_REQUIREMENT_MAP = {
  'SecretConfig': 'FR-001',
  'VaultConfig': 'FR-001',
  'AuthConfig': 'FR-001',
  'ScopesConfig': 'FR-001',
  'SecurityConfig': 'SEC-001',
  'IntegrationSchema': 'INT-001',
  'OmniBitwardenConfig': 'FR-001',
};

function scanFiles(dir, fileList = [], path = '') {
  const entries = readdirSync(join(dir, path));
  for (const entry of entries) {
    const fullPath = join(dir, path, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      scanFiles(dir, fileList, join(path, entry));
    } else if (stat.isFile() && fullPath.endsWith('.ts')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function extractTypeBoxSchemas(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const schemas = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('export const') && line.includes('Type.')) {
      const match = line.match(/export const (\w+)Schema\s*=/);
      if (match) {
        const schemaName = match[1];
        const $id = line.includes('$id') ? '有' : '無';
        const descMatch = line.match(/description:\s*'([^']+)'/);
        const description = descMatch ? descMatch[1] : '無';
        
        // 判斷類型
        let typeboxUsage = 'Other';
        if (line.includes('Type.Object') || line.startsWith('Type.Object')) typeboxUsage = 'Object';
        else if (line.includes('Type.Array') || line.startsWith('Type.Array')) typeboxUsage = 'Array';
        else if (line.includes('Type.String') || line.startsWith('Type.String')) typeboxUsage = 'String';
        else if (line.includes('Type.Number') || line.startsWith('Type.Number')) typeboxUsage = 'Number';
        else if (line.includes('Type.Boolean') || line.startsWith('Type.Boolean')) typeboxUsage = 'Boolean';
        else if (line.includes('Type.Union') || line.startsWith('Type.Union')) typeboxUsage = 'Union';
        else if (line.includes('Type.Optional') || line.startsWith('Type.Optional')) typeboxUsage = 'Optional';

        schemas.push({
          file: filePath.replace(process.cwd(), '.'),
          schemaName,
          $id,
          description,
          line: i + 1,
          typeboxUsage
        });
      }
    }
  }
  return schemas;
}

function generateReport() {
  const schemaFiles = scanFiles(SKILL_DIR);
  let allSchemas = [];
  
  for (const file of schemaFiles) {
    const schemas = extractTypeBoxSchemas(file);
    for (const schema of schemas) {
      allSchemas.push({
        ...schema,
        prdId: SCHEMA_REQUIREMENT_MAP[schema.schemaName] || 'N/A'
      });
    }
  }

  allSchemas.sort((a, b) => a.schemaName.localeCompare(b.schemaName));

  const linked = allSchemas.filter(s => s.prdId !== 'N/A').length;
  const unlinked = allSchemas.filter(s => s.prdId === 'N/A').length;

  const lines = [
    '# OmniBitwarden Schema Traceability 矩陣',
    '',
    '> 整合 OMN-PRD-001 追蹤矩陣 | 生成時間：2026-11-02 | 版本：2.0.0',
    '',
    '## 1. 概覽',
    '',
    '| 項目 | 數值 |',
    '|---|---|',
    `| 掃描檔案數 | ${schemaFiles.length} |`,
    `| Schema 定義數 | ${allSchemas.length} |`,
    `| 已掛需求編號 | ${linked} |`,
    `| 未掛需求編號 | ${unlinked} |`,
    '',
    '## 2. 詳細表格',
    '',
    '| 檔案 | Schema 名稱 | 類型 | $id | 描述 | 需求編號 |',
    '|---|---|---|---|---|---|',
  ];

  for (const schema of allSchemas) {
    lines.push(`| ${schema.file} | ${schema.schemaName} | ${schema.typeboxUsage} | ${schema.$id} | ${schema.description} | ${schema.prdId} |`);
  }

  lines.push('');
  lines.push('## 3. 需求對應表');
  lines.push('');
  lines.push('| 需求編號 | 描述 | 影響的 Schema |');
  lines.push('|---|---|---|');
  lines.push('| FR-001 | 金鑰存取與管理 | SecretConfig, VaultConfig, AuthConfig, ScopesConfig, OmniBitwardenConfig |');
  lines.push('| SEC-001 | 安全原則與遮蔽 | SecurityConfig |');
  lines.push('| INT-001 | Bitwarden 整合規範 | IntegrationSchema |');
  lines.push('');
  lines.push('## 4. 待確認事項');
  lines.push('');
  lines.push('- [ ] 部分 schema 未掛需求編號，建議後續補標');
  lines.push('- [ ] 若需同時使用多個 scope，需確認 ScopesConfig 的擴展性');
  lines.push('');

  return lines.join('\n');
}

const report = generateReport();
console.log(report);

const fs = await import('fs');
const outputPath = join(process.cwd(), '.agents', 'skills', 'omni-bitwarden', 'OMN-PRD-001-OMNI-BITWARDEN-TRACEABILITY.md');
fs.writeFileSync(outputPath, report, 'utf-8');
console.log(`\n✅ 已寫入: ${outputPath}`);
