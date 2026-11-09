// ============================================================
// A08 OmniMemory API — Phase 2: Full CRUD
// src/app/api/omni-memory/route.ts
// 5T Protocol: Trackable · Transparent · Tangible · Trustworthy · Transferful
// ============================================================

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-omni";
import crypto from "crypto";

// ── GET — read memories (keyword search + type filter) ──
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") ?? "";
    const type = searchParams.get("type") ?? "";
    const userId = searchParams.get("userId") ?? "junai-key";
    const take = parseInt(searchParams.get("limit") ?? "50", 10);

    const q = supabase
      .from('OmniMemory')
      .select('*')
      .eq('userId', userId)
      .order('lastAccessed', { ascending: false })
      .limit(take);
    if (type && type !== "all") {
      q = q.eq('type', type);
    }

    const { data: rows, error } = await q;
    if (error) {
      console.error('[OmniMemory GET]', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const filtered = query
      ? rows.filter((m: Record<string, unknown>) => {
          const kws = JSON.parse(m.keywords || "[]") as string[];
          return (
            String(m.content).toLowerCase().includes(query.toLowerCase()) ||
            kws.some((k) => k.toLowerCase().includes(query.toLowerCase()))
          );
        })
      : rows;

    const data = filtered.map((m: Record<string, unknown>) => ({
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

// ── POST — create memory node (Supabase direct INSERT) ──
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

    const { data: memory, error } = await supabase
      .from('OmniMemory')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('[OmniMemory POST]', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: { ...memory, keywords: JSON.parse(memory.keywords || "[]") },
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

    const { data: updated, error } = await supabase
      .from('OmniMemory')
      .update({
        ...(typeof confidence === "number" ? { confidence } : {}),
        ...(content ? { content } : {}),
        lastAccessed: new Date(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[OmniMemory PATCH]', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

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

    const { error } = await supabase.from('OmniMemory').delete().eq('id', id);
    if (error) {
      console.error('[OmniMemory DELETE]', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Memory ${id} deleted` });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[OmniMemory DELETE]", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
