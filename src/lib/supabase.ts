/**
 * [Supabase 클라이언트 인스턴스 초기화 모듈]
 * 역할: 환경 변수에 정의된 Supabase URL과 Anon Key를 읽어와 전역 클라이언트 객체를 생성합니다.
 * 흐름: 환경 변수 누락 시 친절한 한글 경고를 출력하며, 프로젝트 전역에서 재사용 가능한 싱글톤 객체를 제공합니다.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 1. 환경 변수에서 Supabase 접속 정보 로드 (하드코딩 방지)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 2. 접속 정보 누락 시 개발자 콘솔에 경고 표시
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ [Supabase] 환경 변수(NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY)가 설정되지 않았습니다. .env.local 파일을 확인해주세요.'
  );
}

// 3. Supabase 클라이언트 객체 생성 (싱글톤 패턴)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
