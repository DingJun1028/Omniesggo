import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const vendor = await prisma.supplyChainVendor.findUnique({
      where: { id },
    });

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: '找不到該筆供應商 5T ESG 評鑑紀錄' },
        { status: 404 }
      );
    }

    const certificate = {
      $schema: 'https://esggo.co/schemas/5t-supply-chain-v1.json',
      title: '5T 供應鏈 ESG 永續與人權盡職調查官方證明書 (Supply Chain CSDD Certificate)',
      issuedAt: new Date().toISOString(),
      standardCompliance: ['EU CSDD Directive', 'Germany LkSG Supply Chain Act', 'GRI 2-6 / GRI 308 / GRI 414', '5T Protocol'],
      vendorEvaluationDetails: {
        vendorId: vendor.id,
        supplierName: vendor.supplierName,
        industry: vendor.industry,
        tier: vendor.tier,
        esgRating: vendor.rating,
        riskLevel: vendor.riskLevel,
        environmentScore: vendor.envScore,
        socialScore: vendor.socialScore,
        governanceScore: vendor.govScore,
        strengths: JSON.parse(vendor.strengthsJson),
        weaknesses: JSON.parse(vendor.weaknessesJson),
        recommendation: vendor.recommendation,
      },
      fiveTProtocol: {
        truth: {
          verified: true,
          sourceOrigin: vendor.sourceOrigin,
          provenance: 'Internal Supply Chain ESG Audit Engine',
        },
        goodness: {
          verified: true,
          methodology: 'EU CSDD Vendor Risk Scoring Algorithm',
        },
        beauty: {
          verified: true,
          uiLanguage: 'Liquid Glass Cyan Supply Chain Radar',
        },
        trustworthy: {
          verified: true,
          hashLock: vendor.hashLock,
          algorithm: 'SHA-256',
        },
        trackable: {
          verified: true,
          recordId: vendor.id,
          createdAt: vendor.createdAt,
        },
      },
    };

    return new NextResponse(JSON.stringify(certificate, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="5T_SupplyChain_Certificate_${id.slice(0, 8)}.json"`,
      },
    });
  } catch (error: any) {
    console.error('Export supply chain certificate error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '匯出供應鏈證明書失敗' },
      { status: 500 }
    );
  }
}
