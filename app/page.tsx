import { createClient } from '@/lib/supabase/server';
import CourseCard from '@/components/CourseCard';
import SearchBar from '@/components/SearchBar';
import { COURSE_MENU_DATA } from '@/lib/data/menu';
import Link from 'next/link';

function shuffle(array: any[]) {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export default async function Home() {
  const supabase = await createClient();
  
  const { data: basicData } = await supabase.from('courses').select('*').eq('이수구분', '기초교양');
  const { data: coreData } = await supabase.from('courses').select('*').eq('이수구분', '핵심교양');
  const { data: advancedData } = await supabase.from('courses').select('*').eq('이수구분', '심화교양');

  const basicCourses = shuffle(basicData || []).slice(0, 8);
  const coreCourses = shuffle(coreData || []).slice(0, 8);
  const advancedCourses = shuffle(advancedData || []).slice(0, 8);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <SearchBar />

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-8 pt-40 pb-10 space-y-16">
        
        {/* 학문의 기초 */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                학문의 기초
                <Link href="/courses?category=기초교양" className="text-xl text-gray-400 hover:text-indigo-600 transition-colors" title="전체 목록 보기">
                  +
                </Link>
              </h2>
              <p className="text-sm font-medium text-gray-500 mt-1">대학 생활의 기반이 되는 필수 교양 과목</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {basicCourses.map((course: any) => (
              <CourseCard key={course['순번']} course={course} />
            ))}
          </div>
        </section>

        {/* 핵심교양 */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                핵심교양
                <Link href="/courses?category=핵심교양" className="text-xl text-gray-400 hover:text-indigo-600 transition-colors" title="전체 목록 보기">
                  +
                </Link>
              </h2>
              <p className="text-sm font-medium text-gray-500 mt-1">다양한 학문 분야를 아우르는 핵심 지식</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreCourses.map((course: any) => (
              <CourseCard key={course['순번']} course={course} />
            ))}
          </div>
        </section>

        {/* 심화교양 */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                심화교양
                <Link href="/courses?category=심화교양" className="text-xl text-gray-400 hover:text-indigo-600 transition-colors" title="전체 목록 보기">
                  +
                </Link>
              </h2>
              <p className="text-sm font-medium text-gray-500 mt-1">더 깊이 있는 탐구를 위한 선택 교양</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {advancedCourses.map((course: any) => (
              <CourseCard key={course['순번']} course={course} />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
