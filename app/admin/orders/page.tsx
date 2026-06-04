"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, Download, ChevronDown, ChevronUp } from "lucide-react";
import { Fragment } from "react";

interface OrderItem {
  id: string;
  course_name: string;
  professor: string | null;
  credits: number;
  price: number;
}

interface Order {
  id: string;
  user_id: string;
  user_name: string;
  ordered_at: string;
  total_credits: number;
  total_price: number;
  status: string;
}

const PAGE_SIZE = 50;

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const STATUS_LABEL: Record<string, string> = {
  completed: "완료",
  cancelled: "취소",
};

const STATUS_COLOR: Record<string, string> = {
  completed: "text-emerald-600 bg-emerald-50 border-emerald-200",
  cancelled: "text-red-500 bg-red-50 border-red-200",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // 필터
  const [fromDate, setFromDate] = useState(getWeekAgo());
  const [toDate, setToDate] = useState(getToday());
  const [statusFilter, setStatusFilter] = useState("all");

  // 펼쳐진 주문
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate + "T23:59:59.999Z");
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setOrders(json.data ?? []);
      setTotalCount(json.count ?? 0);
    } catch (err: any) {
      console.error("주문 조회 실패:", err);
    } finally {
      setLoading(false);
    }
  }, [page, fromDate, toDate, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const toggleExpand = async (orderId: string) => {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(orderId);

    if (!orderItems[orderId]) {
      setLoadingItems((prev) => ({ ...prev, [orderId]: true }));
      try {
        const res = await fetch(`/api/admin/order-items?orderId=${orderId}`);
        const json = await res.json();
        setOrderItems((prev) => ({ ...prev, [orderId]: json.data ?? [] }));
      } catch {
        setOrderItems((prev) => ({ ...prev, [orderId]: [] }));
      } finally {
        setLoadingItems((prev) => ({ ...prev, [orderId]: false }));
      }
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err: any) {
      alert("상태 변경 실패: " + (err?.message ?? ""));
    }
  };

  // 엑셀(CSV) 다운로드
  const downloadCSV = () => {
    const headers = ["주문번호", "신청자명", "신청일시", "총 학점", "총 금액", "상태"];
    const rows = orders.map((o) => [
      o.id.slice(0, 8),
      o.user_name,
      formatDate(o.ordered_at),
      String(o.total_credits),
      String(o.total_price),
      STATUS_LABEL[o.status] ?? o.status,
    ]);

    const bom = "\uFEFF";
    const csv = bom + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `주문목록_${getToday()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const applyFilter = () => {
    setPage(1);
    fetchOrders();
  };

  return (
    <div className="space-y-4">
      {/* 필터 영역 */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex items-center gap-4 flex-wrap">
        <div>
          <label className="block text-[11px] font-medium text-zinc-500 mb-1">시작일</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-1.5 text-[13px] bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-zinc-400"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-zinc-500 mb-1">종료일</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-1.5 text-[13px] bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-zinc-400"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-zinc-500 mb-1">상태</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-[13px] bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-zinc-400"
          >
            <option value="all">전체</option>
            <option value="completed">완료</option>
            <option value="cancelled">취소</option>
          </select>
        </div>
        <button
          onClick={applyFilter}
          className="self-end px-4 py-1.5 text-[13px] font-medium text-white bg-[#1a2744] hover:bg-[#243556] rounded-xl transition-colors"
        >
          조회
        </button>
        <button
          onClick={downloadCSV}
          className="self-end flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors ml-auto"
        >
          <Download className="w-3.5 h-3.5" />
          엑셀 다운로드
        </button>
      </div>

      {/* 주문 목록 */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 whitespace-nowrap w-10"></th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 whitespace-nowrap">주문번호</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 whitespace-nowrap">신청자명</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 whitespace-nowrap">신청일시</th>
                <th className="text-center px-4 py-3 font-semibold text-zinc-600 whitespace-nowrap">총 학점</th>
                <th className="text-right px-4 py-3 font-semibold text-zinc-600 whitespace-nowrap">총 금액</th>
                <th className="text-center px-4 py-3 font-semibold text-zinc-600 whitespace-nowrap">상태</th>
                <th className="text-center px-4 py-3 font-semibold text-zinc-600 whitespace-nowrap w-[120px]">상태 변경</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-zinc-400">로딩 중...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-zinc-400">주문 내역이 없습니다.</td></tr>
              ) : (
                orders.map((o) => {
                  const isExpanded = expandedId === o.id;
                  return (
                    <OrderRow
                      key={o.id}
                      order={o}
                      isExpanded={isExpanded}
                      loadingItems={loadingItems[o.id] ?? false}
                      orderItems={orderItems[o.id] ?? []}
                      onToggle={() => toggleExpand(o.id)}
                      onStatusChange={(s) => handleStatusChange(o.id, s)}
                    />
                  );
                })
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
    </div>
  );
}

function OrderRow({
  order,
  isExpanded,
  loadingItems,
  orderItems,
  onToggle,
  onStatusChange,
}: {
  order: Order;
  isExpanded: boolean;
  loadingItems: boolean;
  orderItems: OrderItem[];
  onToggle: () => void;
  onStatusChange: (status: string) => void;
}) {
  const statusOptions = ["completed", "cancelled"];
  const currentStatus = order.status;

  return (
    <Fragment>
      <tr
        className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-4 py-3 text-center">
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-zinc-400 inline-block" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 inline-block" />
          )}
        </td>
        <td className="px-4 py-3 font-mono text-zinc-700 whitespace-nowrap">{order.id.slice(0, 8)}</td>
        <td className="px-4 py-3 text-zinc-800 whitespace-nowrap">{order.user_name}</td>
        <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">{formatDate(order.ordered_at)}</td>
        <td className="px-4 py-3 text-center text-zinc-700">{order.total_credits}</td>
        <td className="px-4 py-3 text-right text-zinc-700 tabular-nums">{order.total_price.toLocaleString()}</td>
        <td className="px-4 py-3 text-center">
          <span className={`inline-block px-2 py-0.5 text-[11px] font-medium border rounded-lg ${STATUS_COLOR[order.status] ?? "text-zinc-500 bg-zinc-50 border-zinc-200"}`}>
            {STATUS_LABEL[order.status] ?? order.status}
          </span>
        </td>
        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
          <select
            value={currentStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-2 py-1 text-[12px] bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-zinc-400 cursor-pointer"
          >
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>
                {STATUS_LABEL[opt] ?? opt}
              </option>
            ))}
          </select>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={8} className="bg-zinc-50/80 px-4 py-3">
            {loadingItems ? (
              <p className="text-[12px] text-zinc-400 text-center py-2">로딩 중...</p>
            ) : orderItems.length === 0 ? (
              <p className="text-[12px] text-zinc-400 text-center py-2">주문 항목이 없습니다.</p>
            ) : (
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="text-left px-3 py-1.5 font-medium text-zinc-500">교과목명</th>
                    <th className="text-left px-3 py-1.5 font-medium text-zinc-500">교수명</th>
                    <th className="text-center px-3 py-1.5 font-medium text-zinc-500">학점</th>
                    <th className="text-right px-3 py-1.5 font-medium text-zinc-500">수강가격</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item) => (
                    <tr key={item.id} className="border-b border-zinc-100">
                      <td className="px-3 py-1.5 text-zinc-700">{item.course_name}</td>
                      <td className="px-3 py-1.5 text-zinc-500">{item.professor}</td>
                      <td className="px-3 py-1.5 text-center text-zinc-700">{item.credits}</td>
                      <td className="px-3 py-1.5 text-right text-zinc-700 tabular-nums">{item.price.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}
    </Fragment>
  );
}
