import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // cartCount / orderCount: 단순 count 조회
    const cartCountId = searchParams.get('cartCount');
    if (cartCountId) {
      const { count, error } = await supabase
        .from('cart_items')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', parseInt(cartCountId, 10));
      if (error) throw error;
      return NextResponse.json({ count: count ?? 0 });
    }

    const orderCountId = searchParams.get('orderCount');
    if (orderCountId) {
      const { count, error } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', parseInt(orderCountId, 10));
      if (error) throw error;
      return NextResponse.json({ count: count ?? 0 });
    }

    // courses 목록 조회
    let query = supabase.from('courses').select('*', { count: 'exact' });

    const search = searchParams.get('search');
    if (search) {
      query = query.or(`교과목명.ilike.%${search}%,담당교수.ilike.%${search}%`);
    }

    const sortField = searchParams.get('sortField');
    const sortDir = searchParams.get('sortDir') === 'desc' ? 'desc' : 'asc';
    if (sortField === '이수구분' || sortField === '이수영역') {
      query = query.order(sortField, { ascending: sortDir === 'asc' });
    } else {
      query = query.order('순번', { ascending: true });
    }

    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data, count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // 순번 자동 생성: 현재 최대값 + 1
    const { data: maxRow } = await supabase
      .from('courses')
      .select('순번')
      .order('순번', { ascending: false })
      .limit(1)
      .single();

    const nextSeq = (maxRow?.순번 ?? 0) + 1;

    const { error } = await supabase.from('courses').insert([{ ...body, 순번: nextSeq }]);
    if (error) throw error;

    return NextResponse.json({ success: true, 순번: nextSeq });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { 순번, ...updates } = body;

    if (!순번) {
      return NextResponse.json({ error: '순번이 필요합니다.' }, { status: 400 });
    }

    const { error } = await supabase.from('courses').update(updates).eq('순번', 순번);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const seq = searchParams.get('순번');

    if (!seq) {
      return NextResponse.json({ error: '순번이 필요합니다.' }, { status: 400 });
    }

    const { error } = await supabase.from('courses').delete().eq('순번', parseInt(seq, 10));
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
