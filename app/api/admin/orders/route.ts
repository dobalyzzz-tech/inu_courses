import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    let query = supabase
      .from('orders')
      .select(`
        id,
        user_id,
        ordered_at,
        total_credits,
        total_price,
        status,
        toss_payment_key,
        toss_order_id
      `, { count: 'exact' });

    // 기간 필터
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    if (fromDate) query = query.gte('ordered_at', fromDate);
    if (toDate) query = query.lte('ordered_at', toDate);

    // 상태 필터
    const status = searchParams.get('status');
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // 최신순
    query = query.order('ordered_at', { ascending: false });

    // 페이지네이션
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '50', 10);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: orders, count, error } = await query;
    if (error) throw error;

    // 각 주문별 사용자명 조회
    const userIds = [...new Set((orders ?? []).map((o) => o.user_id))];
    const userMap: Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', userIds);

      for (const u of users ?? []) {
        userMap[u.id] = u.full_name ?? u.id.slice(0, 8);
      }
    }

    const result = (orders ?? []).map((o) => ({
      ...o,
      user_name: userMap[o.user_id] ?? o.user_id.slice(0, 8),
    }));

    return NextResponse.json({ data: result, count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'id와 status가 필요합니다.' }, { status: 400 });
    }

    if (!['completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: '유효하지 않은 상태값입니다.' }, { status: 400 });
    }

    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
