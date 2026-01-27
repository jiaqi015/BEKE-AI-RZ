import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 1. 本地开发时，自动读取 .env 文件
  // 2. Vercel 构建时，自动读取 Dashboard 里配置的环境变量
  // 第三个参数 '' 表示读取所有变量，不限制前缀
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // 【关键配置】
      // 将 Vercel 的环境变量强行注入到前端的 process.env 中
      // 这样您现有的代码 (process.env.API_KEY) 就可以直接工作，无需改动
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.GEMINI_API_KEY || ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || ''),
      
      // 防止代码中直接访问 process.env 导致报错
      'process.env': {}
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});