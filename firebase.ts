
import * as firebaseApp from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// 您的 Firebase 配置
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyAIZbiICW2eeCUUg82wev_A5hPwJnj_PcI",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "qifa-3d4b9.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "qifa-3d4b9",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "qifa-3d4b9.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "462862998050",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:462862998050:web:934451db16ed83c5d6887b",
  measurementId: "G-H990J8K7RJ"
};

// 初始化 Firebase
// Uses namespace import to avoid 'no exported member' issues in certain TS environments
const app = firebaseApp.initializeApp(firebaseConfig);

// 导出 Auth 和 Database 实例
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // Export Storage

// 初始化 Analytics (仅在浏览器环境支持)
let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((err) => {
    console.warn("Firebase Analytics not supported in this environment:", err);
  });
}

export { analytics };
export default app;
