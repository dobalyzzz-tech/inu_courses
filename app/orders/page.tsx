"use client";

import { useAuth } from "@/components/providers/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { ClipboardList, ArrowLeft, ShoppingCart, BookOpen, GraduationCap, DollarSign, CreditCard, X, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type OrderItem = {
  course_id: number;
  course_name: string;
  professor: string | null;
  credits: number;
  price: number;
};

type Order = {
  id: string;
  ordered_at: string;
  total_credits: number;
  total_price: number;
  status: string;
  order_items: OrderItem[];
};

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courseModalLoading, setCourseModalLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("id, ordered_at, total_credits, total_price, status")
          .eq("user_id", user.id)
          .order("ordered_at", { ascending: false });

        if (ordersError) throw ordersError;

        if (ordersData && ordersData.length > 0) {
          const orderIds = ordersData.map((o) => o.id);
          const { data: itemsData, error: itemsError } = await supabase
            .from("order_items")
            .select("order_id, course_id, course_name, professor, credits, price")
            .in("order_id", orderIds);

          if (itemsError) throw itemsError;

          const itemsByOrderId: Record<string, OrderItem[]> = {};
          (itemsData || []).forEach((item) => {
            if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
            itemsByOrderId[item.order_id].push(item);
          });

          const merged = ordersData.map((order) => ({
            ...order,
            order_items: itemsByOrderId[order.id] || [],
          }));

          setOrders(merged);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error("주문내역 조회 오류:", err);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const openCourseModal = async (courseId: number) => {
    setCourseModalLoading(true);
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("순번", courseId)
        .single();

      if (error) throw error;
      setSelectedCourse(data);
    } catch (err) {
      console.error("교과목 조회 오류:", err);
    } finally {
      setCourseModalLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("정말 이 주문내역을 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId)
        .eq("user_id", user?.id);

      if (error) throw error;

      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      console.error("주문 삭제 오류:", err);
      alert("주문 삭제에 실패했습니다.");
    }
  };

  if (loading || ordersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const formatCurrency = (val: number) => (val ? val.toLocaleString() + "원" : "무료");

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending": return "bg-amber-50 text-amber-700 border-amber-200";
      case "cancelled": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-zinc-50 text-zinc-600 border-zinc-200";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "completed": return "신청완료";
      case "pending": return "대기중";
      case "cancelled": return "취소됨";
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-8 pt-28 pb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-800 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          메인으로 돌아가기
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-8">
        {/* Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-indigo-50 rounded-xl">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">수강신청 내역</h1>
            <p className="text-sm font-medium text-zinc-500 mt-0.5">
              인천대학교 교양 과목 수강신청 내역을 확인하세요.
            </p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-16 text-center">
            <div className="w-20 h-20 bg-zinc-50 border border-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <ClipboardList className="w-8 h-8 text-zinc-300" />
            </div>
            <h3 className="text-lg font-bold text-zinc-800 mb-2">아직 수강신청 내역이 없습니다</h3>
            <p className="text-sm text-zinc-400 mb-6 max-w-xs mx-auto">
              교과목을 장바구니에 담고 수강 신청해보세요!
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              교과목 둘러보기
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
              >
                {/* Card Header */}
                <div className="px-6 py-4 bg-zinc-50/50 border-b border-zinc-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">주문번호</span>
                      <p className="text-sm font-bold text-zinc-800 font-mono mt-0.5">
                        {order.id.slice(0, 8)}
                      </p>
                    </div>
                    <div className="w-px h-8 bg-zinc-200" />
                    <div>
                      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">신청일시</span>
                      <p className="text-sm font-semibold text-zinc-700 mt-0.5">
                        {formatDateTime(order.ordered_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-full border ${statusBadge(order.status)}`}
                    >
                      {statusLabel(order.status)}
                    </span>
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200"
                      title="주문 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Card Body: Items */}
                <div className="px-6 py-4 divide-y divide-zinc-50">
                  {order.order_items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => openCourseModal(item.course_id)}
                          className="text-left"
                        >
                          <p className="text-sm font-bold text-zinc-900 hover:text-indigo-600 transition-colors truncate">
                            {item.course_name}
                          </p>
                        </button>
                        <p className="text-xs text-zinc-500 mt-0.5 font-medium">
                          {item.professor || "미정"} 교수
                        </p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 ml-4">
                        <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-zinc-400" />
                          {item.credits}학점
                        </span>
                        <span className="text-xs font-bold text-indigo-600 w-20 text-right">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Card Footer */}
                <div className="px-6 py-4 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                      총 <strong className="text-zinc-800">{order.total_credits}</strong>학점
                    </span>
                    <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
                      총 <strong className="text-indigo-600">{formatCurrency(order.total_price)}</strong>
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-300 font-mono">
                    #{order.id.slice(0, 8)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Course Detail Modal (no cart button) */}
      {selectedCourse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setSelectedCourse(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 bg-zinc-50/50">
              <h2 className="text-xl font-bold text-zinc-900 pr-8">
                {selectedCourse["교과목명"]}{" "}
                <span className="text-sm font-normal text-zinc-500 ml-2">{selectedCourse["학수번호"]}</span>
              </h2>
              <button
                onClick={() => setSelectedCourse(null)}
                className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors absolute right-4 top-4"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {courseModalLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-zinc-300 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                  <DetailItem label="이수구분" value={selectedCourse["이수구분"]} />
                  <DetailItem label="이수영역" value={selectedCourse["이수영역"]} />
                  <DetailItem label="교과목명(영문)" value={selectedCourse["교과목명(영문)"]} />
                  <DetailItem label="담당교수" value={selectedCourse["담당교수"]} />
                  <DetailItem label="강의실" value={selectedCourse["강의실"]} />
                  <DetailItem label="시간표(교시)" value={selectedCourse["시간표(교시)"]} />
                  <DetailItem label="시간표(시간)" value={selectedCourse["시간표(시간)"]} />
                  <DetailItem label="수강가격" value={formatCurrency(selectedCourse["수강가격"])} highlight />
                  <DetailItem label="단가" value={formatCurrency(selectedCourse["단가"])} />
                  <DetailItem label="학점 / 시수" value={`${selectedCourse["학점"] || 0}학점 / ${selectedCourse["시수"] || 0}시수`} />
                  <DetailItem label="이론 / 실습" value={`이론 ${selectedCourse["이론"] || 0} / 실습 ${selectedCourse["실습"] || 0}`} />
                  <DetailItem label="정원" value={`${selectedCourse["정원"] || 0}명`} />
                  <DetailItem label="성적평가" value={selectedCourse["성적평가"]} />
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex justify-end">
              <button
                onClick={() => setSelectedCourse(null)}
                className="px-5 py-2.5 text-sm font-semibold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-xl transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value, highlight = false }: { label: string; value: string | number | null | undefined; highlight?: boolean }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium text-zinc-500 mb-1">{label}</span>
      <span className={`text-[15px] ${highlight ? "font-bold text-indigo-600" : "font-medium text-zinc-900"}`}>{value}</span>
    </div>
  );
}
