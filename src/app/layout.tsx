/**
 * [RootLayout 컴포넌트]
 * 역할: Next.js App Router의 루트 레이아웃으로 HTML 메타데이터, 폰트 및 공통 CSS를 로드합니다.
 * 흐름: 폰트(Pretendard, Outfit) 및 FontAwesome 아이콘 CDN을 로드하고 전체 페이지를 감쌉니다.
 */

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '웁스박스 (OopsBox) - 대충 굴러가는 재고관리',
  description: 'Next.js 기반의 박스히어로 스타일 개인용 재고 관리 시스템',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        {/* Pretendard & Outfit 폰트 CDN 링크 */}
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* FontAwesome 아이콘 웹폰트 CDN */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
