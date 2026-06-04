"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, X, ClipboardList } from "lucide-react";

interface UserRow {
  id: string;
  email: string | null;
  display_name: string;
  created_at: string;
  order_count: number;
  total_paid: number;
}

interface OrderBrief {
  id: string;
  ordered_at: string;
  total_credits: number;
  total_price: number;
  status: string;
  items: { course_name: string; professor: string | null; credits: number; price: number }[];
}

const PAGE_SIZE = 50;

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // 상세 모달
  const [detailUser, setDetailUser] = useState<UserRow | null>(null);
  const [detailOrders, setDetailOrders] = useState<OrderBrief[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setUsers(json.data ?? []);
      setTotalCount(json.count ?? 0);
    } catch (err: any) {
      console.error("회원 조회 실패:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);
  useEffect(() => { setPage(1); }, [search]);

  const openDetail = async (user: UserRow) => {
    setDetailUser(user);
    setLoadingDetail(true);
    setDetailOrders([]);
    try {
      // 해당 사용자의 completd 주문 + order_items 조회
      const res = await fetch(`/api/admin/users/orders?userId=${user.id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setDetailOrders(json.data ?? []);
    } catch (err: any) {
      console.error("회원 주문 조회 실패:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 검색 */}
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="이름 또는 이메일 검색"
          className="w-full pl-9 pr-3 py-2 text-[13px] bg-white border border-zinc-200 rounded-xl outline-none focus:border-zinc-400 transition-colors"
        />
      </div>

      {/* 회원 목록 */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 whitespace-nowrap">이름</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 whitespace-nowrap">이메일</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 whitespace-nowrap">가입일시</th>
                <th className="text-center px-4 py-3 font-semibold text-zinc-600 whitespace-nowrap">수강신청 횟수</th>
                <th className="text-right px-4 py-3 font-semibold text-zinc-600 whitespace-nowrap">총 결제금액</th>
                <th className="text-center px-4 py-3 font-semibold text-zinc-600 whitespace-nowrap w-[60px]">상세</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-zinc-400">로딩 중...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-zinc-400">회원이 없습니다.</td></tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors cursor-pointer"
                    onClick={() => openDetail(u)}
                  >
                    <td className="px-4 py-3 font-medium text-zinc-800 whitespace-nowrap">{u.display_name}</td>
                    <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">{u.email ?? "-"}</td>
                    <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3 text-center text-zinc-700">{u.order_count}</td>
                    <td className="px-4 py-3 text-right text-zinc-700 tabular-nums">{u.total_paid.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <ClipboardList className="w-4 h-4 text-zinc-400 inline-block" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-default"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[13px] text-zinc-500">{page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-default"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 회원 상세 모달 */}
      {detailUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setDetailUser(null)}>
          <div
            className="bg-white border border-zinc-200 rounded-2xl w-[760px] max-h-[85vh] flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 shrink-0">
              <div>
                <h3 className="text-[15px] font-semibold text-zinc-800">{detailUser.display_name}</h3>
                <p className="text-[12px] text-zinc-500">{detailUser.email}</p>
              </div>
              <button
                onClick={() => setDetailUser(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 모달 본문 */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingDetail ? (
                <p className="text-center text-zinc-400 py-10">로딩 중...</p>
              ) : detailOrders.length === 0 ? (
                <p className="text-center text-zinc-400 py-10">수강신청 내역이 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {detailOrders.map((order) => (
                    <div key={order.id} className="border border-zinc-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[12px] font-mono text-zinc-500">
                          주문번호: {order.id.slice(0, 8)} | {formatDate(order.ordered_at)}
                        </span>
                        <span className="text-[13px] font-semibold text-zinc-800">
                          {order.total_price.toLocaleString()}원
                        </span>
                      </div>
                      <table className="w-full text-[12px]">
                        <thead>
                          <tr className="border-b border-zinc-100">
                            <th className="text-left px-2 py-1 font-medium text-zinc-500">교과목명</th>
                            <th className="text-left px-2 py-1 font-medium text-zinc-500">교수</th>
                            <th className="text-center px-2 py-1 font-medium text-zinc-500">학점</th>
                            <th className="text-right px-2 py-1 font-medium text-zinc-500">금액</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item, i) => (
                            <tr key={i} className="border-b border-zinc-50">
                              <td className="px-2 py-1 text-zinc-700">{item.course_name}</td>
                              <td className="px-2 py-1 text-zinc-500">{item.professor}</td>
                              <td className="px-2 py-1 text-center text-zinc-700">{item.credits}</td>
                              <td className="px-2 py-1 text-right text-zinc-700 tabular-nums">{item.price.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
