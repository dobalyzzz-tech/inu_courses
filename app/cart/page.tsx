"use client";

import { useAuth } from "@/components/providers/AuthContext";
import { ShoppingCart, Trash2, ArrowLeft, X, CreditCard, BookOpen, GraduationCap, DollarSign, ClipboardList, CheckCircle, AlertCircle, CreditCard as CreditCardIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function CartPage() {
  const { user, loading, cartItems, cartCount, totalCredits, totalPrice, removeFromCart, clearCart } = useAuth();
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payerName, setPayerName] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [payerNameError, setPayerNameError] = useState("");
  const [payerEmailError, setPayerEmailError] = useState("");

  useEffect(() => {
    if (user) {
      // localStorage에 저장된 정보가 있으면 우선 사용, 없으면 Google 계정 정보 사용
      const savedName = localStorage.getItem("payer_name");
      const savedEmail = localStorage.getItem("payer_email");
      const name = savedName || user.user_metadata?.full_name || user.user_metadata?.name || "";
      const email = savedEmail || user.email || "";
      setPayerName(name);
      setPayerEmail(email);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const formatCurrency = (val: number) => (val ? val.toLocaleString() + "원" : "무료");

  const handleRegister = () => {
    if (!user || cartItems.length === 0) return;
    setShowPaymentModal(true);
  };

  const handleProceedToPayment = async () => {
    if (!user) return;
    const currentUser = user;
    let valid = true;
    setPayerNameError("");
    setPayerEmailError("");

    if (!payerName.trim()) {
      setPayerNameError("이름을 입력해 주세요.");
      valid = false;
    }

    if (!payerEmail.trim()) {
      setPayerEmailError("이메일을 입력해 주세요.");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerEmail)) {
      setPayerEmailError("올바른 이메일 형식이 아닙니다.");
      valid = false;
    }

    if (!valid) return;

    // 입력 정보 localStorage에 저장
    localStorage.setItem("payer_name", payerName.trim());
    localStorage.setItem("payer_email", payerEmail.trim());

    setShowPaymentModal(false);
    setIsRegistering(true);

    try {
      const tossPayments = await import("@tosspayments/tosspayments-sdk").then(
        (m) => m.loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!)
      );

      const orderId = "INU-" + Date.now();

      // 결제 전 장바구니 데이터를 sessionStorage에 저장 (success 페이지에서 사용)
      sessionStorage.setItem("pending_cart_items", JSON.stringify(cartItems));
      sessionStorage.setItem("pending_total_credits", String(totalCredits));
      sessionStorage.setItem("pending_order_id", orderId);

      const payment: any = tossPayments.payment({ customerKey: currentUser.id });

      await payment.requestPayment({
        method: "CARD",
        amount: { value: totalPrice, currency: "KRW" },
        orderId: orderId,
        orderName: "인천대학교 기초교육원 교양 교과목 결제",
        customerName: payerName.trim(),
        customerEmail: payerEmail.trim(),
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        windowTarget: "self",
      });

      setIsRegistering(false);
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "결제창을 불러오지 못했습니다." });
      console.error("결제 오류:", err);
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-2 duration-300">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border backdrop-blur-xl ${
              toast.type === "success"
                ? "bg-emerald-50/95 border-emerald-200/60 text-emerald-800"
                : "bg-red-50/95 border-red-200/60 text-red-800"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            )}
            <span className="text-sm font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-8 pt-28 pb-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-800 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            교과목 둘러보기
          </Link>
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-indigo-600 transition-colors"
          >
            <ClipboardList className="w-4 h-4" />
            주문내역
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Course List */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-indigo-50 rounded-xl">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">장바구니</h1>
                <p className="text-sm font-medium text-zinc-500 mt-0.5">
                  총 {cartItems.length}개의 교과목이 담겨 있습니다
                </p>
              </div>
            </div>

            {cartItems.length === 0 ? (
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-16 text-center">
                <div className="w-20 h-20 bg-zinc-50 border border-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <ShoppingCart className="w-8 h-8 text-zinc-300" />
                </div>
                <h3 className="text-lg font-bold text-zinc-800 mb-2">아직 담긴 교과목이 없습니다</h3>
                <p className="text-sm text-zinc-400 mb-6 max-w-xs mx-auto">
                  관심 있는 강의를 찾아 장바구니에 담아보세요!
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm"
                >
                  <BookOpen className="w-4 h-4" />
                  교과목 둘러보기
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item: any) => (
                  <div
                    key={item["순번"]}
                    className="bg-white border border-zinc-200/80 rounded-2xl p-5 flex gap-5 transition-all duration-300 shadow-sm hover:shadow-md hover:border-zinc-300 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="bg-zinc-100 text-zinc-700 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                          {item["이수구분"]}
                        </span>
                        {item["이수영역"] && (
                          <span className="bg-indigo-50 text-indigo-700 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                            {item["이수영역"]}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedCourse(item)}
                        className="text-left"
                      >
                        <h3 className="text-[17px] font-bold text-zinc-900 hover:text-indigo-600 transition-colors leading-snug">
                          {item["교과목명"]}
                        </h3>
                      </button>
                      <p className="text-sm text-zinc-500 mt-1 font-medium">
                        {item["담당교수"] || "미정"} 교수
                      </p>
                      <div className="flex items-center gap-4 mt-4 text-[13px] text-zinc-500">
                        <span className="flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-zinc-400" />
                          {item["시간표(교시)"] || item["시간표(시간)"] || "시간 미정"}
                        </span>
                        <span className="text-zinc-300">|</span>
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                          {item["학점"]}학점
                        </span>
                        <span className="text-zinc-300">|</span>
                        <span className="flex items-center gap-1.5 text-indigo-600 font-bold">
                          <DollarSign className="w-3.5 h-3.5" />
                          {formatCurrency(item["수강가격"])}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item["순번"])}
                      className="self-start p-2.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Summary */}
          {cartItems.length > 0 && (
            <div className="lg:w-[360px] shrink-0">
              <div className="lg:sticky lg:top-28 bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-zinc-100">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-bold text-zinc-900">수강 신청 요약</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 font-medium">담긴 교과목</span>
                    <span className="font-bold text-zinc-800">{cartItems.length}개</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 font-medium">총 학점</span>
                    <span className="font-bold text-zinc-800">{totalCredits}학점</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-t border-zinc-100">
                    <span className="text-base font-semibold text-zinc-700">총 수강가격</span>
                    <span className="text-xl font-extrabold text-indigo-600">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleRegister}
                    disabled={isRegistering}
                    className="w-full bg-zinc-900 hover:bg-black disabled:bg-zinc-200 text-white disabled:text-zinc-400 py-4 rounded-2xl font-bold text-sm transition-all duration-300 shadow-md flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    {isRegistering ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        수강신청 처리 중...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        수강 신청하기 ({cartItems.length}건)
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("정말 장바구니를 비우시겠습니까?")) clearCart();
                    }}
                    className="w-full bg-white hover:bg-rose-50 border border-zinc-200 hover:border-rose-200 text-zinc-500 hover:text-rose-600 py-3 rounded-xl font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    전체 삭제
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Course Detail Modal */}
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

      {/* Payment Info Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setShowPaymentModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Step Indicator */}
            <div className="px-6 pt-5 pb-3 bg-zinc-50/50 border-b border-zinc-100">
              <div className="flex items-center justify-center gap-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">1</div>
                  <span className="text-[11px] font-semibold text-indigo-600">정보입력</span>
                </div>
                <div className="w-8 h-px bg-indigo-300 mx-1" />
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-zinc-200 text-zinc-500 text-[11px] font-bold flex items-center justify-center">2</div>
                  <span className="text-[11px] font-semibold text-zinc-400">결제</span>
                </div>
                <div className="w-8 h-px bg-zinc-200 mx-1" />
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-zinc-200 text-zinc-500 text-[11px] font-bold flex items-center justify-center">3</div>
                  <span className="text-[11px] font-semibold text-zinc-400">완료</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <CreditCardIcon className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-zinc-900">결제자 정보 입력</h2>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* 결제 금액 */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-700">결제 금액</span>
                <span className="text-xl font-extrabold text-indigo-600">{formatCurrency(totalPrice)}</span>
              </div>

              {/* 주문 상품 검토 */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">주문 상품</h3>
                <div className="space-y-2">
                  {cartItems.slice(0, 5).map((item: any) => (
                    <div key={item["순번"]} className="flex items-center justify-between py-1.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-800 truncate">{item["교과목명"]}</p>
                        <p className="text-[11px] text-zinc-400">{item["담당교수"] || "미정"} 교수 · {item["학점"]}학점</p>
                      </div>
                      <span className="text-xs font-semibold text-indigo-600 shrink-0 ml-3">{formatCurrency(item["수강가격"])}</span>
                    </div>
                  ))}
                  {cartItems.length > 5 && (
                    <p className="text-[11px] text-zinc-400 text-center pt-1">외 {cartItems.length - 5}건</p>
                  )}
                </div>
              </div>

              {/* 입력 필드 */}
              <div className="pt-2 space-y-4">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">결제자 정보</h3>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5">이름</label>
                  <input
                    type="text"
                    value={payerName}
                    onChange={(e) => {
                      setPayerName(e.target.value);
                      if (payerNameError) setPayerNameError("");
                    }}
                    placeholder="이름을 입력해 주세요"
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-colors ${
                      payerNameError
                        ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                        : "border-zinc-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    }`}
                  />
                  {payerNameError && (
                    <p className="text-xs text-red-500 font-medium mt-1.5 ml-1">{payerNameError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5">이메일</label>
                  <input
                    type="email"
                    value={payerEmail}
                    onChange={(e) => {
                      setPayerEmail(e.target.value);
                      if (payerEmailError) setPayerEmailError("");
                    }}
                    placeholder="이메일을 입력해 주세요"
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-colors ${
                      payerEmailError
                        ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                        : "border-zinc-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    }`}
                  />
                  {payerEmailError && (
                    <p className="text-xs text-red-500 font-medium mt-1.5 ml-1">{payerEmailError}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-5 py-2.5 text-sm font-semibold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-xl transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleProceedToPayment}
                className="px-5 py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-sm flex items-center gap-2"
              >
                <CreditCardIcon className="w-4 h-4" />
                {formatCurrency(totalPrice)} 결제하기
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
