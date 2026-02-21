import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  // Fix: use '.' instead of process.cwd() to avoid "Property 'cwd' does not exist on type 'Process'" error in some TS environments
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    base: './', // 使用相对路径，方便部署到任何子目录
    define: {
      // 将 .env 中的 API_KEY 注入到前端代码中
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ""),
      
      // Explicitly define Firebase config vars for process.env access
      'process.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY || ""),
      'process.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN || ""),
      'process.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID || ""),
      'process.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET || ""),
      'process.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID || ""),
      'process.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID || ""),

      // LeanCloud Configs (China Mode)
      'process.env.VITE_LEANCLOUD_APP_ID': JSON.stringify(env.VITE_LEANCLOUD_APP_ID || ""),
      'process.env.VITE_LEANCLOUD_APP_KEY': JSON.stringify(env.VITE_LEANCLOUD_APP_KEY || ""),
      'process.env.VITE_LEANCLOUD_SERVER_URL': JSON.stringify(env.VITE_LEANCLOUD_SERVER_URL || ""),
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
    }
  };
});