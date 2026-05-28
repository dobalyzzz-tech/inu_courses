-- courses 테이블에 RLS가 켜져 있어도 로그인 여부(anon, authenticated)와 관계없이 
-- 모든 사용자가 과목 카드를 조회할 수 있도록 SELECT 권한을 허용합니다.

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to courses for all users" ON public.courses;
CREATE POLICY "Allow read access to courses for all users" ON public.courses
  FOR SELECT TO public USING (true);
