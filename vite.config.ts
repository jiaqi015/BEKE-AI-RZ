import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 加载本地 .env 文件 (如果有)
  const env = loadEnv(mode, process.cwd(), '');

  // 【关键修复】
  // Vercel 构建时，环境变量在 process.env 中。
  // 本地开发时，环境变量在 env (loadEnv结果) 中。
  // 我们使用 || 运算符确保无论在哪里都能读到 Key。
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || env.API_KEY || env.GEMINI_API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // 强行注入变量到前端代码的 process.env 中
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
      
      // 防止前端代码访问其他 process.env 属性时报错
      'process.env': {}
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});