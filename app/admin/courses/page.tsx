"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Course {
  순번: number;
  이수구분: string | null;
  이수영역: string | null;
  학수번호: string | null;
  교과목명: string | null;
  "교과목명(영문)": string | null;
  담당교수: string | null;
  강의실: string | null;
  "시간표(교시)": string | null;
  "시간표(시간)": string | null;
  교시유형: string | null;
  수강가격: number | null;
  단가: number | null;
  학점: number | null;
  시수: number | null;
  이론: number | null;
  실습: number | null;
  정원: number | null;
  수업구분: string | null;
  수업유형: string | null;
  성적평가: string | null;
  원어강의: string | null;
}

interface CourseFormData {
  이수구분: string;
  이수영역: string;
  학수번호: string;
  교과목명: string;
  "교과목명(영문)": string;
  담당교수: string;
  강의실: string;
  "시간표(교시)": string;
  "시간표(시간)": string;
  교시유형: string;
  수강가격: number;
  단가: number;
  학점: number;
  시수: number;
  이론: number;
  실습: number;
  정원: number;
  수업구분: string;
  수업유형: string;
  성적평가: string;
  원어강의: string;
}

const PAGE_SIZE = 20;

const EMPTY_FORM: CourseFormData = {
  이수구분: "", 이수영역: "", 학수번호: "", 교과목명: "", "교과목명(영문)": "",
  담당교수: "", 강의실: "", "시간표(교시)": "", "시간표(시간)": "", 교시유형: "", 수강가격: 0, 단가: 0,
  학점: 0, 시수: 0, 이론: 0, 실습: 0, 정원: 0, 수업구분: "", 수업유형: "",
  성적평가: "", 원어강의: "",
};

