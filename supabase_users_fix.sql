-- ============================================================
-- users 테이블 완전 재설정 스크립트
-- Supabase 대시보드 > SQL Editor에서 전체 실행하세요.
-- ============================================================

-- 1. public.users 테이블 생성 (없으면 생성)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Row Level Security 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "Allow public read-only access to profiles" ON public.users;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.users;

-- 3-1. 누구나 읽기 가능
CREATE POLICY "Allow public read-only access to profiles" ON public.users
  FOR SELECT USING (true);

-- 3-2. 본인 데이터만 INSERT 가능 (클라이언트 측 upsert용)
CREATE POLICY "Allow users to insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3-3. 본인 데이터만 UPDATE 가능
CREATE POLICY "Allow users to update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 4. auth.users 신규 가입 시 public.users 자동 복사 함수
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

-- 5. 트리거 재설정
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. 기존 auth.users에 있는 사용자들을 public.users로 한번에 동기화
-- (이미 가입한 계정이 있는 경우 반영)
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
