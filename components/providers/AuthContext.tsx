"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { User, AuthChangeEvent, Session } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  cartItems: any[];
  cartCount: number;
  addToCart: (course: any) => Promise<boolean>;
  removeFromCart: (courseId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isInCart: (courseId: number) => boolean;
  totalCredits: number;
  totalPrice: number;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function handleUserSync(event: AuthChangeEvent, session: Session | null, onUser: (u: User | null) => void) {
  const currentUser = session?.user ?? null;
  onUser(currentUser);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const initializedRef = useRef(false);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const forceResolveLoading = () => {
    setLoading(false);
  };

  const safeResolveLoading = () => {
    setLoading(false);
  };

  const loadCart = async (userId: string) => {
    try {
      const { data: cartData, error: cartError } = await supabase
        .from("cart_items")
        .select("course_id")
        .eq("user_id", userId);

      if (cartError) {
        console.error("장바구니 조회 실패:", cartError);
        return;
      }

      if (cartData && cartData.length > 0) {
        const courseIds = cartData.map((item) => item.course_id);
        const { data: coursesData, error: coursesError } = await supabase
          .from("courses")
          .select("*")
          .in("순번", courseIds);

        if (coursesError) {
          console.error("교과목 정보 조회 실패:", coursesError);
          return;
        }
        setCartItems(coursesData || []);
      } else {
        setCartItems([]);
      }
    } catch (err) {
      console.error("장바구니 조회 에러:", err);
    }
  };

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    setLoading(true);

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        loadCart(currentUser.id).then(() => {
          safeResolveLoading();
        });
      } else {
        safeResolveLoading();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (event === "SIGNED_IN" && currentUser) {
        setLoading(true);
        loadCart(currentUser.id).then(() => {
          safeResolveLoading();
        });

        const fullName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || "";
        const avatarUrl = currentUser.user_metadata?.avatar_url || "";
        (async () => {
          const { error: upsertError } = await supabase.from("users").upsert(
            { id: currentUser.id, email: currentUser.email, full_name: fullName, avatar_url: avatarUrl, updated_at: new Date().toISOString() },
            { onConflict: "id" }
          );
          if (upsertError) console.warn("users 테이블 동기화 실패:", upsertError);
        })();
      } else if (event === "SIGNED_OUT") {
        setCartItems([]);
        safeResolveLoading();
      } else if (currentUser) {
        loadCart(currentUser.id);
      }
    });

    // Safety timeout: force loading to false after 10s no matter what
    loadingTimeoutRef.current = setTimeout(() => {
      setLoading(false);
    }, 10000);

    return () => {
      subscription.unsubscribe();
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  const addToCart = async (course: any): Promise<boolean> => {
    if (!user) return false;

    try {
      if (cartItems.some((item) => item["순번"] === course["순번"])) {
        return false;
      }

      const { error } = await supabase
        .from("cart_items")
        .insert({ user_id: user.id, course_id: course["순번"] });

      if (error) {
        if (error.code === "23505") return false;
        return false;
      }

      setCartItems((prev) => [...prev, course]);
      return true;
    } catch {
      return false;
    }
  };

  const removeFromCart = async (courseId: number) => {
    if (!user) return;

    try {
      await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .eq("course_id", courseId);

      setCartItems((prev) => prev.filter((item) => item["순번"] !== courseId));
    } catch (err) {
      console.error("장바구니 삭제 오류:", err);
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);

      setCartItems([]);
    } catch (err) {
      console.error("장바구니 비우기 오류:", err);
    }
  };

  const isInCart = (courseId: number) => {
    return cartItems.some((item) => item["순번"] === courseId);
  };

  const cartCount = cartItems.length;
  const totalCredits = cartItems.reduce((sum, item) => sum + (Number(item["학점"]) || 0), 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + (Number(item["수강가격"]) || 0), 0);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    try {
      await fetch("/auth/signout", { method: "POST" });
    } catch (err) {
      console.error("서버 로그아웃 API 호출 실패:", err);
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("Supabase signOut error:", error);
    } catch (err) {
      console.error("Supabase signOut exception:", err);
    }

    if (typeof window !== "undefined") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        if (name.includes("auth-token") || name.startsWith("sb-")) {
          document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        }
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, signInWithGoogle, signOut,
      cartItems, cartCount, addToCart, removeFromCart, clearCart, isInCart,
      totalCredits, totalPrice
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
