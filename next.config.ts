/**
 * 이 파일은 Next.js 애플리케이션의 기본 환경 설정을 담당합니다.
 * GitHub Actions 환경에서 GitHub Pages로 무료 배포될 수 있도록 정적 내보내기(export) 및 경로를 자동 설정합니다.
 */
import type { NextConfig } from "next";

// GitHub Pages(Actions) 환경인지 확인
const isGithubPages = process.env.GITHUB_ACTIONS === "true";
// GitHub 저장소 이름
const repoName = "oopsbox-inventory-next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 1. GitHub Pages 배포 시에만 정적 내보내기(export) 및 서브경로 적용
  // 2. Vercel 배포 시에는 Vercel 네이티브 Next.js 런타임으로 동작하여 404 없이 루트 완벽 서빙
  ...(isGithubPages
    ? {
        output: "export",
        basePath: `/${repoName}`,
        assetPrefix: `/${repoName}/`,
      }
    : {}),
  // 3. 이미지 최적화 unoptimized 처리
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
