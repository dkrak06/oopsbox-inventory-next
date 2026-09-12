/**
 * 이 파일은 Next.js 애플리케이션의 기본 환경 설정을 담당합니다.
 * GitHub Actions 환경에서 GitHub Pages로 무료 배포될 수 있도록 정적 내보내기(export) 및 경로를 자동 설정합니다.
 */
import type { NextConfig } from "next";

// 프로덕션 빌드(배포) 환경인지 확인
const isProd = process.env.NODE_ENV === "production";
// GitHub 저장소 이름 (GitHub Pages 주소의 하위 경로)
const repoName = "oopsbox-inventory-next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 1. 서버 없이 순수 HTML/CSS/JS 파일들로 빌드하여 배포하는 정적 내보내기 모드
  output: "export",
  // 2. GitHub Pages 서브디렉토리 주소(/oopsbox-inventory-next)에 맞게 기본 경로 설정
  basePath: isProd ? `/${repoName}` : "",
  assetPrefix: isProd ? `/${repoName}/` : "",
  // 3. 정적 export 환경에서 Node.js 이미지 서버 없이도 이미지를 표시할 수 있도록 최적화 해제
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
