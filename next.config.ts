/**
 * 이 파일은 Next.js 애플리케이션의 기본 환경 설정을 담당합니다.
 * GitHub Actions 환경에서 GitHub Pages로 무료 배포될 수 있도록 정적 내보내기(export) 및 경로를 자동 설정합니다.
 */
import type { NextConfig } from "next";

// GitHub Pages(Actions) 환경인지 확인 (Vercel 배포 시에는 루트 경로 사용)
const isGithubPages = process.env.GITHUB_ACTIONS === "true";
// GitHub 저장소 이름
const repoName = "oopsbox-inventory-next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 1. 정적 내보내기 활성화
  output: "export",
  // 2. Vercel은 루트(/)로 배포되고, GitHub Pages일 때만 서브 경로(/oopsbox-inventory-next) 적용
  basePath: isGithubPages ? `/${repoName}` : "",
  assetPrefix: isGithubPages ? `/${repoName}/` : "",
  // 3. 이미지 최적화 unoptimized 처리
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
