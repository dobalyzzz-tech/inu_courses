"use client";

import { useAuth } from "@/components/providers/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const { user, loading, clearCart } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const processedRef = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/");
      return;
    }

    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");

    if (!paymentKey || !orderId || !amount) {
      setStatus("error");
      setMessage("결제 정보가 올바르지 않습니다.");
      return;
    }

    const confirmPayment = async () => {
      if (processedRef.current) return;
      processedRef.current = true;
      try {
        // sessionStorage에서 장바구니 데이터 읽기
        const cartItemsStr = sessionStorage.getItem("pending_cart_items");
        const totalCreditsStr = sessionStorage.getItem("pending_total_credits");

        if (!cartItemsStr || !totalCreditsStr) {
          setStatus("error");
          setMessage("장바구니 정보를 불러올 수 없습니다. 기초교육원으로 문의해주세요.");
          return;
        }

        const cartItems = JSON.parse(cartItemsStr);
        const totalCredits = parseInt(totalCreditsStr, 10);

        // 결제 승인은 토스 SDK에서 이미 완료됨 (requestPayment success → 리다이렉트)
        // Supabase에 주문 저장
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            user_id: user.id,
            total_credits: totalCredits,
            total_price: parseInt(amount, 10),
            status: "completed",
            toss_payment_key: paymentKey,
            toss_order_id: orderId,
          })
          .select("id")
          .single();

        if (orderError) throw new Error("주문 생성에 실패했습니다.");

        const orderItems = cartItems.map((item: any) => ({
          order_id: order.id,
          course_id: item["순번"],
          course_name: item["교과목명"],
          professor: item["담당교수"] || null,
          credits: Number(item["학점"]) || 0,
          price: Number(item["수강가격"]) || 0,
        }));

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItems);

        if (itemsError) {
          await supabase.from("orders").delete().eq("id", order.id);
          throw new Error("주문 항목 저장에 실패했습니다.");
        }

        // 장바구니 비우기 (클라이언트 상태)
        await clearCart();

        // sessionStorage 정리
        sessionStorage.removeItem("pending_cart_items");
        sessionStorage.removeItem("pending_total_credits");
        sessionStorage.removeItem("pending_order_id");

        setStatus("success");
        setMessage("수강 신청이 완료되었습니다!");

        setTimeout(() => {
          router.push("/orders");
        }, 1500);
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "결제 처리에 실패했습니다. 기초교육원으로 문의해주세요.");
      }
    };

    confirmPayment();
  }, [loading, user, searchParams, router, clearCart]);

  return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4">
      <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-sm w-full max-w-md p-10 text-center">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 mb-2">결제를 처리하고 있습니다...</h2>
            <p className="text-sm text-zinc-500">잠시만 기다려 주세요.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 mb-2">수강 신청이 완료되었습니다!</h2>
            <p className="text-sm text-zinc-500 mb-6">{message}</p>
            <p className="text-xs text-zinc-400">잠시 후 주문내역 페이지로 이동합니다.</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 mb-2">결제 처리에 실패했습니다</h2>
            <p className="text-sm text-zinc-500 mb-6">{message}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm"
            >
              메인으로 돌아가기
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
