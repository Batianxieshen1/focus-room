import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // GitHub Pages 需要 basePath（仓库名）
  basePath: '/focus-room',
  // 静态文件路径前缀
  assetPrefix: '/focus-room',
};

export default nextConfig;
