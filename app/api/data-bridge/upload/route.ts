import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// ─── 5T Column Mapping Registry ──────────────────────────────────────────────
const COLUMN_SYNONYMS: Record<string, string[]> = {
  // HR Attendance
  employee_id:   ['employeeid', 'emp_id', 'employee_id', '員工編號', '工號'],
  name:          ['name', 'fullname', 'employee_name', '姓名', '員工姓名'],
  department:    ['department', 'dept', 'division', '部門', '單位'],
  gender:        ['gender', 'sex', '性別'],
  date:          ['date', 'attendance_date', '日期', '出勤日期'],
  status:        ['status', 'attendance_status', '出勤狀態', '狀態'],
  commute_km:    ['commute_km', 'commute_distance', 'km', '通勤距離', '公里'],
  transport_mode:['transport_mode', 'commute_mode', 'mode', '交通方式', '通勤方式'],
  resigned:      ['resigned', 'terminated', 'left', '離職', '離職狀態'],
  // ERP Energy
  meter_id:      ['meter_id', 'meter', 'metercode', '電表編號', '計量表'],
  kwh:           ['kwh', 'energy_kwh', 'electricity', '度數', '用電量'],
  period:        ['period', 'month', 'billing_period', '期間', '帳期'],
  // ERP Materials
  material_code: ['material_code', 'sku', 'item_code', '物料編號', '料號'],
  quantity:      ['quantity', 'qty', 'amount', '數量'],
  unit:          ['unit', 'uom', '單位'],
  supplier:      ['supplier', 'vendor', '供應商', '廠商'],
  co2e_factor:   ['co2e_factor', 'emission_factor', '排放係數'],
};

function normalizeColumnName(raw: string): string {
  const lower = raw.trim().toLowerCase().replace(/[\s\-_\/]/g, '_');
  for (const [canonical, synonyms] of Object.entries(COLUMN_SYNONYMS)) {
    if (synonyms.some(s => lower.includes(s.toLowerCase().replace(/[\s\-_\/]/g, '_')))) {
      return canonical;
    }
  }
  return lower;
}

function parseCsvText(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const headers = rawHeaders.map(normalizeColumnName);

  const rows = lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = cols[i] ?? ''; });
    return row;
  });
  return { headers, rows };
}

function parseXlsx(buffer: ArrayBuffer): { headers: string[]; rows: Record<string, string>[] } {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  if (raw.length === 0) return { headers: [], rows: [] };
  const rawHeaders = Object.keys(raw[0]);
  const headers = rawHeaders.map(normalizeColumnName);
  const rows = raw.map((r: any) => {
    const row: Record<string, string> = {};
    rawHeaders.forEach((h, i) => { row[headers[i]] = String(r[h] ?? ''); });
    return row;
  });
  return { headers, rows };
}

// ─── 5T Compute per Data Type ─────────────────────────────────────────────────
function computeHrAttendance(rows: Record<string, string>[]) {
  const total = rows.length;
  const female = rows.filter(r => ['f', 'female', '女'].includes(r.gender?.toLowerCase() ?? '')).length;
  const resigned = rows.filter(r => ['y', 'yes', 'true', '是', '1'].includes(r.resigned?.toLowerCase() ?? '')).length;
  const totalKm = rows.reduce((sum, r) => sum + (parseFloat(r.commute_km) || 0), 0);
  // Average emission: car=0.21kg CO2/km, transit=0.04kg/km
  const avgCo2Factor = 0.14; // blended estimate
  const commuteCarbon = (totalKm * avgCo2Factor).toFixed(2);

  return {
    type: 'HR 出缺勤',
    recordCount: total,
    metrics: {
      '女性比例': total > 0 ? `${((female / total) * 100).toFixed(1)}%` : 'N/A',
      '離職率': total > 0 ? `${((resigned / total) * 100).toFixed(1)}%` : 'N/A',
      '通勤總距離': `${totalKm.toFixed(1)} km`,
      '估計通勤碳排': `${commuteCarbon} kg CO₂e`,
    },
    scopeAffected: 'Scope 3 (員工通勤)',
  };
}

function computeErpEnergy(rows: Record<string, string>[]) {
  const totalKwh = rows.reduce((sum, r) => sum + (parseFloat(r.kwh) || 0), 0);
  const emissionFactor = 0.509; // Taiwan grid, kg CO2e/kWh
  const co2e = (totalKwh * emissionFactor).toFixed(2);
  return {
    type: 'ERP 能源',
    recordCount: rows.length,
    metrics: {
      '用電總量': `${totalKwh.toFixed(1)} kWh`,
      '電網排放係數': `0.509 kg CO₂e/kWh (台電 2024)`,
      '計算 Scope 2 排放': `${co2e} kg CO₂e`,
    },
    scopeAffected: 'Scope 2 (購電)',
  };
}

