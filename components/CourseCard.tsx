"use client";

import { useState } from "react";
import { X, LogIn } from "lucide-react";
import { useAuth } from "@/components/providers/AuthContext";

export default function CourseCard({ course }: { course: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const { addToCart, user, signInWithGoogle, isInCart } = useAuth();
  const alreadyInCart = isInCart(course["순번"]);

  const formatCurrency = (val: number) => {
    if (!val) return "무료";
    return val.toLocaleString() + "원";
  };

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch {
      setIsSigningIn(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full group relative">
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-4 gap-2">
            <h3 className="text-[17px] font-bold text-zinc-900 leading-snug line-clamp-2">
              {course['교과목명']}
            </h3>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="shrink-0 text-xs font-semibold px-3 py-1.5 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 rounded-lg transition-colors"
            >
              자세히
            </button>
          </div>
          
          <div className="space-y-2 mt-auto text-[13.5px] text-zinc-600">
            <div className="flex justify-between items-center py-1">
              <span className="text-zinc-400 font-medium">담당교수</span>
              <span className="font-semibold text-zinc-800">{course['담당교수'] || '미정'}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-zinc-400 font-medium">시간표</span>
              <span className="font-medium text-zinc-800 text-right max-w-[120px] truncate" title={course['시간표(교시)'] || course['시간표(시간)'] || '미정'}>
                {course['시간표(교시)'] || course['시간표(시간)'] || '미정'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-zinc-400 font-medium">학점 / 정원</span>
              <span className="font-medium text-zinc-800">{course['학점']}학점 / {course['정원']}명</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-zinc-400 font-medium">성적평가</span>
              <span className="font-medium text-zinc-800">{course['성적평가']}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-zinc-100 mt-2">
              <span className="text-zinc-500 font-semibold">수강가격</span>
              <span className="font-bold text-indigo-600 text-base">{formatCurrency(course['수강가격'])}</span>
            </div>
          </div>
        </div>
        
        <div className="p-4 pt-0">
          <button 
            onClick={() => {
              console.log("장바구니 버튼 클릭됨! 과목:", course['교과목명'], "순번:", course['순번'], "현재 유저:", user);
              if (!user) {
                setIsLoginModalOpen(true);
                return;
              }
              addToCart(course);
            }}
            className={`w-full py-3 text-sm font-bold rounded-xl transition-colors shadow-sm ${
              alreadyInCart ? "bg-indigo-100 text-indigo-700 cursor-default" : "bg-zinc-900 hover:bg-black text-white"
            }`}
          >
            {alreadyInCart ? "✓ 담김" : "장바구니 담기"}
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 bg-zinc-50/50">
              <h2 className="text-xl font-bold text-zinc-900 pr-8">
                {course['교과목명']} <span className="text-sm font-normal text-zinc-500 ml-2">{course['학수번호']}</span>
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors absolute right-4 top-4">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                <DetailItem label="이수구분" value={course['이수구분']} />
                <DetailItem label="이수영역" value={course['이수영역']} />
                <DetailItem label="교과목명(영문)" value={course['교과목명(영문)']} />
                <DetailItem label="담당교수" value={course['담당교수']} />
                <DetailItem label="강의실" value={course['강의실']} />
                <DetailItem label="시간표(교시)" value={course['시간표(교시)']} />
                <DetailItem label="시간표(시간)" value={course['시간표(시간)']} />
                <DetailItem label="교시유형" value={course['교시유형']} />
                <DetailItem label="수강가격" value={formatCurrency(course['수강가격'])} highlight />
                <DetailItem label="단가" value={formatCurrency(course['단가'])} />
                <DetailItem label="학점 / 시수" value={`${course['학점'] || 0}학점 / ${course['시수'] || 0}시수`} />
                <DetailItem label="이론 / 실습" value={`이론 ${course['이론'] || 0} / 실습 ${course['실습'] || 0}`} />
                <DetailItem label="정원" value={`${course['정원'] || 0}명`} />
                <DetailItem label="수업구분" value={course['수업구분']} />
                <DetailItem label="수업유형" value={course['수업유형']} />
                <DetailItem label="성적평가" value={course['성적평가']} />
                <DetailItem label="원어강의" value={course['원어강의']} />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-xl transition-colors">닫기</button>
              <button onClick={() => { 
                if (!user) {
                  setIsLoginModalOpen(true);
                  setIsModalOpen(false);
                  return;
                }
                addToCart(course); setIsModalOpen(false); }}
                className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-colors shadow-sm ${alreadyInCart ? "bg-indigo-100 text-indigo-700 cursor-default" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}>
                {alreadyInCart ? "✓ 이미 담긴 과목" : "장바구니 담기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Prompt Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[4px]"
            onClick={() => { if (!isSigningIn) setIsLoginModalOpen(false); }}
          />
          <div className="relative bg-white/95 backdrop-blur-xl border border-zinc-200/50 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-full max-w-sm overflow-hidden flex flex-col p-8 sm:p-10 animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
            {!isSigningIn && (
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="absolute right-6 top-6 p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <div className="flex flex-col items-center mt-2 mb-6">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border border-zinc-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-white flex items-center justify-center p-1">
                <img src="/Mascot.jpg" alt="INU Mascot" className="w-full h-full object-cover rounded-xl" />
              </div>
            </div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-extrabold text-zinc-950 tracking-tight">로그인이 필요합니다</h2>
              <p className="text-sm font-medium text-zinc-500 mt-2">
                장바구니를 이용하려면 로그인이 필요해요
              </p>
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
                  <LogIn className="w-5 h-5 text-indigo-600" />
                  <span>Google 계정으로 로그인</span>
                </>
              )}
            </button>
            <button
              onClick={() => setIsLoginModalOpen(false)}
              className="mt-4 text-xs font-medium text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function DetailItem({ label, value, highlight = false }: { label: string, value: string | number, highlight?: boolean }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium text-zinc-500 mb-1">{label}</span>
      <span className={`text-[15px] ${highlight ? 'font-bold text-indigo-600' : 'font-medium text-zinc-900'}`}>{value}</span>
    </div>
  );
}
