import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { csvData, sourceSystem } = await req.json();

    if (!csvData) {
      return NextResponse.json({ success: false, error: '缺少 CSV 內容' }, { status: 400 });
    }

    // 模擬簡易 CSV 解析與「5T自動橋接器」轉換邏輯
    // 假設接收到的 CSV 格式為：EmployeeID,Department,Gender,Resigned
    const rows = csvData.split('\n').filter((row: string) => row.trim().length > 0);
    const headers = rows[0].split(',').map((h: string) => h.trim().toLowerCase());
    
    let totalEmployees = 0;
    let femaleEmployees = 0;
    let resignedEmployees = 0;

    // 解析資料行
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split(',').map((c: string) => c.trim());
      if (cols.length === headers.length) {
        totalEmployees++;
        const genderIndex = headers.findIndex((h: string) => h.includes('gender') || h.includes('性別'));
        const resignedIndex = headers.findIndex((h: string) => h.includes('resigned') || h.includes('離職'));

        if (genderIndex !== -1 && (cols[genderIndex] === 'F' || cols[genderIndex] === '女')) {
          femaleEmployees++;
        }
        if (resignedIndex !== -1 && (cols[resignedIndex] === 'Y' || cols[resignedIndex] === 'True' || cols[resignedIndex] === '是')) {
          resignedEmployees++;
        }
      }
    }

    // 橋接轉換為 5T 標準 ESG 指標
    const femaleRatio = totalEmployees > 0 ? ((femaleEmployees / totalEmployees) * 100).toFixed(1) : '0';
    const turnoverRate = totalEmployees > 0 ? ((resignedEmployees / totalEmployees) * 100).toFixed(1) : '0';

    const esgMetrics = {
      totalWorkforce: totalEmployees,
      femaleRatio: `${femaleRatio}%`,
      turnoverRate: `${turnoverRate}%`,
      source: sourceSystem || '企業人資系統 (HR System)',
      status: '✅ 5T Protocol 橋接成功'
    };

    // 🔥 聯動：成功解析企業數據，給予 JunAiKey 30 EXP
    const apiKey = process.env.OMNI_JUNAIKEY_GROWTH_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://127.0.0.1:3000';
    if (apiKey) {
      fetch(`${baseUrl}/api/junaikey/growth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ expGain: 30 })
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      metrics: esgMetrics
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