function computeErpMaterials(rows: Record<string, string>[]) {
  let totalCo2e = 0;
  rows.forEach(r => {
    const qty = parseFloat(r.quantity) || 0;
    const factor = parseFloat(r.co2e_factor) || 0;
    totalCo2e += qty * factor;
  });
  return {
    type: 'ERP 原物料',
    recordCount: rows.length,
    metrics: {
      '物料種類': `${new Set(rows.map(r => r.material_code)).size} 種`,
      '供應商數量': `${new Set(rows.map(r => r.supplier)).size} 家`,
      '計算 Scope 3 排放': `${totalCo2e.toFixed(2)} kg CO₂e`,
    },
    scopeAffected: 'Scope 3 (上游採購)',
  };
}

function computeHrRoster(rows: Record<string, string>[]) {
  const total = rows.length;
  const byDept: Record<string, number> = {};
  rows.forEach(r => { byDept[r.department || '未分類'] = (byDept[r.department || '未分類'] || 0) + 1; });
  return {
    type: 'HR 員工名冊',
    recordCount: total,
    metrics: {
      '總員工數': `${total} 人`,
      '部門數量': `${Object.keys(byDept).length} 個部門`,
      '最大部門': Object.entries(byDept).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A',
    },
    scopeAffected: '組織邊界 (GRI 2-7)',
  };
}

// ─── POST Handler ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const dataType = (formData.get('dataType') as string) || 'hr_attendance';

    if (!file) {
      return NextResponse.json({ success: false, error: '缺少上傳檔案' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const fileName = file.name.toLowerCase();

    // ─ Parse file ─
    let parsed: { headers: string[]; rows: Record<string, string>[] };
    if (fileName.endsWith('.csv')) {
      const text = new TextDecoder('utf-8').decode(bytes);
      parsed = parseCsvText(text);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      parsed = parseXlsx(bytes);
    } else {
      return NextResponse.json({ success: false, error: '不支援的檔案格式' }, { status: 400 });
    }

    if (parsed.rows.length === 0) {
      return NextResponse.json({ success: false, error: '檔案中未找到有效資料列' }, { status: 400 });
    }

    // ─ Compute ESG metrics ─
    let analysis;
    switch (dataType) {
      case 'hr_attendance':  analysis = computeHrAttendance(parsed.rows); break;
      case 'hr_roster':      analysis = computeHrRoster(parsed.rows); break;
      case 'erp_energy':     analysis = computeErpEnergy(parsed.rows); break;
      case 'erp_materials':  analysis = computeErpMaterials(parsed.rows); break;
      default:               analysis = computeHrAttendance(parsed.rows);
    }

    // ─ 5T Stamp ─
    const uuid = crypto.randomUUID();
    const timestamp = Date.now();
    const hashPayload = `${uuid}:${timestamp}:${parsed.rows.length}:${file.name}`;
    const hashLock = crypto.createHash('sha256').update(hashPayload).digest('hex');

    // ─ Persist to Prisma Database (Supabase PostgreSQL) ─
    try {
      await prisma.dataBridgeUpload.create({
        data: {
          id: uuid,
          sourceSystem: file.name,
          dataType: dataType,
          fileName: file.name,
          fileSize: file.size,
          recordCount: parsed.rows.length,
          headers: JSON.stringify(parsed.headers),
          hashLock: hashLock,
          metrics: JSON.stringify(analysis),
          records: {
            create: parsed.rows.slice(0, 200).map((row) => ({
              rawJson: JSON.stringify(row),
            })),
          },
        },
      });
    } catch (dbErr) {
      console.warn('[data-bridge/upload] Database write warning (falling back to memory response):', dbErr);
    }

    // ─ Fire JunAiKey Growth ─
    const apiKey = process.env.OMNI_JUNAIKEY_GROWTH_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://127.0.0.1:3000';
    if (apiKey) {
      fetch(`${baseUrl}/api/junaikey/growth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ expGain: 30, reason: `data-bridge:${dataType}` }),
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      uuid,
      timestamp,
      hashLock,
      fileName: file.name,
      fileSize: file.size,
      detectedColumns: parsed.headers,
      analysis,
      preview: parsed.rows.slice(0, 5), // first 5 rows for preview table
    });

  } catch (error) {
    console.error('[data-bridge/upload]', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
