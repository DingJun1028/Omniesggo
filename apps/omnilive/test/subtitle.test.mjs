// OmniLive 字幕模型 / 翻譯 / 錯誤 單元測試 (node --test)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildSubtitle, SubtitleStore } from '../lib/subtitle.mjs';
import { translate, hashOf } from '../lib/translate.mjs';
import { toOmniLiveError } from '../lib/errors.mjs';
import { assertSource, describeSource, AUDIO_SOURCES } from '../lib/audio-source.mjs';
import { vadSegments, vadSegmentsAny } from '../lib/stt.mjs';

test('VAD 語者分段: 含靜音間隔 → 輪流標 A/B', () => {
  // 合成 16-bit PCM WAV: 0.4s 語音(A) + 0.9s 靜音 + 0.4s 語音(B)
  const sr = 16000, dur = 1.7;
  const total = Math.floor(sr * dur);
  const samples = new Int16Array(total);
  const tone = (i) => Math.sin(i / 20) * 8000;
  for (let i = 0; i < total; i++) {
    const t = i / sr;
    if (t < 0.4) samples[i] = tone(i);
    else if (t > 1.3) samples[i] = tone(i); // 第二段
    else samples[i] = 0; // 靜音
  }
  const wav = makeWav(samples, sr);
  const segs = vadSegments(wav);
  const voiced = segs.filter(s => s.end > s.start);
  assert.ok(voiced.length >= 2, '應切出至少 2 段語音, 實際 ' + voiced.length);
  assert.notEqual(voiced[0].speaker, voiced[voiced.length - 1].speaker, '前後語者應輪替');
});

test('VAD 非 WAV 回退單段', () => {
  const segs = vadSegments(Buffer.from('not a wav file at all here'));
  assert.equal(segs.length, 1);
  assert.equal(segs[0].speaker, 'A');
});

test('VAD 通用: webm (ffmpeg 解碼) → 分段', async () => {
  // 用 ffmpeg 合成 webm: 0.4s 音 + 0.9s 靜音 + 0.4s 音 (模擬兩語者)
  const webm = `C:/Users/dingj/AppData/Local/Temp/vad-test-${Date.now()}.webm`;
  const { spawnSync } = await import('node:child_process');
  // 產生帶靜音間隔的音軌: 用 sine 拼接 (前後有音, 中間靜音)
  const r = spawnSync('ffmpeg', ['-y',
    '-f', 'lavfi', '-i', 'sine=frequency=440:duration=0.4',
    '-f', 'lavfi', '-i', 'anullsrc=r=16000:cl=mono:d=0.9',
    '-f', 'lavfi', '-i', 'sine=frequency=660:duration=0.4',
    '-filter_complex', '[0:a][1:a][2:a]concat=n=3:v=0:a=1[a]',
    '-map', '[a]', '-c:a', 'libopus', webm], { timeout: 20000, windowsHide: true });
  if (r.status !== 0) { console.warn('ffmpeg 不可用, 跳過 webm VAD 測試'); return; }
  const buf = fs.readFileSync(webm);
  assert.ok(buf.length > 100, 'webm 應有實際內容');
  const segs = await vadSegmentsAny(buf);
  const voiced = segs.filter(s => s.end > s.start);
  assert.ok(voiced.length >= 2, 'webm 應切出至少 2 段語音, 實際 ' + JSON.stringify(segs.map(s=>[s.speaker,s.start,s.end])));
});

function makeWav(samples, sr) {
  const b = Buffer.alloc(44 + samples.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + samples.length * 2, 4); b.write('WAVE', 8);
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28);
  b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36);
  b.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) b.writeInt16LE(samples[i], 44 + i * 2);
  return b;
}

test('buildSubtitle 產生 5T trace 與序號', () => {
  const s = buildSubtitle({ text: 'hi', language: 'en', engine: 'stt:whisper' }, { source: 'hi', target: '嗨', from: 'en', to: 'zh-TW', engine: 'mock', cached: false });
  assert.equal(s.source, 'hi'); assert.equal(s.target, '嗨');
  assert.ok(/^[0-9a-f]{16}$/.test(s.trace));
  assert.equal(typeof s.id, 'number');
});

test('SubtitleStore 保留最近 N 句並過濾空句', () => {
  const store = new SubtitleStore({ maxLines: 3, ttlMs: 12000 });
  for (let i = 0; i < 5; i++) store.push(buildSubtitle({ text: 't' + i, language: 'en', engine: 's' }, { source: 't' + i, target: 'T' + i, from: 'en', to: 'zh-TW', engine: 'm', cached: false }));
  const snap = store.snapshot();
  assert.ok(snap.length <= 3, '超出 maxLines 視窗');
  store.push(buildSubtitle({ text: '', language: 'en', engine: 's' }, { source: '', target: '', from: 'en', to: 'zh-TW', engine: 'm', cached: false }));
  assert.ok(store.snapshot().every(s => s.source || s.target), '不應保留空字幕');
});

test('translate 離線 mock 縫', async () => {
  const r = await translate('會議開始', 'zh-TW', 'en', { mock: true });
  assert.equal(r.source, '會議開始'); assert.match(r.target, /MOCK:zh-TW→en/);
});

test('hashOf 穩定且唯一', () => {
  assert.equal(hashOf('a'), hashOf('a'));
  assert.notEqual(hashOf('a'), hashOf('b'));
});

test('錯誤處理: 連線拒絕 → STT_UNAVAILABLE', () => {
  const e = toOmniLiveError(new Error('fetch failed: ECONNREFUSED'));
  assert.equal(e.code, 'STT_UNAVAILABLE');
  assert.equal(e.retryable, true);
});

test('輸入層: 音訊來源合法性', () => {
  assert.deepEqual(AUDIO_SOURCES, ['mic', 'system-display', 'device', 'caption']);
  assert.throws(() => assertSource('bogus'), /AUDIO_SOURCE_MISSING/);
  assert.throws(() => assertSource('device', ''), /AUDIO_SOURCE_MISSING/);
  const d = describeSource('system-display');
  assert.match(d.browserApi, /getDisplayMedia/);
});
