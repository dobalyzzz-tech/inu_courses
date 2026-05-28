-- ============================================================
-- 통합 Supabase 설정 스크립트
-- Supabase 대시보드 > SQL Editor에서 전체 실행하세요.
-- 실행 순서: users 테이블 → cart_items 테이블
-- ============================================================

-- ============================================================
-- 1. public.users 테이블 생성 및 트리거
-- ============================================================

-- 1-1. users 테이블 생성 (없으면 생성)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 1-2. Row Level Security 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 1-3. 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "Allow public read-only access to profiles" ON public.users;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.users;

-- 누구나 읽기 가능
CREATE POLICY "Allow public read-only access to profiles" ON public.users
  FOR SELECT USING (true);

-- 본인 데이터만 INSERT 가능 (클라이언트 측 upsert용)
CREATE POLICY "Allow users to insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 본인 데이터만 UPDATE 가능
CREATE POLICY "Allow users to update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 1-4. auth.users 신규 가입 시 public.users 자동 복사 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1-5. 트리거 재설정
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 1-6. 기존 auth.users에 있는 사용자들을 public.users로 한번에 동기화
INSERT INTO public.users (id, email, full_name, avatar_url)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', '') AS full_name,
  COALESCE(raw_user_meta_data->>'avatar_url', '') AS avatar_url
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  updated_at = NOW();


-- ============================================================
-- 2. public.cart_items 테이블 생성
-- ============================================================

-- 2-1. cart_items 테이블 생성
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id INT8 NOT NULL REFERENCES public.courses("순번") ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, course_id)
);

-- 2-2. Row Level Security (RLS) 활성화
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- 2-3. RLS 정책 설정

-- SELECT: 본인 데이터만 조회 가능
CREATE POLICY "Allow users to view their own cart items" 
  ON public.cart_items FOR SELECT 
  USING (auth.uid() = user_id);

-- INSERT: 로그인한 사용자만 본인 user_id로 삽입 가능
CREATE POLICY "Allow users to insert into their own cart" 
  ON public.cart_items FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- DELETE: 본인 데이터만 삭제 가능
CREATE POLICY "Allow users to delete their own cart items" 
  ON public.cart_items FOR DELETE 
  USING (auth.uid() = user_id);


-- ============================================================
-- 3. courses 테이블 RLS (모든 사용자 읽기 가능)
-- ============================================================

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to courses for all users" ON public.courses;
CREATE POLICY "Allow read access to courses for all users" ON public.courses
  FOR SELECT TO public USING (true);
