import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { course_id } = body

    if (!course_id || typeof course_id !== 'number') {
      return NextResponse.json({ error: 'course_id is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // 현재 로그인한 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 서비스 롤 키로 insert (RLS 우회, 내부 API라 안전)
    const { data, error } = await supabase
      .from('cart_items')
      .insert({ user_id: user.id, course_id })
      .select()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: '이미 담긴 교과목입니다.' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // courses 상세 정보도 함께 반환
    const { data: course } = await supabase
      .from('courses')
      .select('*')
      .eq('순번', course_id)
      .single()

    return NextResponse.json({ success: true, course })
  } catch (err) {
    return NextResponse.json({ error: '장바구니 추가 실패' }, { status: 500 })
  }
}
