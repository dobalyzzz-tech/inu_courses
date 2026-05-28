"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { User, LogIn, LogOut, X, ChevronDown, ShoppingCart, Trash2, Loader2, ExternalLink, ClipboardList, CheckCircle, AlertCircle, CreditCard as CreditCardIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginWidget() {
  const { user, loading, signInWithGoogle, signOut, cartItems, cartCount, totalCredits, totalPrice, removeFromCart, clearCart } = useAuth();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payerName, setPayerName] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [payerNameError, setPayerNameError] = useState("");
  const [payerEmailError, setPayerEmailError] = useState("");

  const handleRegister = () => {
    if (!user || cartItems.length === 0) return;
    const savedName = localStorage.getItem("payer_name") || user.user_metadata?.full_name || user.user_metadata?.name || "";
    const savedEmail = localStorage.getItem("payer_email") || user.email || "";
    setPayerName(savedName);
    setPayerEmail(savedEmail);
    setPayerNameError("");
    setPayerEmailError("");
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

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch {
      setIsSigningIn(false);
    }
  };

  const handleLogout = () => {
    setIsProfileOpen(false);
    // 서버 로그아웃 라우트로 이동하여 확실하게 세션 쿠키를 비우고 리다이렉트 처리합니다.
    window.location.href = "/auth/signout";
  };

  const formatCurrency = (val: number) => val ? val.toLocaleString() + "원" : "무료";

  const avatarUrl = user?.user_metadata?.avatar_url;
  const fullName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "사용자";

  if (loading) {
    return (
      <div className="fixed top-[22px] right-4 lg:top-[26px] lg:right-8 z-[60] flex gap-3">
        <div className="w-10 h-10 bg-zinc-100 rounded-full animate-pulse shadow-sm" />
        <div className="w-10 h-10 lg:w-32 lg:h-11 bg-zinc-100 rounded-full animate-pulse shadow-sm" />
      </div>
    );
  }

  return (
    <>
      {/* Header Actions: Cart + Login/Profile */}
      <div className="fixed top-[22px] right-4 lg:top-[26px] lg:right-8 z-[60] flex items-center gap-3">

        {/* Orders Button */}
        {user ? (
          <Link
            href="/orders"
            className="flex items-center gap-2 bg-white/90 backdrop-blur-md border border-zinc-200/80 hover:border-zinc-300 hover:bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 rounded-full h-10 px-4 text-zinc-700 font-semibold text-xs lg:text-sm active:scale-95 select-none"
          >
            <ClipboardList className="w-4 h-4 text-zinc-600" />
            <span className="hidden sm:inline">주문내역</span>
          </Link>
        ) : (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-white/90 backdrop-blur-md border border-zinc-200/80 hover:border-zinc-300 hover:bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 rounded-full h-10 px-4 text-zinc-700 font-semibold text-xs lg:text-sm active:scale-95 select-none"
          >
            <ClipboardList className="w-4 h-4 text-zinc-600" />
            <span className="hidden sm:inline">주문내역</span>
          </button>
        )}

        {/* Cart Button */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="flex items-center gap-2 bg-white/90 backdrop-blur-md border border-zinc-200/80 hover:border-zinc-300 hover:bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 rounded-full h-10 px-4 text-zinc-700 font-semibold text-xs lg:text-sm active:scale-95 select-none"
        >
          <div className="relative">
            <ShoppingCart className="w-4 h-4 text-zinc-600" />
            {cartItems.length > 0 && (
              <span className="absolute -top-2.5 -right-2.5 bg-indigo-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                {cartItems.length}
              </span>
            )}
          </div>
          <span className="hidden sm:inline">장바구니</span>
        </button>

        {/* Login / Profile */}
        {user ? (
          <div className="relative select-none">
            {/* Click-away overlay */}
            {isProfileOpen && (
              <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
            )}
            <button
              onClick={() => setIsProfileOpen((p) => !p)}
              className="flex items-center gap-2 bg-white/90 backdrop-blur-md border border-zinc-200/80 hover:border-zinc-300 hover:bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 rounded-full p-1 lg:pl-1 lg:pr-4 lg:py-1 text-zinc-700 font-medium text-xs lg:text-sm"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-200/50 shadow-sm shrink-0 bg-gradient-to-tr from-indigo-50 to-purple-50 flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-zinc-500" />
                )}
              </div>
              <span className="hidden lg:inline max-w-[100px] truncate">{fullName}님</span>
              <ChevronDown className={`hidden lg:block w-3.5 h-3.5 text-zinc-400 transition-transform duration-300 ${isProfileOpen ? "rotate-180" : ""}`} />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-full pt-2 z-50">
                <div className="w-48 bg-white/95 backdrop-blur-xl border border-zinc-200/60 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] p-2 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 border-b border-zinc-100 mb-1">
                    <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">로그인 정보</p>
                    <p className="text-xs text-zinc-800 font-semibold truncate mt-0.5">{fullName}님</p>
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { setIsProfileOpen(false); alert("내 정보 관리 기능은 준비 중입니다."); }}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-colors font-medium flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-zinc-400" />내 정보 관리
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50/50 rounded-xl transition-colors font-medium flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />로그아웃
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-zinc-900/90 hover:bg-zinc-900 text-white shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_25px_rgba(0,0,0,0.15)] hover:scale-[1.02] transition-all duration-300 rounded-full h-10 px-4 justify-center"
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden lg:inline text-sm font-semibold tracking-wide">로그인</span>
          </button>
        )}
      </div>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]"
            onClick={() => { if (!isRegistering) setIsCartOpen(false); }}
          />
          <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl border-l border-zinc-200/80 shadow-2xl h-screen flex flex-col z-[101] animate-in slide-in-from-right duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 bg-zinc-50/50">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-zinc-900">장바구니</h2>
                <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">{cartItems.length}개 과목</span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                disabled={isRegistering}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 bg-zinc-50 border border-zinc-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                    <ShoppingCart className="w-6 h-6 text-zinc-300" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-800">장바구니가 비어 있습니다</p>
                  <p className="text-xs text-zinc-400 mt-1.5 max-w-[200px]">관심 있는 강의를 찾아 장바구니에 담아보세요!</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item["순번"]} className="border border-zinc-100 bg-zinc-50/50 hover:bg-white rounded-2xl p-4 flex gap-4 transition-all duration-300 shadow-sm hover:shadow-md">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-zinc-900 truncate">{item["교과목명"]}</h4>
                      <p className="text-xs text-zinc-500 mt-1 font-medium">{item["담당교수"] || "미정"} 교수 | {item["이수구분"]}</p>
                      <div className="flex items-center gap-3 mt-3 text-[11px] font-semibold text-zinc-400">
                        <span>{item["학점"]}학점</span><span>•</span>
                        <span className="text-indigo-600">{formatCurrency(item["수강가격"])}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item["순번"])}
                      disabled={isRegistering}
                      className="self-center p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="p-6 border-t border-zinc-100 bg-zinc-50/50">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs text-zinc-500 font-semibold">
                    <span>총 신청 학점</span><span className="text-zinc-800">{totalCredits}학점</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-zinc-100 text-sm font-bold text-zinc-900">
                    <span>총 수강 가격</span>
                    <span className="text-lg text-indigo-600 font-extrabold">{formatCurrency(totalPrice)}</span>
                  </div>
                </div>
                <Link
                  href="/cart"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 text-zinc-700 font-semibold py-3 rounded-2xl text-sm transition-all duration-200 flex items-center justify-center gap-2 mb-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  장바구니 페이지로 이동
                </Link>
                <button
                  onClick={handleRegister}
                  disabled={isRegistering}
                  className="w-full bg-zinc-900 hover:bg-black disabled:bg-zinc-200 text-white disabled:text-zinc-400 py-4 rounded-2xl font-bold text-sm transition-all duration-300 shadow-md flex items-center justify-center gap-2"
                >
                  {isRegistering ? (
                    <><Loader2 className="w-4 h-4 animate-spin text-zinc-400" /><span>수강신청 처리 중...</span></>
                  ) : (
                    <span>수강신청 하기 ({cartItems.length}건)</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Login Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[4px]"
            onClick={() => { if (!isSigningIn) setIsModalOpen(false); }}
          />
          <div className="relative bg-white/95 backdrop-blur-xl border border-zinc-200/50 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-full max-w-sm overflow-hidden flex flex-col p-8 sm:p-10 animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
            {!isSigningIn && (
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-6 top-6 p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <div className="flex flex-col items-center mt-2 mb-6">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border border-zinc-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-white flex items-center justify-center p-1">
                <img src="/Mascot.jpg" alt="INU Mascot" className="w-full h-full object-cover rounded-xl" />
              </div>
            </div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-extrabold text-zinc-950 tracking-tight">INU Courses Market</h2>
              <p className="text-sm font-medium text-zinc-500 mt-2">구글 계정으로 간편하게 로그인하세요.</p>
            </div>
            <button
              onClick={handleGoogleLogin}
              disabled={isSigningIn}
              className="w-full bg-white hover:bg-zinc-50 disabled:bg-zinc-100 text-zinc-700 hover:text-zinc-900 border border-zinc-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 font-semibold text-sm py-4 flex items-center justify-center gap-3 active:scale-[0.99]"
            >
              {isSigningIn ? (
                <div className="w-5 h-5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Google 계정으로 로그인</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

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

      {/* Payment Info Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
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
    </>
  );
}
