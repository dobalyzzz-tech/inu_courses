import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    // --- 기간별 매출 요약 & 월별 차트 ---
    if (type === 'revenue') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // 전체 completed 주문
      const { data: allOrders } = await supabase
        .from('orders')
        .select('ordered_at, total_price')
        .eq('status', 'completed');

      const totalRevenue = (allOrders ?? []).reduce((s, o) => s + Number(o.total_price ?? 0), 0);
      const todayRevenue = (allOrders ?? []).filter((o) => o.ordered_at >= todayStart).reduce((s, o) => s + Number(o.total_price ?? 0), 0);
      const weekRevenue = (allOrders ?? []).filter((o) => o.ordered_at >= weekStart).reduce((s, o) => s + Number(o.total_price ?? 0), 0);
      const monthRevenue = (allOrders ?? []).filter((o) => o.ordered_at >= monthStart).reduce((s, o) => s + Number(o.total_price ?? 0), 0);

      // 월별 매출 (최근 12개월)
      const monthlyMap: Record<string, number> = {};
      for (const o of allOrders ?? []) {
        const d = new Date(o.ordered_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap[key] = (monthlyMap[key] ?? 0) + Number(o.total_price ?? 0);
      }

      const monthly = Object.entries(monthlyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([month, revenue]) => ({ month, revenue }));

      return NextResponse.json({
        summary: { today: todayRevenue, week: weekRevenue, month: monthRevenue, total: totalRevenue },
        monthly,
      });
    }

    // --- 이수구분별 통계 ---
    if (type === 'category') {
      // order_items + courses join
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('course_id, price');

      const courseIds = [...new Set((orderItems ?? []).map((i) => i.course_id))];

      const { data: courses } = await supabase
        .from('courses')
        .select('순번, 이수구분')
        .in('순번', courseIds);

      const courseCategory: Record<number, string> = {};
      for (const c of courses ?? []) {
        courseCategory[c.순번] = c.이수구분 ?? '기타';
      }

      const categoryMap: Record<string, { count: number; revenue: number }> = {};
      for (const item of orderItems ?? []) {
        const cat = courseCategory[item.course_id] ?? '기타';
        if (!categoryMap[cat]) categoryMap[cat] = { count: 0, revenue: 0 };
        categoryMap[cat].count += 1;
        categoryMap[cat].revenue += Number(item.price ?? 0);
      }

      const categoryStats = Object.entries(categoryMap).map(([name, stats]) => ({
        name,
        count: stats.count,
        revenue: stats.revenue,
      }));

      return NextResponse.json({ categories: categoryStats });
    }

    // --- 인기 교과목 TOP 10 ---
    if (type === 'popular') {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('course_id, course_name, professor, price');

      const courseCount: Record<number, { name: string; professor: string; count: number; total: number }> = {};
      for (const item of orderItems ?? []) {
        if (!courseCount[item.course_id]) {
          courseCount[item.course_id] = { name: item.course_name, professor: item.professor ?? '', count: 0, total: 0 };
        }
        courseCount[item.course_id].count += 1;
        courseCount[item.course_id].total += Number(item.price ?? 0);
      }

      const top10 = Object.entries(courseCount)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 10)
        .map(([courseId, info], i) => ({
          rank: i + 1,
          course_id: Number(courseId),
          course_name: info.name,
          professor: info.professor,
          count: info.count,
          total_price: info.total,
        }));

      return NextResponse.json({ top10 });
    }

    // --- 정산 데이터 CSV ---
    if (type === 'export') {
      const from = searchParams.get('from');
      const to = searchParams.get('to');

      // orders + order_items 전체 조회 (completed만)
      let query = supabase
        .from('orders')
        .select('id, user_id, ordered_at, total_credits, total_price, status')
        .eq('status', 'completed');

      if (from) query = query.gte('ordered_at', from);
      if (to) query = query.lte('ordered_at', to);

      const { data: orders, error } = await query.order('ordered_at', { ascending: false });
      if (error) throw error;

      // 사용자명 매핑
      const userIds = [...new Set((orders ?? []).map((o) => o.user_id))];
      const userMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: users } = await supabase.from('users').select('id, full_name').in('id', userIds);
        for (const u of users ?? []) userMap[u.id] = u.full_name ?? u.id.slice(0, 8);
      }

      // order_items
      const orderIds = (orders ?? []).map((o) => o.id);
      const { data: items } = await supabase.from('order_items').select('*').in('order_id', orderIds);

      const itemsByOrder: Record<string, any[]> = {};
      for (const item of items ?? []) {
        if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
        itemsByOrder[item.order_id].push(item);
      }

      // CSV 생성
      const bom = '\uFEFF';
      const header = '주문번호,신청자명,신청일시,총학점,총금액,교과목명,교수,학점,수강가격';
      const rows = (orders ?? []).flatMap((o) => {
        const orderItems = itemsByOrder[o.id] ?? [];
        const date = new Date(o.ordered_at).toISOString().slice(0, 19).replace('T', ' ');
        const userName = userMap[o.user_id] ?? o.user_id.slice(0, 8);
        return orderItems.length > 0
          ? orderItems.map((item) =>
              `${o.id.slice(0, 8)},${userName},${date},${o.total_credits},${o.total_price},${item.course_name},${item.professor ?? ''},${item.credits},${item.price}`
            )
          : [`${o.id.slice(0, 8)},${userName},${date},${o.total_credits},${o.total_price},,,,`];
      });

      return NextResponse.json({
        csv: bom + header + '\n' + rows.join('\n'),
        count: (orders ?? []).length,
      });
    }

    return NextResponse.json({ error: '잘못된 type 파라미터입니다.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
