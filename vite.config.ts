import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages 部署时使用仓库名作为 base 路径
  // 部署前请将下面的 '/tianjin-sunlight-simulator/' 替换为你的实际仓库名
  base: process.env.GITHUB_ACTIONS ? '/tianjin-sunlight-simulator/' : '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
