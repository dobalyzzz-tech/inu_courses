"use client";

import { useEffect, useState } from "react";
import { BookOpen, Users, ClipboardCheck, DollarSign } from "lucide-react";

interface DashboardStats {
  totalCourses: number;
  totalUsers: number;
  todayOrders: number;
  monthlyRevenue: number;
}

const CARD_ICONS = [BookOpen, ClipboardCheck, Users, DollarSign] as const;

function SummaryCard({
  icon: Icon,
  label,
  value,
  index,
}: {
  icon: (typeof CARD_ICONS)[number];
  label: string;
  value: number | null;
  index: number;
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex items-start gap-4">
      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
        index === 0 ? "bg-sky-100 text-sky-600" :
        index === 1 ? "bg-amber-100 text-amber-600" :
        index === 2 ? "bg-emerald-100 text-emerald-600" :
        "bg-violet-100 text-violet-600"
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-zinc-800 tabular-nums">
          {value !== null ? value.toLocaleString() : <span className="text-zinc-300 text-lg">로딩 중</span>}
        </p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalUsers: 0,
    todayOrders: 0,
    monthlyRevenue: 0,
  });
  const [lastAccess, setLastAccess] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const prev = sessionStorage.getItem("adminLastAccess");
    if (prev) setLastAccess(prev);
    sessionStorage.setItem("adminLastAccess", new Date().toISOString());

    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats?type=revenue");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);

        // 개별 count는 stats API에 포함되어 있지 않으므로 별도 API 호출
        const [coursesRes, usersRes] = await Promise.all([
          fetch("/api/admin/courses?page=1&pageSize=1"),
          fetch("/api/admin/users?page=1&pageSize=1"),
        ]);
        const coursesJson = await coursesRes.json();
        const usersJson = await usersRes.json();

        setStats({
          totalCourses: coursesJson.count ?? 0,
          totalUsers: usersJson.count ?? 0,
          todayOrders: 0,
          monthlyRevenue: json.summary?.month ?? 0,
        });

        // 오늘 주문 건수 별도 조회
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        const ordersRes = await fetch(`/api/admin/orders?from=${todayStr}&to=${todayStr}T23:59:59.999Z&page=1&pageSize=1`);
        const ordersJson = await ordersRes.json();
        setStats((prev) => ({ ...prev, todayOrders: ordersJson.count ?? 0 }));
      } catch (err) {
        console.error("관리자 대시보드 통계 조회 실패:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const labels = ["전체 교과목 수", "오늘 수강신청 건수", "전체 회원 수", "이번 달 총 매출"] as const;
  const values = loading
    ? [null, null, null, null]
    : [stats.totalCourses, stats.todayOrders, stats.totalUsers, stats.monthlyRevenue];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {labels.map((label, i) => (
          <SummaryCard key={label} icon={CARD_ICONS[i]} label={label} value={values[i]} index={i} />
        ))}
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-[15px] font-semibold text-zinc-800 mb-4">접속 정보</h2>
        <p className="text-zinc-500 text-sm">
          {lastAccess
            ? `마지막 접속: ${new Date(lastAccess).toLocaleString("ko-KR", {
                year: "numeric", month: "2-digit", day: "2-digit",
                hour: "2-digit", minute: "2-digit", second: "2-digit",
              })}`
            : "첫 번째 접속입니다."}
        </p>
      </div>
    </div>
  );
}
