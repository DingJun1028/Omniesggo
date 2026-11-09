import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-omni';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const filter = searchParams.get('filter') || 'all';

    let query = supabase
      .from('OmniTraceLog')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
    if (filter !== 'all') {
      query = query.eq('type', filter);
    }

    const { data: traces, error } = await query;
    if (error) {
      console.error('API /omni-trace Error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: traces });
  } catch (error: any) {
    console.error('API /omni-trace Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uuid, originCause, hashLock, type, agent } = body;

    const { data: trace, error } = await supabase
      .from('OmniTraceLog')
      .insert({ uuid, originCause, hashLock, type, agent })
      .select()
      .single();

    if (error) {
      console.error('API /omni-trace POST Error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: trace });
  } catch (error: any) {
    console.error('API /omni-trace POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
