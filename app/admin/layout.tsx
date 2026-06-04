"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, LayoutDashboard, BookOpen, ClipboardList, Users, BarChart3 } from "lucide-react";

const ADMIN_MENUS = [
  { label: "대시보드", icon: LayoutDashboard, path: "/admin" },
  { label: "교과목 관리", icon: BookOpen, path: "/admin/courses" },
  { label: "수강신청 내역 조회", icon: ClipboardList, path: "/admin/orders" },
  { label: "회원 관리", icon: Users, path: "/admin/users" },
  { label: "정산 및 매출 현황", icon: BarChart3, path: "/admin/stats" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem("adminAuth");
    if (auth !== "true") {
      router.replace("/");
    } else {
      setChecked(true);
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem("adminAuth");
    router.replace("/");
  };

  if (!checked) return null;

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* 상단 헤더 */}
      <header className="bg-[#1a2744] border-b border-[#2a3a5e] px-6 py-3 flex items-center justify-between shrink-0">
        <h1 className="text-[16px] font-semibold text-white tracking-tight">기초교육원 관리자</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-zinc-400 bg-[#2a3a5e]/50 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            로그아웃
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* 왼쪽 관리자 사이드바 */}
        <aside className="w-[200px] shrink-0 bg-[#f8f9fb] border-r border-zinc-200 p-3 flex flex-col gap-1">
          {ADMIN_MENUS.map((menu) => {
            const isActive = pathname === menu.path;
            return (
              <Link
                key={menu.path}
                href={menu.path}
                className={`flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium rounded-xl transition-colors ${
                  isActive
                    ? "bg-[#1a2744] text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-800"
                }`}
              >
                <menu.icon className="w-4 h-4 shrink-0" />
                {menu.label}
              </Link>
            );
          })}
        </aside>

        {/* 오른쪽 콘텐츠 영역 */}
        <main className="flex-1 min-w-0 bg-[#f8f9fb] p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
