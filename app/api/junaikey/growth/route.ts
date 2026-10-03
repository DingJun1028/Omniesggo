import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Local storage for Avatar Growth Data (Zero-Cost Local JSON)
const GROWTH_DATA_FILE = path.join(process.cwd(), 'data', 'junaikey-growth.json');

// Initialize data file if it doesn't exist
const ensureDataFile = () => {
  const dir = path.dirname(GROWTH_DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(GROWTH_DATA_FILE)) {
    const initialData = {
      level: 1,
      exp: 0,
      nextLevelExp: 1000,
      syncRate: 45.5,
      coreTraits: ['Truth', 'Goodness', 'Beauty', 'Trust', 'Transferful'],
      memoryFragments: 12
    };
    fs.writeFileSync(GROWTH_DATA_FILE, JSON.stringify(initialData, null, 2));
  }
};

// Security Guard Helper
const verifyJunaikeyAuth = (req: Request) => {
  const authHeader = req.headers.get('authorization');
  const expectedKey = process.env.OMNI_JUNAIKEY_GROWTH_KEY;
  
  if (!expectedKey) {
    console.error('Server missing OMNI_JUNAIKEY_GROWTH_KEY');
    return false;
  }

  // Expecting format "Bearer oa_junaikey_live_..."
  const token = authHeader?.replace('Bearer ', '').trim();
  return token === expectedKey;
};

export async function GET(req: Request) {
  if (!verifyJunaikeyAuth(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Invalid JunAiKey' }, { status: 401 });
  }

  try {
    ensureDataFile();
    const data = JSON.parse(fs.readFileSync(GROWTH_DATA_FILE, 'utf-8'));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!verifyJunaikeyAuth(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Invalid JunAiKey' }, { status: 401 });
  }

  try {
    const body = await req.json();
    ensureDataFile();
    const currentData = JSON.parse(fs.readFileSync(GROWTH_DATA_FILE, 'utf-8'));
    
    // Simulate Growth/EXP addition
    const newExp = currentData.exp + (body.expGain || 50);
    const newLevel = newExp >= currentData.nextLevelExp ? currentData.level + 1 : currentData.level;
    const nextExp = newLevel > currentData.level ? currentData.nextLevelExp * 1.5 : currentData.nextLevelExp;
    
    const updatedData = {
      ...currentData,
      exp: newExp,
      level: newLevel,
      nextLevelExp: nextExp,
      syncRate: Math.min(100, currentData.syncRate + 1.2), // Increase sync rate
      memoryFragments: currentData.memoryFragments + 1
    };

    fs.writeFileSync(GROWTH_DATA_FILE, JSON.stringify(updatedData, null, 2));
    
    return NextResponse.json({ success: true, data: updatedData, levelUp: newLevel > currentData.level });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
