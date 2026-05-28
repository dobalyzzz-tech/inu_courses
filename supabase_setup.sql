-- 1. public.users 테이블 생성
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Row Level Security (RLS) 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. RLS 정책 설정
-- 3-1. 모든 사용자가 다른 사용자의 정보를 조회(Select)할 수 있도록 허용
CREATE POLICY "Allow public read-only access to profiles" ON public.users
  FOR SELECT USING (true);

-- 3-2. 로그인한 사용자 본인의 정보만 수정(Update)할 수 있도록 허용
CREATE POLICY "Allow users to update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 4. auth.users에 신규 회원 생성 시 public.users에 자동 복사하는 함수 정의
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

-- 5. 신규 회원 생성 트리거 설정
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. courses 테이블 RLS 및 조회 권한 설정
-- courses 테이블에 RLS가 켜져 있더라도 로그인 여부와 관계없이 모두 조회할 수 있도록 설정
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to courses for all users" ON public.courses;
CREATE POLICY "Allow read access to courses for all users" ON public.courses
  FOR SELECT TO public USING (true);
