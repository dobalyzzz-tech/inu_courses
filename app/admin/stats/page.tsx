"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp, Calendar, DollarSign, Download, X, Crown,
} from "lucide-react";

// --- 간단한 막대 차트 (SVG) ---
function BarChart({ data }: { data: { label: string; value: number; color?: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barMaxHeight = 160;

  return (
    <div className="flex items-end gap-2 h-[200px] pt-4">
      {data.map((d, i) => {
        const h = Math.max((d.value / max) * barMaxHeight, 4);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <span className="text-[10px] text-zinc-500 tabular-nums">{d.value.toLocaleString()}</span>
            <div
              className="w-full rounded-t-md transition-all"
              style={{ height: h, backgroundColor: d.color ?? '#1a2744', opacity: 0.85 }}
            />
            <span className="text-[10px] text-zinc-500 whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// --- 파이 차트 (SVG) ---
function PieChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = 80, cy = 80, r = 70;

  let cumulative = 0;
  const slices = data.map((d) => {
    const startAngle = (cumulative / total) * 360;
    cumulative += d.value;
    const endAngle = (cumulative / total) * 360;
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return { path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`, color: d.color };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 160 160">
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} />)}
        <circle cx={cx} cy={cy} r="30" fill="white" />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" className="text-[20px] font-bold" fill="#27272a">
          {total}
        </text>
      </svg>
      <div className="space-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-[12px]">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-zinc-600">{d.label}</span>
            <span className="text-zinc-800 font-medium tabular-nums">{((d.value / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const COLORS = ['#1a2744', '#2d4a8a', '#4a7bc4', '#7baddb', '#a8cbe8', '#cce0f0'];

export default function AdminStatsPage() {
  const [summary, setSummary] = useState({ today: 0, week: 0, month: 0, total: 0 });
  const [monthly, setMonthly] = useState<{ month: string; revenue: number }[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number; revenue: number }[]>([]);
  const [top10, setTop10] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 다운로드 모달
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFrom, setExportFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [exportTo, setExportTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [revRes, catRes, popRes] = await Promise.all([
          fetch('/api/admin/stats?type=revenue'),
          fetch('/api/admin/stats?type=category'),
          fetch('/api/admin/stats?type=popular'),
        ]);
        const rev = await revRes.json();
        const cat = await catRes.json();
        const pop = await popRes.json();

        setSummary(rev.summary ?? { today: 0, week: 0, month: 0, total: 0 });
        setMonthly(rev.monthly ?? []);
        setCategories(cat.categories ?? []);
        setTop10(pop.top10 ?? []);
      } catch (err) {
        console.error('통계 조회 실패:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ type: 'export' });
      if (exportFrom) params.set('from', exportFrom);
      if (exportTo) params.set('to', exportTo + 'T23:59:59.999Z');

      const res = await fetch(`/api/admin/stats?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const blob = new Blob([json.csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `정산_${exportFrom}_${exportTo}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setShowExportModal(false);
    } catch (err: any) {
      alert('다운로드 실패: ' + (err?.message ?? ''));
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-zinc-400">로딩 중...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 1. 기간별 매출 요약 카드 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '오늘 매출', value: summary.today, icon: TrendingUp, color: 'text-sky-600 bg-sky-100' },
          { label: '이번 주 매출', value: summary.week, icon: Calendar, color: 'text-amber-600 bg-amber-100' },
          { label: '이번 달 매출', value: summary.month, icon: DollarSign, color: 'text-emerald-600 bg-emerald-100' },
          { label: '전체 매출', value: summary.total, icon: DollarSign, color: 'text-violet-600 bg-violet-100' },
        ].map((card) => (
          <div key={card.label} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex items-start gap-4">
            <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-0.5">{card.label}</p>
              <p className="text-xl font-bold text-zinc-800 tabular-nums">{card.value.toLocaleString()}원</p>
            </div>
          </div>
        ))}
      </div>

      {/* 2. 월별 매출 차트 */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-[15px] font-semibold text-zinc-800 mb-4">월별 매출 추이</h2>
        {monthly.length === 0 ? (
          <p className="text-zinc-400 text-sm text-center py-10">데이터가 없습니다.</p>
        ) : (
          <BarChart
            data={monthly.map((m, i) => ({ label: m.month.slice(5), value: m.revenue, color: COLORS[i % COLORS.length] }))}
          />
        )}
      </div>

      {/* 3. 이수구분별 + 인기 교과목 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 이수구분별 */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-[15px] font-semibold text-zinc-800 mb-4">이수구분별 수강신청 현황</h2>
          {categories.length === 0 ? (
            <p className="text-zinc-400 text-sm text-center py-10">데이터가 없습니다.</p>
          ) : (
            <PieChart
              data={categories.map((c, i) => ({
                label: c.name,
                value: c.count,
                color: COLORS[i % COLORS.length],
              }))}
            />
          )}
        </div>

        {/* 인기 교과목 TOP 10 */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-[15px] font-semibold text-zinc-800 mb-4 flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            인기 교과목 TOP 10
          </h2>
          {top10.length === 0 ? (
            <p className="text-zinc-400 text-sm text-center py-10">데이터가 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="text-left px-2 py-1.5 font-medium text-zinc-500 w-8">순위</th>
                    <th className="text-left px-2 py-1.5 font-medium text-zinc-500">교과목명</th>
                    <th className="text-left px-2 py-1.5 font-medium text-zinc-500">담당교수</th>
                    <th className="text-center px-2 py-1.5 font-medium text-zinc-500">신청 횟수</th>
                    <th className="text-right px-2 py-1.5 font-medium text-zinc-500">총 수강가격</th>
                  </tr>
                </thead>
                <tbody>
                  {top10.map((item) => (
                    <tr key={item.rank} className="border-b border-zinc-50">
                      <td className="px-2 py-1.5 text-zinc-500 font-medium">{item.rank}</td>
                      <td className="px-2 py-1.5 text-zinc-800">{item.course_name}</td>
                      <td className="px-2 py-1.5 text-zinc-600">{item.professor}</td>
                      <td className="px-2 py-1.5 text-center text-zinc-700 tabular-nums">{item.count}</td>
                      <td className="px-2 py-1.5 text-right text-zinc-700 tabular-nums">{item.total_price.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 5. 정산 데이터 다운로드 버튼 */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-white bg-[#1a2744] hover:bg-[#243556] rounded-xl transition-colors"
        >
          <Download className="w-4 h-4" />
          정산 데이터 다운로드
        </button>
      </div>

      {/* 기간 선택 모달 */}
      {showExportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setShowExportModal(false)}>
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 w-[360px] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold text-zinc-800">정산 데이터 다운로드</h3>
              <button onClick={() => setShowExportModal(false)} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">시작일</label>
                <input type="date" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-zinc-400" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">종료일</label>
                <input type="date" value={exportTo} onChange={(e) => setExportTo(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-zinc-400" />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-[12px] font-medium text-zinc-500 bg-zinc-100 hover:bg-zinc-200 rounded-xl">취소</button>
              <button onClick={handleExport} disabled={exporting}
                className="px-4 py-2 text-[12px] font-medium text-white bg-[#1a2744] hover:bg-[#243556] disabled:opacity-50 rounded-xl">
                {exporting ? '다운로드 중...' : '다운로드'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
