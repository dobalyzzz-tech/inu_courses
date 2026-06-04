import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '50', 10);

    // users 테이블 조회
    let userQuery = supabase
      .from('users')
      .select('id, email, full_name, created_at', { count: 'exact' });

    if (search) {
      userQuery = userQuery.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    userQuery = userQuery.order('created_at', { ascending: false });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    userQuery = userQuery.range(from, to);

    const { data: users, count, error } = await userQuery;
    if (error) throw error;

    // 각 사용자별 주문 통계
    const userIds = (users ?? []).map((u) => u.id);
    const stats: Record<string, { orderCount: number; totalPaid: number }> = {};

    if (userIds.length > 0) {
      const { data: orders } = await supabase
        .from('orders')
        .select('user_id, total_price')
        .in('user_id', userIds)
        .eq('status', 'completed');

      for (const uid of userIds) {
        const userOrders = (orders ?? []).filter((o) => o.user_id === uid);
        stats[uid] = {
          orderCount: userOrders.length,
          totalPaid: userOrders.reduce((sum, o) => sum + Number(o.total_price ?? 0), 0),
        };
      }
    }

    const result = (users ?? []).map((u) => {
      return {
        id: u.id,
        email: u.email,
        display_name: u.full_name ?? '(이름 없음)',
        created_at: u.created_at,
        order_count: stats[u.id]?.orderCount ?? 0,
        total_paid: stats[u.id]?.totalPaid ?? 0,
      };
    });

    return NextResponse.json({ data: result, count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
