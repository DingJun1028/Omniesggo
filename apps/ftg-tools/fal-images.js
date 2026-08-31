#!/usr/bin/env node
/**
 * fal-images.js — FAL 圖像 API 客戶端 (路徑 C: API 運用)
 * 依主題透過 FAL REST API 生成 FTG 網頁圖像；
 * 無 FAL_KEY 或呼叫失敗時，優雅回退本地 assets (不中斷生產)。
 *
 * 用法 (在 ftg-gen.js 內呼叫):
 *   const { generateForTheme } = require('./fal-images');
 *   const r = await generateForTheme(theme, outAssetsDir, localAssetsDir);
 *   // r = { source: 'fal-api' } | { source: 'local-fallback', reason: '...' }
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const MODEL = process.env.FAL_MODEL || 'fal-ai/flux/dev';

function falKey() {
  return process.env.FAL_KEY || process.env.FAL_API_KEY || '';
}

function callFal(prompt, opts) {
  return new Promise((resolve, reject) => {
    const key = falKey();
    if (!key) return reject(new Error('FAL_KEY 未設定'));
    const body = JSON.stringify({
      prompt,
      image_size: (opts && opts.size) || 'landscape',
      num_images: 1,
    });
    const req = https.request(
      {
        hostname: 'fal.run',
        path: '/' + MODEL,
        method: 'POST',
        headers: {
          Authorization: 'Key ' + key,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 120000,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const url =
              json && json.images && json.images[0] && json.images[0].url;
            if (url) resolve(url);
            else reject(new Error('FAL 回傳無圖: ' + data.slice(0, 200)));
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('timeout', () => req.destroy(new Error('FAL 請求逾時')));
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error('下載失敗 HTTP ' + res.statusCode));
      }
      const ws = fs.createWriteStream(dest);
      res.pipe(ws);
      ws.on('finish', () => ws.close(() => resolve(dest)));
    });
    req.on('error', reject);
  });
}

function copyLocal(localDir, outDir) {
  const names = ['hero', 'stay', 'eco', 'craft', 'market', 'restore'];
  for (const n of names) {
    const src = path.join(localDir, n + '.jpg');
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(outDir, n + '.jpg'));
  }
}

const PROMPTS = {
  hero: 'Terraced rice paddies at dawn, misty mountains, sustainable rural tourism, cinematic photography, warm natural light',
  stay: 'Eco homestay made of wood and stone, traditional craft, cozy interior, natural light, documentary photography',
  eco: 'Volunteers planting trees in a riverbank restoration, green ecology, hopeful atmosphere, outdoor photography',
  craft: 'Local artisan hands weaving bamboo craft, traditional skill, detailed close-up, warm tone photography',
  market: 'Rural farmers market with local produce, community gathering, vibrant yet calm, street photography',
  restore: 'Wetland and forest restoration landscape, biodiversity, serene nature, wide-angle photography',
};

/**
 * 依主題生成網頁圖像。
 * @param {string} theme 主題名 (僅用於日誌)
 * @param {string} outDir 輸出 assets 目錄 (會寫入 *.jpg)
 * @param {string} localAssetsDir 本地回退圖源目錄
 * @returns {Promise<{source:string, reason?:string}>}
 */
async function generateForTheme(theme, outDir, localAssetsDir) {
  const key = falKey();
  if (!key) {
    copyLocal(localAssetsDir, outDir);
    return { source: 'local-fallback', reason: 'no FAL_KEY' };
  }
  try {
    const names = Object.keys(PROMPTS);
    for (const n of names) {
      const url = await callFal(PROMPTS[n]);
      await download(url, path.join(outDir, n + '.jpg'));
    }
    return { source: 'fal-api' };
  } catch (e) {
    copyLocal(localAssetsDir, outDir);
    return { source: 'local-fallback', reason: String((e && e.message) || e) };
  }
}

module.exports = { generateForTheme, callFal, falKey };
