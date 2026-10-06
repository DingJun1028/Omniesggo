// ============================================================
// A08 OmniMemory API — Phase 2: Full CRUD
// src/app/api/omni-memory/route.ts
// 5T Protocol: Trackable · Transparent · Tangible · Trustworthy · Transferful
// ============================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncEngine } from "@/lib/supabase-sync-engine";
import crypto from "crypto";

// ── GET — read memories (keyword search + type filter) ──
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") ?? "";
    const type = searchParams.get("type") ?? "";
    const userId = searchParams.get("userId") ?? "junai-key";
    const take = parseInt(searchParams.get("limit") ?? "50", 10);

    const where: Record<string, unknown> = { userId };
    if (type && type !== "all") where.type = type;

    const rows = await prisma.omniMemory.findMany({
      where,
      orderBy: { lastAccessed: "desc" },
      take,
    });

    const filtered = query
      ? rows.filter((m) => {
          const kws: string[] = JSON.parse(m.keywords || "[]");
          return (
            m.content.toLowerCase().includes(query.toLowerCase()) ||
            kws.some((k) => k.toLowerCase().includes(query.toLowerCase()))
          );
        })
      : rows;

    const data = filtered.map((m) => ({
      ...m,
      keywords: JSON.parse(m.keywords || "[]") as string[],
    }));

    return NextResponse.json({ success: true, data, total: data.length });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[OmniMemory GET]", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// ── POST — create memory node (SyncEngine offline queue) ──
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, content, keywords, userId, agentId, confidence } = body;

    if (!type || !content) {
      return NextResponse.json(
        { success: false, error: "Missing type or content" },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const payload = {
      id,
      userId: userId || "junai-key",
      agentId: agentId || "omni-agent",
      type,
      content,
      keywords: JSON.stringify(Array.isArray(keywords) ? keywords : []),
      confidence: typeof confidence === "number" ? confidence : 1.0,
      sourceOrigin: "API_OMNI_MEMORY",
      createdAt: now,
      lastAccessed: now,
    };

    syncEngine.pushTask("OmniMemory", "INSERT", payload);

    return NextResponse.json({
      success: true,
      message: "Memory node queued",
      data: { ...payload, keywords: JSON.parse(payload.keywords) },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[OmniMemory POST]", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// ── PATCH — update confidence or content ──
export async function PATCH(req: Request) {
  try {
    const { id, confidence, content } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
    }

    const updated = await prisma.omniMemory.update({
      where: { id },
      data: {
        ...(typeof confidence === "number" ? { confidence } : {}),
        ...(content ? { content } : {}),
        lastAccessed: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: { ...updated, keywords: JSON.parse(updated.keywords || "[]") },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[OmniMemory PATCH]", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// ── DELETE — forget a memory node ──
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
    }

    await prisma.omniMemory.delete({ where: { id } });
    return NextResponse.json({ success: true, message: `Memory ${id} deleted` });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[OmniMemory DELETE]", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
