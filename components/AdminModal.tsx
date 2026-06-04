"use client";

import { useEffect, useState, useCallback } from "react";

const ADMIN_PASSWORD = "rlchrydbrdnjs";

export default function AdminModal() {
  const [show, setShow] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const openModal = useCallback(() => {
    setShow(true);
    setPassword("");
    setError("");
  }, []);

  const closeModal = useCallback(() => {
    setShow(false);
    setPassword("");
    setError("");
  }, []);

  useEffect(() => {
    const handler = () => openModal();
    window.addEventListener("open-admin-modal", handler);
    return () => window.removeEventListener("open-admin-modal", handler);
  }, [openModal]);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("adminAuth", "true");
      closeModal();
      window.location.href = "/admin";
    } else {
      setError("비밀번호가 올바르지 않습니다.");
    }
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={closeModal}
    >
      <div
        className="bg-[#1c1c1c] border border-zinc-700/60 rounded-2xl p-6 w-[280px] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[15px] font-semibold text-zinc-100 mb-1.5 text-center">관리자 인증</h3>
        <p className="text-[11px] text-zinc-500 mb-4 text-center">관리자 비밀번호를 입력하세요.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleLogin();
          }}
          placeholder="비밀번호 입력"
          className="w-full bg-[#2a2a2a] border border-zinc-700/60 rounded-xl px-3.5 py-2.5 text-[13px] text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500/80 focus:ring-1 focus:ring-zinc-500/30 transition-all mb-3"
          autoFocus
        />
        {error && (
          <p className="text-[11px] text-red-400 mb-3 text-center">{error}</p>
        )}
        <div className="flex gap-2">
          <button
            onClick={closeModal}
            className="flex-1 py-2 text-[12px] font-medium text-zinc-400 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-xl transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleLogin}
            className="flex-1 py-2 text-[12px] font-medium text-white bg-zinc-700 hover:bg-zinc-600 rounded-xl transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
