/**
 * 知識圖譜 — Indexing Pipeline
 * 由暗翼/光翼陣列 (13-18/43-48) 主導
 * 用法: node scripts/knowledge-graph/index.mjs [directory]
 * 輸出: embeddings.json（code chunks → vectors）
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const EMBED_MODEL = process.env.EMBED_MODEL || 'nomic-embed-text';
const TARGET_DIR = process.argv[2] || 'src';
const CHUNK_SIZE = 500;

function walkDir(dir, exts = ['.ts', '.js', '.md']) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      files.push(...walkDir(full, exts));
    } else if (entry.isFile() && exts.includes(extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

function chunkText(text, size = CHUNK_SIZE) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

async function embed(text) {
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text }),
  });
  const data = await res.json();
  return data.embedding;
}

async function main() {
  const files = walkDir(TARGET_DIR);
  console.log(`📂 掃描 ${files.length} 個檔案...`);

  const embeddings = [];
  let count = 0;

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const chunks = chunkText(content);

    for (let i = 0; i < chunks.length; i++) {
      try {
        const vector = await embed(chunks[i]);
        embeddings.push({
          file_path: file,
          chunk_index: i,
          chunk_text: chunks[i].slice(0, 200),
          embedding: vector,
        });
        count++;
        if (count % 10 === 0) console.log(`  已處理 ${count} chunks...`);
      } catch (err) {
        console.warn(`⚠️ ${file} chunk ${i} 嵌入失敗: ${err.message}`);
      }
    }
  }

  writeFileSync('embeddings.json', JSON.stringify(embeddings, null, 2));
  console.log(`✅ 已生成 ${embeddings.length} 個 embeddings → embeddings.json`);

main();
