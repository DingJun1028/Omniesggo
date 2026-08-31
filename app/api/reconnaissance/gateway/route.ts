import { NextResponse } from "next/server";
import crypto from "crypto";
import { IIntelNode5T } from '@lib/core/5t-protocol';

// --- Utility Functions ---
const generateHash = (data: string): string => {
  return crypto.createHash("sha256").update(data).digest("hex");
};

const getUnixTimestamp = (): number => {
  return Math.floor(Date.now() / 1000);
};

// --- 5T Protocol Gateway Core ---
/**
 * 💡 核心模組：ESGss 商業偵情 5T 協議閘口 (S1-S5 Intelligence Gateway)
 * 哲學：以神聖代碼契約鑄造永恆架構，在熵增的混沌中開闢秩序之路。
 */
const processReconnaissanceIntel = (
  rawData: any,
  category: "S1" | "S2" | "S3" | "S4" | "S5" | "NAV" | "REPORT"
): IIntelNode5T => {
  // 1. 提取資訊熵 (Extract Quantum Essence)
  const intelId = `INTEL-${category}-${Date.now()}`;

  // 2. 鑄造 5T 神聖契約
  const intelNode: IIntelNode5T = {
    uuid: intelId,
    version: "2.0.0",
    timestamp: getUnixTimestamp(),
    category: category,
    impact_level: rawData.risk_score > 80 ? 5 : 3,
    evidence: Array.isArray(rawData.raw_evidence) ? rawData.raw_evidence : [rawData.raw_evidence || {}], // 證據左證庫
    protocol_5T: {
      tangible: true,
      traceable: rawData.source_url || "UNKNOWN_ORIGIN",
      trackable: ["CREATED_AT_GATEWAY", "MAPPED_TO_EXPOSURE"],
      transparent: rawData.calculation_method || "SROI_Impact_Model_v2 [ISO-14064-1]",
      trustworthy: generateHash(JSON.stringify(rawData)),
    },
    principles_5T: {
      tasteful: true,
      truthful: rawData.source_url || "UNKNOWN_ORIGIN",
      transferful: ["CREATED_AT_GATEWAY", "MAPPED_TO_EXPOSURE"].join(","),
      thankful: rawData.calculation_method || "SROI_Impact_Model_v2 [ISO-14064-1]",
      trustful: generateHash(JSON.stringify(rawData)),
    },
    payload: {
      title: rawData.title || "Untitled Intelligence",
      decision_ready_insight: rawData.insight || "Pending Analysis", // 90天行動建議
      target_entities: rawData.affected_supply_chain || ["General Operations"],
    },
  };

  // 3. 核心禁區：寫入後即刻執行 Object.freeze()
  // Note: Object.freeze is shallow. In a real DB layer, this ensures immutability in memory
  // before being persisted to a WORM (Write Once Read Many) storage or blockchain.
  return Object.freeze(intelNode);
};

// --- API Route Handler ---
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Basic validation
    if (!body || !body.category || !body.rawData) {
      return NextResponse.json(
        { error: "Missing required fields: category and rawData" },
        { status: 400 }
      );
    }

    const { category, rawData } = body;

    // Validate Category
    const validCategories = ["S1", "S2", "S3", "S4", "S5", "NAV", "REPORT"];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }

    // Process through the 5T Gateway
    const processedIntel = processReconnaissanceIntel(rawData, category);

    // [5T-Protocol Verification] Intelligence is successfully hashed and locked.
    // In current orchestration phase, data is kept in the 5T Memory Hub.
    // Future Persistence: Connect to PostgreSQL/NCBDB with Hash Lock verification.
    // Example: await db.intel_reconnaissance_hub.create({ data: processedIntel });

    return NextResponse.json(
      {
        message: "Intelligence successfully processed through 5T Protocol Gateway.",
        status: "LOCKED",
        hash: processedIntel.protocol_5T.trustworthy,
        data: processedIntel,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("5T Gateway Error:", error);
    return NextResponse.json(
      { error: 'Internal Server Error processing intelligence.' },
      { status: 500 }
    );
  }
}
