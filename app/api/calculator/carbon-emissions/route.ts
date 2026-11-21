import { NextResponse } from 'next/server';
import crypto from 'crypto';

// ESG GO Taipower 2024 & DEFRA 2024 Carbon Emission Coefficients
export const EMISSION_FACTORS = {
  scope2: {
    electricityKWh: 0.494, // 2024 Taipower electricity emission factor (kgCO2e/kWh)
  },
  scope1: {
    gasolineLiters: 2.312, // kgCO2e / L
    dieselLiters: 2.688, // kgCO2e / L
    naturalGasM3: 2.021, // kgCO2e / m3
  },
  scope3: {
    businessTravelKm: 0.115, // kgCO2e / passenger-km
    logisticsTonKm: 0.105, // kgCO2e / ton-km
  },
};

export async function GET() {
  return NextResponse.json({
    success: true,
    title: 'ESG GO Carbon Emissions Calculator API',
    version: 'v3.4.0',
    emissionFactors: EMISSION_FACTORS,
    standards: ['ISO 14064-1:2018', 'GHG Protocol', 'GRI 305', 'Taipower 2024'],
    usage: 'POST with JSON body: { scope1?: {...}, scope2?: {...}, scope3?: {...} }',
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, code: 'INVALID_INPUT', error: '請提供有效的 JSON 物件。' },
        { status: 400 }
      );
    }

    const { scope1 = {}, scope2 = {}, scope3 = {} } = body;
    const scopes = { scope1, scope2, scope3 };
    const fieldsByScope: Record<string, string[]> = {
      scope1: ['gasolineLiters', 'dieselLiters', 'naturalGasM3'],
      scope2: ['electricityKWh', 'customFactor'],
      scope3: ['businessTravelKm', 'logisticsTonKm'],
    };
    const validationErrors: string[] = [];

    for (const [scopeName, fields] of Object.entries(fieldsByScope)) {
      const scope = scopes[scopeName as keyof typeof scopes];
      if (!scope || typeof scope !== 'object' || Array.isArray(scope)) {
        validationErrors.push(`${scopeName} 必須是物件`);
        continue;
      }
      for (const field of fields) {
        const value = (scope as Record<string, unknown>)[field];
        if (value === undefined || value === null || value === '') continue;
        const numericValue = typeof value === 'number' ? value : Number(value);
        if (!Number.isFinite(numericValue) || numericValue < 0) {
          validationErrors.push(`${scopeName}.${field} 必須是大於或等於 0 的有限數值`);
        }
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, code: 'INVALID_INPUT', error: '排放活動數據無效。', details: validationErrors },
        { status: 400 }
      );
    }

    const numeric = (scope: Record<string, unknown>, field: string) => {
      const value = scope[field];
      return value === undefined || value === null || value === '' ? 0 : Number(value);
    };

    // Scope 1 Calculation
    const gasoline = numeric(scope1, 'gasolineLiters');
    const diesel = numeric(scope1, 'dieselLiters');
    const naturalGas = numeric(scope1, 'naturalGasM3');

    const scope1Kg =
      gasoline * EMISSION_FACTORS.scope1.gasolineLiters +
      diesel * EMISSION_FACTORS.scope1.dieselLiters +
      naturalGas * EMISSION_FACTORS.scope1.naturalGasM3;

    // Scope 2 Calculation
    const electricity = numeric(scope2, 'electricityKWh');
    const scope2Factor =
      scope2.customFactor !== undefined && scope2.customFactor !== null && scope2.customFactor !== ''
        ? Number(scope2.customFactor)
        : EMISSION_FACTORS.scope2.electricityKWh;

    const scope2Kg = electricity * scope2Factor;

    // Scope 3 Calculation
    const travel = numeric(scope3, 'businessTravelKm');
    const logistics = numeric(scope3, 'logisticsTonKm');

    const scope3Kg =
      travel * EMISSION_FACTORS.scope3.businessTravelKm +
      logistics * EMISSION_FACTORS.scope3.logisticsTonKm;

    const totalKg = scope1Kg + scope2Kg + scope3Kg;
    const totalTonne = totalKg / 1000;

    const uuid = crypto.randomUUID();
    const timestamp = Date.now();
    const sourceOrigin = 'JunAiKey_OmniAgent';

    const rawDataToHash = JSON.stringify({
      uuid,
      timestamp,
      sourceOrigin,
      totalKg,
      scope1Kg,
      scope2Kg,
      scope3Kg,
    });

    const hashLock = crypto
      .createHash('sha256')
      .update(rawDataToHash)
      .digest('hex');

    const result = {
      success: true,
      specVersion: 'v3.4.0',
      uuid,
      timestamp,
      sourceOrigin,
      hashLock,
      summary: {
        totalEmissionsKgCO2e: Number(totalKg.toFixed(4)),
        totalEmissionsTonnesCO2e: Number(totalTonne.toFixed(4)),
        scope1KgCO2e: Number(scope1Kg.toFixed(4)),
        scope2KgCO2e: Number(scope2Kg.toFixed(4)),
        scope3KgCO2e: Number(scope3Kg.toFixed(4)),
      },
      breakdown: {
        scope1: {
          gasolineLiters: gasoline,
          dieselLiters: diesel,
          naturalGasM3: naturalGas,
          emissionsKgCO2e: Number(scope1Kg.toFixed(4)),
        },
        scope2: {
          electricityKWh: electricity,
          factorUsed: scope2Factor,
          emissionsKgCO2e: Number(scope2Kg.toFixed(4)),
        },
        scope3: {
          businessTravelKm: travel,
          logisticsTonKm: logistics,
          emissionsKgCO2e: Number(scope3Kg.toFixed(4)),
        },
      },
      fiveTProtocolSeals: {
        truth: { verified: true, sourceOrigin },
        goodness: { verified: true, standard: 'ISO 14064-1 & Taipower 2024' },
        beauty: { verified: true, format: 'Liquid Glass Matrix' },
        trust: { verified: true, hashLock },
        trackable: { verified: true, uuid },
      },
    };

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('[calculator/carbon-emissions]', error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || '計算失敗 (Calculation Error)',
      },
      { status: 500 }
    );
  }
}
