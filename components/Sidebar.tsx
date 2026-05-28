"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Menu } from "lucide-react";
import { COURSE_MENU_DATA } from "@/lib/data/menu";
import Link from "next/link";

export default function Sidebar() {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    기초교양: false,
    핵심교양: false,
    심화교양: false,
  });

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
    <aside className="w-full h-full bg-[#1c1c1c] border border-zinc-800/80 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
      <div className="px-5 py-6">
        <Link href="/" className="border border-zinc-700/60 bg-[#232323] hover:bg-zinc-700/40 transition-colors rounded-2xl px-4 py-3.5 flex items-center justify-between group block">
          <h2 className="text-[15px] font-semibold text-zinc-100 tracking-tight group-hover:text-white transition-colors">INU 기초교육원</h2>
          <Menu className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
        </Link>
      </div>
      
      <nav className="flex-1 overflow-y-auto px-5 pb-6 space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {COURSE_MENU_DATA.map((menu) => {
          const isOpen = openCategories[menu.category];
          const displayName = menu.category === "기초교양" ? "학문의기초" : menu.category;

          return (
            <div 
              key={menu.category} 
              className="flex flex-col border border-zinc-700/60 bg-[#232323] rounded-2xl overflow-hidden transition-colors"
            >
              <button
                onClick={() => toggleCategory(menu.category)}
                className="flex items-center justify-between w-full px-4 py-3.5 text-left hover:bg-zinc-700/20 transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-0.5">이수구분</span>
                  <span className="text-[14px] font-medium text-zinc-100">{displayName}</span>
                </div>
                {isOpen ? (
                  <ChevronDown className="w-5 h-5 text-zinc-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-zinc-500" />
                )}
              </button>
              
              {isOpen && menu.subCategories.length > 0 && (
                <div className="flex flex-col border-t border-zinc-700/60 bg-[#1e1e1e]/50 p-1.5">
                  {menu.subCategories.map((sub) => (
                    <Link
                      key={sub}
                      href={`/courses?category=${menu.category}&subCategory=${sub}`}
                      className="w-full text-left px-3 py-2.5 text-[13px] font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/40 rounded-xl transition-colors"
                    >
                      {sub}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
