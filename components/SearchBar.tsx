"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, ListFilter } from "lucide-react";
import { COURSE_MENU_DATA } from "@/lib/data/menu";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [category, setCategory] = useState(searchParams?.get("category") || "");
  const [subCategory, setSubCategory] = useState(searchParams?.get("subCategory") || "");
  const [searchTarget, setSearchTarget] = useState(searchParams?.get("searchTarget") || "subject");
  const [query, setQuery] = useState(searchParams?.get("query") || "");

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 50 && currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const allCategories = COURSE_MENU_DATA.map(m => m.category);
  const currentMenu = COURSE_MENU_DATA.find(m => m.category === category);
  const subCategories = currentMenu ? currentMenu.subCategories : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (subCategory) params.set("subCategory", subCategory);
    if (searchTarget) params.set("searchTarget", searchTarget);
    if (query) params.set("query", query);
    
    router.push(`/courses?${params.toString()}`);
  };

  return (
    <>
      {/* Invisible Hover Trigger Area at the Top */}
      <div 
        className="fixed top-0 left-0 w-full h-8 z-40"
        onMouseEnter={() => setIsVisible(true)}
      />
      
      {/* Floating Island SearchBar */}
      <div 
        className={`fixed left-4 right-28 lg:left-1/2 lg:-translate-x-1/2 lg:w-[960px] lg:right-auto z-50 pt-4 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          isVisible ? "translate-y-0 opacity-100" : "-translate-y-[120%] opacity-0 pointer-events-none"
        }`}
        onMouseEnter={() => setIsVisible(true)}
      >
        <div className="max-w-6xl mx-auto bg-white/95 backdrop-blur-xl border border-zinc-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-[2rem] px-3 py-2.5">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-2 lg:gap-3 w-full">
            <div className="flex items-center w-full sm:w-auto gap-2">
              <div className="flex items-center border border-zinc-200/80 rounded-2xl bg-white overflow-hidden w-full sm:w-40 shrink-0 shadow-sm hover:border-zinc-300 transition-colors">
                <div className="pl-3 text-zinc-400"><Filter className="w-4 h-4" /></div>
                <select 
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setSubCategory("");
                  }}
                  className="w-full bg-transparent text-sm font-medium py-2.5 px-2 outline-none text-zinc-700 cursor-pointer"
                >
                  <option value="">이수구분 전체</option>
                  {allCategories.map(cat => <option key={cat} value={cat}>{cat === '기초교양' ? '학문의기초' : cat}</option>)}
                </select>
              </div>
              
              <div className="flex items-center border border-zinc-200/80 rounded-2xl bg-white overflow-hidden w-full sm:w-40 shrink-0 shadow-sm hover:border-zinc-300 transition-colors">
                <div className="pl-3 text-zinc-400"><ListFilter className="w-4 h-4" /></div>
                <select 
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium py-2.5 px-2 outline-none text-zinc-700 cursor-pointer"
                  disabled={!category || subCategories.length === 0}
                >
                  <option value="">이수영역 전체</option>
                  {subCategories.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center w-full sm:w-auto gap-2 flex-1">
              <div className="flex items-center border border-zinc-200/80 rounded-2xl bg-indigo-50/30 overflow-hidden w-32 shrink-0 shadow-sm hover:border-zinc-300 transition-colors">
                <select 
                  value={searchTarget}
                  onChange={(e) => setSearchTarget(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold py-2.5 px-3 outline-none text-indigo-700 cursor-pointer"
                >
                  <option value="subject">교과목명</option>
                  <option value="professor">담당교수</option>
                </select>
              </div>
              
              <div className="flex-1 flex items-center border border-zinc-200/80 rounded-2xl bg-white overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 shadow-sm transition-all group">
                <div className="pl-4 text-zinc-400 group-focus-within:text-indigo-500"><Search className="w-5 h-5" /></div>
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchTarget === 'subject' ? "교과목명을 검색해보세요" : "담당교수명을 검색해보세요"} 
                  className="w-full py-2.5 px-3 outline-none text-zinc-700 font-medium placeholder:text-zinc-400"
                />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white w-12 flex items-center justify-center self-stretch transition-colors shrink-0">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
