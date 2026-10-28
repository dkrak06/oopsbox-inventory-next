/**
 * [Supabase 클라이언트 인스턴스 초기화 모듈]
 * 역할: Supabase 접속 환경 변수를 확인하고 안전하게 클라이언트 객체를 생성합니다.
 * 흐름: 환경 변수가 설정되어 있으면 실제 Supabase에 연결하고, 없으면 로컬 모드로 안전하게 동작합니다.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 1. 환경 변수에서 Supabase 접속 정보 로드 (하드코딩 방지)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 2. 환경 변수가 올바르게 설정되었는지 확인
export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-id')
);

// 3. 환경 변수 누락 시 안내 경고 출력
if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ [Supabase] 환경 변수가 설정되지 않아 로컬 저장소(LocalStorage) 모드로 안전하게 동작합니다.'
  );
}

// 4. 런타임 크래시 방지를 위한 안전한 접속 정보 적용
const safeUrl = isSupabaseConfigured ? supabaseUrl : 'https://dummy.supabase.co';
const safeKey = isSupabaseConfigured ? supabaseAnonKey : 'dummy-key';

// 5. Supabase 클라이언트 객체 생성 (싱글톤 패턴)
export const supabase: SupabaseClient = createClient(safeUrl, safeKey);

