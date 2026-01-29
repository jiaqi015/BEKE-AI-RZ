import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ESM scope
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Fix: Type assertion to avoid "Property 'cwd' does not exist on type 'Process'" error
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Robust API Key loading: Process Env (Vercel) -> DotEnv File -> Empty String
  const apiKey =
    process.env.API_KEY ||
    process.env.GEMINI_API_KEY ||
    env.API_KEY ||
    env.GEMINI_API_KEY ||
    '';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
    optimizeDeps: {
      // Vital for PDF.js v5 + Vite: Exclude from pre-bundling so ?url works
      exclude: ['pdfjs-dist'] 
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      target: 'esnext' // Support Top-level await used in PDF.js
    },
    define: {
      // Inject the key securely into the client bundle
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
      // Fallback for other process.env usage
      'process.env': {}
    }
  };
});