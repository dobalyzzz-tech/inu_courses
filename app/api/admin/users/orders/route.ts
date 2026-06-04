import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId가 필요합니다.' }, { status: 400 });
    }

    // 해당 사용자의 completed 주문 조회
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, ordered_at, total_credits, total_price, status')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('ordered_at', { ascending: false });

    if (ordersError) throw ordersError;

    // 각 주문별 order_items 조회
    const orderIds = (orders ?? []).map((o) => o.id);
    const itemsMap: Record<string, any[]> = {};

    if (orderIds.length > 0) {
      const { data: items } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      for (const item of items ?? []) {
        if (!itemsMap[item.order_id]) itemsMap[item.order_id] = [];
        itemsMap[item.order_id].push({
          course_name: item.course_name,
          professor: item.professor,
          credits: item.credits,
          price: item.price,
        });
      }
    }

    const result = (orders ?? []).map((o) => ({
      id: o.id,
      ordered_at: o.ordered_at,
      total_credits: o.total_credits,
      total_price: o.total_price,
      status: o.status,
      items: itemsMap[o.id] ?? [],
    }));

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
