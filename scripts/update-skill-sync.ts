#!/usr/bin/env node
/**
 * update-skill-sync.ts — 自動記錄技能文件變動到 Supabase skill_sync 表
 *
 * 用法：
 *   npx tsx scripts/update-skill-sync.ts
 *
 * 功能：
 *   1. 掃描 .agents/skills/*/SKILL.md
 *   2. 提取版本、類別、描述等信息
 *   3. 更新 Supabase skill_sync 表
 *   4. 支援手動觸發與定時任務
 *
 * 依賴：
 *   - supabase-js (v2)
 *   - dotenv
 *
 * 配置：
 *   環境變數：
 *     SUPABASE_URL
 *     SUPABASE_SERVICE_ROLE_KEY
 *     SKILL_SYNC_TABLE=skill_sync (默認)
 */

import { createClient } from '@supabase/supabase-js';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

// 加載 .env
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SKILL_SYNC_TABLE = process.env.SKILL_SYNC_TABLE || 'skill_sync';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 缺少 Supabase 配置：SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
  console.error('   請設定環境變數或 .env 文件');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  schema: 'public',
});

// 掃描技能文件
function scanSkills(baseDir: string): Array<{
  skill_name: string;
  skill_path: string;
  version: string;
  category: string;
  description: string;
  title: string;
  file_path: string;
}> {
  const records: Array<{
    skill_name: string;
    skill_path: string;
    version: string;
    category: string;
    description: string;
    title: string;
    file_path: string;
  }> = [];

  if (!existsSync(baseDir)) {
    console.warn(`⚠️  技能目錄不存在: ${baseDir}`);
    return records;
  }

  const entries = readdirSync(baseDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillDir = join(baseDir, entry.name);
    const skillMdPath = join(skillDir, 'SKILL.md');

    if (!existsSync(skillMdPath)) continue;

    let content: string;
    try {
      content = readFileSync(skillMdPath, 'utf-8');
    } catch {
      continue;
    }

    // 提取 frontmatter
    const fmMatch = content.match(/^---\s*
(.*?)
---\s*
/s);
    if (!fmMatch) continue;

    const fm = fmMatch[1];
    const getField = (key: string): string => {
      const match = fm.match(new RegExp(`${key}:\s*(.+)`));
      return match?.[1]?.trim().replace(/^["']|["']$/g, '') || '';
    };

    const record = {
      skill_name: entry.name,
      skill_path: `agents/skills/${entry.name}/SKILL.md`,
      version: getField('version'),
      category: getField('category'),
      description: getField('description'),
      title: getField('title'),
      file_path: skillMdPath,
    };

    records.push(record);
  }

  return records;
}

// 同步技能記錄到 Supabase
async function syncSkillRecords(records: Array<{
  skill_name: string;
  skill_path: string;
  version: string;
  category: string;
  description: string;
  title: string;
  file_path: string;
}>) {
  if (records.length === 0) {
    console.log('ℹ️  沒有技能文件需要同步');
    return;
  }

  console.log(`📊 扫描到 ${records.length} 個技能文件`);

  // 1. 更新已存在的記錄
  for (const record of records) {
    const { error } = await supabase
      .from(SKILL_SYNC_TABLE)
      .update({
        skill_name: record.skill_name,
        skill_path: record.skill_path,
        version: record.version || null,
        category: record.category || null,
        description: record.description || null,
        title: record.title || null,
        sync_status: 'syncing',
        last_synced_at: new Date().toISOString(),
      })
      .eq('skill_name', record.skill_name)
      .eq('skill_path', record.skill_path);

    if (error) {
      console.error(`❌ 更新 ${record.skill_name} 失敗: ${error.message}`);
    } else {
      console.log(`  ✅ 更新 ${record.skill_name} (v${record.version})`);
    }
  }

  // 2. 插入新的記錄
  const inserted = [];
  for (const record of records) {
    const { data, error } = await supabase
      .from(SKILL_SYNC_TABLE)
      .insert({
        skill_name: record.skill_name,
        skill_path: record.skill_path,
        version: record.version || null,
        category: record.category || null,
        description: record.description || null,
        title: record.title || null,
        sync_status: 'synced',
        last_synced_at: new Date().toISOString(),
      })
      .select()
      .eq('skill_name', record.skill_name)
      .eq('skill_path', record.skill_path)
      .single();

    if (error) {
      if (error.code === '23505') {
        // 不存在衝突（唯一約束），跳過
        inserted.push(record);
      } else {
        console.error(`❌ 插入 ${record.skill_name} 失敗: ${error.message}`);
      }
    } else {
      inserted.push(data);
    }
  }

  console.log(`
📈 同步完成：${inserted.length} 個技能已同步`);
}

const SKILL_SYNC_TABLE = process.env.SKILL_SYNC_TABLE || 'skill_sync';
const BASE_DIR = process.env.SKILLS_BASE_DIR || join(__dirname, '..', 'agents', 'skills');

async function main() {
  console.log('🚀 開始同步技能記錄到 Supabase...');
  console.log(`📋 技能目錄: ${BASE_DIR}`);
  console.log(`📋 表名: ${SKILL_SYNC_TABLE}`);
  console.log('---');

  const records = scanSkills(BASE_DIR);
  await syncSkillRecords(records);

  console.log('---');
  console.log('✅ 同步任務完成');
}

main().catch((error) => {
  console.error('💥 任務失敗:', error);
  process.exit(1);
});
