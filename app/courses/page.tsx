import { createClient } from '@/lib/supabase/server';
import CourseCard from '@/components/CourseCard';
import SearchBar from '@/components/SearchBar';
import Link from 'next/link';

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; subCategory?: string; searchTarget?: string; query?: string; page?: string }>;
}) {
  const params = await searchParams;
  const category = params.category;
  const subCategory = params.subCategory;
  const searchTarget = params.searchTarget;
  const queryParam = params.query;
  const page = parseInt(params.page || '1', 10);
  const pageSize = 24;
  
  const supabase = await createClient();
  
  let query = supabase.from('courses').select('*', { count: 'exact' });
  
  if (category) {
    const dbCategory = category === '학문의기초' ? '기초교양' : category;
    query = query.eq('이수구분', dbCategory);
  }
  
  if (subCategory) {
    query = query.eq('이수영역', subCategory);
  }

  if (queryParam) {
    if (searchTarget === 'professor') {
      query = query.ilike('담당교수', `%${queryParam}%`);
    } else {
      query = query.ilike('교과목명', `%${queryParam}%`);
    }
  }
  
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);
  
  const { data, count } = await query;
  
  const totalItems = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  let pageTitle = "전체 교과목";
  if (queryParam) {
    pageTitle = `'${queryParam}' 검색 결과`;
  } else if (category && subCategory) {
    pageTitle = `${category === '기초교양' ? '학문의기초' : category} - ${subCategory}`;
  } else if (category) {
    pageTitle = category === '기초교양' ? '학문의기초' : category;
  } else if (subCategory) {
    pageTitle = subCategory;
  }

  const createPageUrl = (pageNum: number) => {
    const urlParams = new URLSearchParams();
    if (category) urlParams.set('category', category);
    if (subCategory) urlParams.set('subCategory', subCategory);
    if (searchTarget) urlParams.set('searchTarget', searchTarget);
    if (queryParam) urlParams.set('query', queryParam);
    urlParams.set('page', pageNum.toString());
    return `/courses?${urlParams.toString()}`;
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] pb-20">
      <SearchBar />
      
      <div className="max-w-7xl mx-auto px-8 pt-40 pb-10">
        <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-4">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{pageTitle}</h1>
          <span className="text-gray-500 font-medium">총 {totalItems}개 과목</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {data?.map((course: any) => (
            <CourseCard key={course['순번']} course={course} />
          ))}
          {(!data || data.length === 0) && (
            <div className="col-span-full py-20 text-center text-gray-500 font-medium">
              조건에 맞는 교과목이 없습니다.
            </div>
          )}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2">
            {page > 1 && (
              <Link 
                href={createPageUrl(page - 1)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors"
              >
                이전
              </Link>
            )}
            
            <div className="flex items-center gap-1 mx-4">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else {
                  if (page <= 3) pageNum = i + 1;
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = page - 2 + i;
                }
                
                if (pageNum < 1 || pageNum > totalPages) return null;
                
                return (
                  <Link
                    key={pageNum}
                    href={createPageUrl(pageNum)}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg font-semibold transition-colors ${
                      page === pageNum 
                        ? "bg-indigo-600 text-white shadow-md" 
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {pageNum}
                  </Link>
                );
              })}
            </div>
            
            {page < totalPages && (
              <Link 
                href={createPageUrl(page + 1)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors"
              >
                다음
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
