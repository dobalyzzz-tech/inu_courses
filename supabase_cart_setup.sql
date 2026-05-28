-- 1. cart_items 테이블 생성
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id INT8 NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, course_id)
);

-- 2. Row Level Security (RLS) 활성화
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- 3. RLS 정책 설정

-- 3-1. SELECT: 본인 데이터만 조회 가능
CREATE POLICY "Allow users to view their own cart items" 
  ON public.cart_items FOR SELECT 
  USING (auth.uid() = user_id);

-- 3-2. INSERT: 로그인한 사용자만 본인 user_id로 삽입 가능
CREATE POLICY "Allow users to insert into their own cart" 
  ON public.cart_items FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 3-3. DELETE: 본인 데이터만 삭제 가능
CREATE POLICY "Allow users to delete their own cart items" 
  ON public.cart_items FOR DELETE 
  USING (auth.uid() = user_id);
