import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// 確保 data 資料夾存在
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const VAULT_FILE = path.join(DATA_DIR, 'trust-vault.json');

// 初始化 Vault 檔案
if (!fs.existsSync(VAULT_FILE)) {
  fs.writeFileSync(VAULT_FILE, JSON.stringify({ seals: [] }, null, 2), 'utf-8');
}

export async function POST(req: Request) {
  try {
    const { documentName, content } = await req.json();

    if (!documentName || !content) {
      return NextResponse.json({ success: false, error: '缺少必要欄位' }, { status: 400 });
    }

    // 1. 產生 SHA-256 Hash Lock (5T 協議: Trustworthy)
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    const timestamp = Date.now();
    
    // 2. 模擬 ZKP 封裝證明 (實際上會是一串密碼學簽章)
    const zkpProof = `zkp_proof_v1_${crypto.randomBytes(16).toString('hex')}`;

    const newSeal = {
      id: crypto.randomUUID(),
      documentName,
      hashLock: hash,
      zkpProof,
      sealedAt: timestamp,
      sourceOrigin: 'OmniCore Digital Trust Hub'
    };

    // 3. 讀寫本地 JSON 資料庫
    const rawData = fs.readFileSync(VAULT_FILE, 'utf-8');
    const vault = JSON.parse(rawData);
    vault.seals.unshift(newSeal); // 新的放前面
    fs.writeFileSync(VAULT_FILE, JSON.stringify(vault, null, 2), 'utf-8');

    // 4. 🔥 聯動：成功存證，給予 JunAiKey 經驗值
    const apiKey = process.env.OMNI_JUNAIKEY_GROWTH_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://127.0.0.1:3000';
    if (apiKey) {
      fetch(`${baseUrl}/api/junaikey/growth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ expGain: 15 })
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      seal: newSeal
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const rawData = fs.readFileSync(VAULT_FILE, 'utf-8');
    const vault = JSON.parse(rawData);
    return NextResponse.json({ success: true, seals: vault.seals });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