async function apiFetch<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  let json: any;
  try { json = await res.json(); } catch { json = {}; }
  if (!res.ok) {
    console.error("[apiFetch] 실패:", res.status, url, json);
    throw new Error(json.error ?? `HTTP ${res.status}: ${res.statusText}`);
  }
  return json;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"이수구분" | "이수영역" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);

  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<CourseFormData>(EMPTY_FORM);
  const [editSeq, setEditSeq] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      if (search) params.set("search", search);
      if (sortField) { params.set("sortField", sortField); params.set("sortDir", sortDir); }

      const { data, count } = await apiFetch<{ data: Course[]; count: number }>(
        `/api/admin/courses?${params.toString()}`
      );
      setCourses(data ?? []);
      setTotalCount(count ?? 0);
    } catch (err: any) {
      console.error("교과목 조회 실패:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, sortField, sortDir]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSort = (field: "이수구분" | "이수영역") => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(1);
  };

  const openAddModal = () => {
    setForm(EMPTY_FORM);
    setEditSeq(null);
    setModalMode("add");
  };

  const openEditModal = (course: Course) => {
    setForm({
      이수구분: course.이수구분 ?? "",
      이수영역: course.이수영역 ?? "",
      학수번호: course.학수번호 ?? "",
      교과목명: course.교과목명 ?? "",
      "교과목명(영문)": course["교과목명(영문)"] ?? "",
      담당교수: course.담당교수 ?? "",
      강의실: course.강의실 ?? "",
      "시간표(교시)": course["시간표(교시)"] ?? "",
      "시간표(시간)": course["시간표(시간)"] ?? "",
      교시유형: course.교시유형 ?? "",
      수강가격: course.수강가격 ?? 0,
      단가: course.단가 ?? 0,
      학점: course.학점 ?? 0,
      시수: course.시수 ?? 0,
      이론: course.이론 ?? 0,
      실습: course.실습 ?? 0,
      정원: course.정원 ?? 0,
      수업구분: course.수업구분 ?? "",
      수업유형: course.수업유형 ?? "",
      성적평가: course.성적평가 ?? "",
      원어강의: course.원어강의 ?? "",
    });
    setEditSeq(course.순번);
    setModalMode("edit");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, any> = {};
      for (const [key, value] of Object.entries(form)) {
        payload[key] = value === "" ? null : value;
      }

      if (modalMode === "add") {
        await apiFetch("/api/admin/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else if (editSeq !== null) {
        await apiFetch("/api/admin/courses", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, 순번: editSeq }),
        });
      }
      setModalMode(null);
      fetchCourses();
    } catch (err: any) {
      alert("저장 실패: " + (err?.message ?? "알 수 없는 오류"));
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = async (course: Course) => {
    setDeleteTarget(course);
    setDeleteWarning(null);
    setDeleting(false);

    try {
      const [cartRes, orderRes] = await Promise.all([
        fetch(`/api/admin/courses?cartCount=${course.순번}`)
          .then((r) => r.json())
          .catch(() => ({ count: 0 })),
        fetch(`/api/admin/courses?orderCount=${course.순번}`)
          .then((r) => r.json())
          .catch(() => ({ count: 0 })),
      ]);

      const cartCount = cartRes.count ?? 0;
      const orderCount = orderRes.count ?? 0;
      if (cartCount > 0 || orderCount > 0) {
        setDeleteWarning(
          `⚠️ 이 교과목이 장바구니(${cartCount})건 / 주문(${orderCount})건에 참조되어 있습니다. 삭제 시 관련 데이터에 영향이 있을 수 있습니다.`
        );
      }
    } catch {
      // 참조 확인 실패 시 무시
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/courses?순번=${deleteTarget.순번}`, { method: "DELETE" });
      setDeleteTarget(null);
      fetchCourses();
    } catch (err: any) {
      alert("삭제 실패: " + (err?.message ?? "알 수 없는 오류"));
    } finally {
      setDeleting(false);
    }
  };

  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);
  useEffect(() => { setPage(1); }, [search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="교과목명 또는 교수명 검색"
            className="w-full pl-9 pr-3 py-2 text-[13px] bg-white border border-zinc-200 rounded-xl outline-none focus:border-zinc-400 transition-colors"
          />
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-white bg-[#1a2744] hover:bg-[#243556] rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          교과목 추가
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 whitespace-nowrap">교과목명</th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 whitespace-nowrap">담당교수</th>
                <th
                  className="text-left px-4 py-3 font-semibold text-zinc-600 whitespace-nowrap cursor-pointer hover:text-zinc-800 select-none"
                  onClick={() => handleSort("이수구분")}
                >
                  이수구분 {sortField === "이수구분" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  className="text-left px-4 py-3 font-semibold text-zinc-600 whitespace-nowrap cursor-pointer hover:text-zinc-800 select-none"
                  onClick={() => handleSort("이수영역")}
                >
                  이수영역 {sortField === "이수영역" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
                <th className="text-center px-4 py-3 font-semibold text-zinc-600 whitespace-nowrap">학점</th>
                <th className="text-right px-4 py-3 font-semibold text-zinc-600 whitespace-nowrap">수강가격</th>
                <th className="text-center px-4 py-3 font-semibold text-zinc-600 whitespace-nowrap">정원</th>
                <th className="text-center px-4 py-3 font-semibold text-zinc-600 whitespace-nowrap">수강인원</th>
                <th className="text-center px-4 py-3 font-semibold text-zinc-600 whitespace-nowrap w-[100px]">관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-10 text-zinc-400">로딩 중...</td></tr>
              ) : courses.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-zinc-400">등록된 교과목이 없습니다.</td></tr>
              ) : (
                courses.map((c) => (
                  <CourseRow
                    key={c.순번}
                    course={c}
                    onEdit={() => openEditModal(c)}
                    onDelete={() => openDeleteConfirm(c)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-default"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
            .map((p, idx, arr) => (
              <span key={p} className="flex items-center">
                {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-zinc-400">...</span>}
                <button
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 text-[13px] font-medium rounded-lg transition-colors ${
                    p === page ? "bg-[#1a2744] text-white" : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  {p}
                </button>
              </span>
            ))}
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-default"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {(modalMode === "add" || modalMode === "edit") && (
        <CourseFormModal
          mode={modalMode}
          form={form}
          setForm={setForm}
          saving={saving}
          onSave={handleSave}
          onClose={() => setModalMode(null)}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 w-[400px] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[15px] font-semibold text-zinc-800 mb-2">교과목 삭제</h3>
            <p className="text-[13px] text-zinc-600 mb-1">
              &quot;{deleteTarget.교과목명}&quot;을(를) 삭제하시겠습니까?
            </p>
            {deleteWarning && (
              <p className="text-[12px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                {deleteWarning}
              </p>
            )}
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-[12px] font-medium text-zinc-500 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-[12px] font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-xl transition-colors"
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CourseRow({ course, onEdit, onDelete }: { course: Course; onEdit: () => void; onDelete: () => void }) {
  const [enrolled, setEnrolled] = useState<number>(0);
  useEffect(() => {
    fetch(`/api/admin/courses?cartCount=${course.순번}`)
      .then((r) => r.json())
      .then(({ count }) => setEnrolled(count ?? 0))
      .catch(() => {});
  }, [course.순번]);

  return (
    <tr className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
      <td className="px-4 py-3 font-medium text-zinc-800 whitespace-nowrap">{course.교과목명}</td>
      <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">{course.담당교수}</td>
      <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">{course.이수구분}</td>
      <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">{course.이수영역}</td>
      <td className="px-4 py-3 text-center text-zinc-700">{course.학점}</td>
      <td className="px-4 py-3 text-right text-zinc-700 tabular-nums">{course.수강가격?.toLocaleString()}</td>
      <td className="px-4 py-3 text-center text-zinc-700">{course.정원}</td>
      <td className="px-4 py-3 text-center text-zinc-700">{enrolled}</td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <button onClick={onEdit} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors" title="수정">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="삭제">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function CourseFormModal({
  mode, form, setForm, saving, onSave, onClose,
}: {
  mode: "add" | "edit";
  form: CourseFormData;
  setForm: (f: CourseFormData) => void;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
}) {
  const update = (key: keyof CourseFormData, value: string | number) => {
    setForm({ ...form, [key]: value });
  };

  const fields: { key: keyof CourseFormData; label: string; type?: "text" | "number" }[] = [
    { key: "교과목명", label: "교과목명" },
    { key: "교과목명(영문)", label: "교과목명(영문)" },
    { key: "담당교수", label: "담당교수" },
    { key: "이수구분", label: "이수구분" },
    { key: "이수영역", label: "이수영역" },
    { key: "학수번호", label: "학수번호" },
    { key: "강의실", label: "강의실" },
    { key: "시간표(교시)", label: "시간표(교시)" },
    { key: "시간표(시간)", label: "시간표(시간)" },
    { key: "교시유형", label: "교시유형" },
    { key: "수업구분", label: "수업구분" },
    { key: "수업유형", label: "수업유형" },
    { key: "성적평가", label: "성적평가" },
    { key: "원어강의", label: "원어강의" },
    { key: "수강가격", label: "수강가격", type: "number" },
    { key: "단가", label: "단가", type: "number" },
    { key: "학점", label: "학점", type: "number" },
    { key: "시수", label: "시수", type: "number" },
    { key: "이론", label: "이론", type: "number" },
    { key: "실습", label: "실습", type: "number" },
    { key: "정원", label: "정원", type: "number" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white border border-zinc-200 rounded-2xl p-6 w-[640px] max-h-[85vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[15px] font-semibold text-zinc-800 mb-4">
          {mode === "add" ? "교과목 추가" : "교과목 수정"}
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {fields.map(({ key, label, type }) => (
            <div key={key}>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">{label}</label>
              <input
                type={type === "number" ? "number" : "text"}
                value={form[key]}
                onChange={(e) => update(key, type === "number" ? Number(e.target.value) : e.target.value)}
                className="w-full px-3 py-2 text-[13px] bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-zinc-400 transition-colors"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[12px] font-medium text-zinc-500 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
          >
            취소
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 text-[12px] font-medium text-white bg-[#1a2744] hover:bg-[#243556] disabled:opacity-50 rounded-xl transition-colors"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
