"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, ShoppingCart } from "lucide-react";

export default function PaymentFailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showToast, setShowToast] = useState(true);

  useEffect(() => {
    const message = searchParams.get("message") || "알 수 없는 오류가 발생했습니다.";
    const code = searchParams.get("code");
    const orderId = searchParams.get("orderId");

    console.error("결제 실패:", { code, message, orderId });

    // 토스트 3초 후 자동 숨김
    const toastTimer = setTimeout(() => {
      setShowToast(false);
    }, 3000);

    // 3.5초 후 /cart로 이동
    const redirectTimer = setTimeout(() => {
      router.replace("/cart");
    }, 3500);

    return () => {
      clearTimeout(toastTimer);
      clearTimeout(redirectTimer);
    };
  }, [searchParams, router]);

  const failMessage = searchParams.get("message") || "알 수 없는 오류가 발생했습니다.";

  return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border backdrop-blur-xl bg-red-50/95 border-red-200/60 text-red-800">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span className="text-sm font-semibold">
              결제에 실패했습니다: {failMessage}
            </span>
          </div>
        </div>
      )}

      {/* Center Content */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm w-full max-w-md p-10 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900 mb-2">결제에 실패했습니다</h2>
        <p className="text-sm text-zinc-500 mb-8 max-w-xs mx-auto">
          {failMessage}
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
          <ShoppingCart className="w-4 h-4 animate-pulse" />
          <span>잠시 후 장바구니로 돌아갑니다...</span>
        </div>
      </div>
    </div>
  );
}
