import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST: 新增記憶片段 (萬能結界 寫入)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, agentId, type, content, keywords, sourceOrigin, metadata } = body;

    if (!userId || !agentId || !content) {
      return NextResponse.json(
        { error: "Missing required fields (userId, agentId, content)" },
        { status: 400 }
      );
    }

    const memory = await prisma.omniMemory.create({
      data: {
        userId,
        agentId,
        type: type || "claim",
        content,
        keywords: keywords ? JSON.stringify(keywords) : "[]",
        sourceOrigin: sourceOrigin || "omni-memory-api",
        metadata: metadata ? JSON.stringify(metadata) : "{}",
      },
    });

    return NextResponse.json({ success: true, memory });
  } catch (error: any) {
    console.error("OmniMemory POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

// GET: 檢索記憶片段 (萬能結界 讀取 - 零算力 FTS 取代向量搜尋)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const agentId = searchParams.get("agentId");
    const query = searchParams.get("query"); // 關鍵字檢索
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // 基礎過濾條件
    const whereClause: any = { userId };
    if (agentId) whereClause.agentId = agentId;

    // 零算力文字檢索 (使用 keywords JSONB/String 比對 或 content 的字串包含)
    if (query) {
      whereClause.OR = [
        { content: { contains: query, mode: "insensitive" } },
        { keywords: { contains: query, mode: "insensitive" } }
      ];
    }

    const memories = await prisma.omniMemory.findMany({
      where: whereClause,
      orderBy: [
        { confidence: "desc" },
        { lastAccessed: "desc" }
      ],
      take: limit,
    });

    // 更新 lastAccessed
    if (memories.length > 0) {
      await prisma.omniMemory.updateMany({
        where: { id: { in: memories.map((m) => m.id) } },
        data: { lastAccessed: new Date() },
      });
    }

    return NextResponse.json({ success: true, memories });
  } catch (error: any) {
    console.error("OmniMemory GET Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
