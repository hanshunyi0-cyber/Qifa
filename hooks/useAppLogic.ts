
import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat, Type, FunctionDeclaration } from "@google/genai";
import { DEFAULT_TASKS, DEFAULT_USER, DEFAULT_PREFERENCES } from '../types';
import type { AppState, Task, TaskCategory, ChatMessage, TaskStatus, UserProfile, Post, Report, UserStatus, UserRole, Feedback, FeedbackType, ChatSession, StudyResource, ResourceCategory, ServerMode } from '../types';
import { loadState, saveState } from '../services/store';
import { checkContentSafety } from '../services/moderation';
import { FRENCH_STUDY_KNOWLEDGE } from '../services/knowledgeBase';

// Firebase Imports (Global Mode)
import { auth, db, storage } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updatePassword
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  deleteDoc
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';

// China Cloud Imports
import { initChinaCloud, cnLogin, cnRegister, cnLogout, cnCheckCurrentUser, cnFetchPosts, cnCreatePost, cnLikePost, cnAddComment } from '../services/chinaCloud';

// Define the Tool for the AI
const createTaskTool: FunctionDeclaration = {
  name: 'createTask',
  description: '当用户提到需要做某事、准备某材料或担心某个流程时，调用此函数自动创建任务。能够自动根据任务内容归类到合适的板块。',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { 
        type: Type.STRING, 
        description: '任务的简短标题，例如"预约递签"、"购买机票"' 
      },
      category: { 
        type: Type.STRING, 
        enum: ['PRE_DEPARTURE', 'ARRIVAL', 'LIFE', 'STUDY'], 
        description: 'PRE_DEPARTURE(行前:签证/机票/行李), ARRIVAL(抵达:银行/手机卡/居留), LIFE(生活:交通/房补/购物), STUDY(学习资料:注册/选课/资料)' 
      },
      dueDate: { 
        type: Type.STRING, 
        description: '任务截止日期，格式 YYYY-MM-DD。根据用户描述推断，如果未提及具体时间，可根据紧急程度估算一个合理日期。' 
      },
    },
    required: ['title', 'category']
  }
};

export const useAppLogic = () => {
  const [state, setState] = useState<AppState>(() => loadState()); // Load initial state (including serverMode)
  const [isTyping, setIsTyping] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);

  // Initialize China Cloud if mode is China
  useEffect(() => {
    if (state.serverMode === 'CHINA') {
        initChinaCloud();
    }
  }, [state.serverMode]);

  // --- 1. AUTH LISTENER / CHECKER ---
  useEffect(() => {
    // A. GLOBAL MODE (Firebase)
    if (state.serverMode === 'GLOBAL') {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    if (db) {
                        const userSnap = await getDoc(doc(db, "users", firebaseUser.uid));
                        if (userSnap.exists()) {
                            const userData = userSnap.data() as UserProfile;
                            setState(prev => ({ ...prev, isAuthenticated: true, isGuest: false, user: { ...userData, email: firebaseUser.email || '' } }));
                        }
                    }
                } catch (error) { console.error("Fetch User Err", error); }
            } else {
                setState(prev => ({ ...prev, isAuthenticated: false, user: DEFAULT_USER }));
            }
        });
        return () => unsubscribe();
    } 
    // B. CHINA MODE (LeanCloud)
    else {
        // LeanCloud is usually session-based local storage, check on mount
        const cnUser = cnCheckCurrentUser();
        if (cnUser) {
             setState(prev => ({ ...prev, isAuthenticated: true, isGuest: false, user: cnUser }));
        } else {
             // If local storage has isAuthenticated=true but SDK says no user, trust SDK
             if (state.isAuthenticated && !state.isGuest) {
                 setState(prev => ({ ...prev, isAuthenticated: false, user: DEFAULT_USER }));
             }
        }
    }
  }, [state.serverMode]);

  // --- 2. DATA SYNC (POSTS & RESOURCES) ---
  useEffect(() => {
    // A. GLOBAL MODE - Realtime
    if (state.serverMode === 'GLOBAL') {
        if (!db) return;
        const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            const livePosts: Post[] = [];
            snap.forEach((doc) => livePosts.push({ id: doc.id, ...doc.data() } as Post));
            setState(prev => ({ ...prev, posts: livePosts }));
        }, (err) => console.log(err));
        return () => unsub();
    } 
    // B. CHINA MODE - Polling / Fetch Once
    else {
        cnFetchPosts().then(posts => {
            setState(prev => ({ ...prev, posts }));
        });
        // Simple polling for China mode (every 30s)
        const interval = setInterval(() => {
             cnFetchPosts().then(posts => setState(prev => ({ ...prev, posts })));
        }, 30000);
        return () => clearInterval(interval);
    }
  }, [state.serverMode]);

  // Save Local Preferences
  useEffect(() => {
    if (state.isAuthenticated) {
        saveState(state);
    }
  }, [state.tasks, state.chatSessions, state.preferences, state.serverMode]);


  // --- AUTH ACTIONS ---

  const switchServerMode = (mode: ServerMode) => {
      setState(prev => ({ ...prev, serverMode: mode, isAuthenticated: false, user: DEFAULT_USER }));
      window.location.reload(); // Reload to clear SDK states cleanly
  };

  const login = async (identifier: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    if (!password) return { success: false, message: '请输入密码' };
    
    // GLOBAL
    if (state.serverMode === 'GLOBAL') {
        if (!auth) return { success: false, message: 'Firebase未配置' };
        try {
            await signInWithEmailAndPassword(auth, identifier, password);
            return { success: true };
        } catch (error: any) {
            return { success: false, message: "登录失败: " + error.message };
        }
    } 
    // CHINA
    else {
        try {
            const user = await cnLogin(identifier, password);
            setState(prev => ({ ...prev, isAuthenticated: true, user }));
            return { success: true };
        } catch (e: any) {
             return { success: false, message: "登录失败: " + e.message };
        }
    }
  };

  const loginAsGuest = () => {
      const guestUser: UserProfile = { ...DEFAULT_USER, name: '游客', email: `guest_${Date.now()}@temp.com`, role: 'USER', status: 'ACTIVE' };
      const newId = 'guest-' + Date.now();
      setState(prev => ({ 
          ...prev, isAuthenticated: true, isGuest: true, user: guestUser, 
          chatSessions: [{ id: newId, title: '游客会话', messages: [], createdAt: Date.now(), updatedAt: Date.now() }],
          currentSessionId: newId
      }));
  };

  const register = async (profile: UserProfile, password?: string): Promise<{ success: boolean; message?: string }> => {
      if (!password) return { success: false, message: '需要密码' };

      // GLOBAL
      if (state.serverMode === 'GLOBAL') {
          if (!auth || !db) return { success: false, message: '服务不可用' };
          try {
              const cred = await createUserWithEmailAndPassword(auth, profile.email, password);
              await setDoc(doc(db, "users", cred.user.uid), { ...profile, password, role: 'USER', createdAt: serverTimestamp() });
              return { success: true };
          } catch (e: any) { return { success: false, message: e.message }; }
      } 
      // CHINA
      else {
          try {
              await cnRegister(profile, password);
              // Auto login after reg
              await cnLogin(profile.email, password);
              setState(prev => ({ ...prev, isAuthenticated: true, user: profile }));
              return { success: true };
          } catch (e: any) { return { success: false, message: e.message }; }
      }
  };

  const logout = async () => {
      if (state.serverMode === 'GLOBAL' && auth) await signOut(auth);
      if (state.serverMode === 'CHINA') await cnLogout();
      setState(prev => ({ ...prev, isAuthenticated: false, user: DEFAULT_USER }));
  };

  const updateUser = async (userData: Partial<UserProfile>) => {
    if (state.isGuest) return;
    // Just local update for now unless complex logic added
    setState(prev => ({ ...prev, user: { ...prev.user, ...userData } }));
    if (state.serverMode === 'GLOBAL' && auth && db) {
        updateDoc(doc(db, "users", auth.currentUser!.uid), userData);
    }
  };

  const changePassword = async (current: string, newPass: string) => {
      if (state.serverMode === 'CHINA') return { success: false, message: '中国模式暂不支持修改密码，请联系管理员' };
      if (!auth?.currentUser) return { success: false, message: '未登录' };
      try {
          await updatePassword(auth.currentUser, newPass);
          return { success: true, message: '修改成功' };
      } catch (e: any) { return { success: false, message: e.message }; }
  };

  // --- LOCAL TASK LOGIC (Same for both modes) ---
  const addTask = (title: string, category: TaskCategory, dueDate: string) => {
    const newTask: Task = { id: Date.now().toString(), title, category, status: 'TODO', priority: 'MEDIUM', dueDate };
    setState(prev => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
  };
  const updateTask = (id: string, u: Partial<Task>) => setState(p => ({ ...p, tasks: p.tasks.map(t => t.id === id ? { ...t, ...u } : t) }));
  const toggleTask = (id: string) => setState(p => ({ ...p, tasks: p.tasks.map(t => t.id === id ? { ...t, status: t.status === 'DONE' ? 'TODO' : 'DONE' as TaskStatus } : t) }));
  const deleteTask = (id: string) => setState(p => ({ ...p, tasks: p.tasks.filter(t => t.id !== id) }));

  // --- COMMUNITY LOGIC ---
  const createPost = async (title: string, content: string) => {
      if (state.isGuest) return { success: false, message: '游客无法发布' };
      const safety = checkContentSafety(title + content);
      if (!safety.valid) return { success: false, message: '内容包含违规词' };

      const postData = { authorId: state.user.email, authorName: state.user.name, authorRole: state.user.role, title, content };

      if (state.serverMode === 'GLOBAL') {
          if (!db) return { success: false, message: 'Err' };
          await addDoc(collection(db, "posts"), { ...postData, likes: [], comments: [], timestamp: Date.now() });
      } else {
          try {
             await cnCreatePost(postData);
             // Manually refresh logic for China mode
             const posts = await cnFetchPosts();
             setState(p => ({...p, posts}));
          } catch(e: any) { return { success: false, message: e.message }; }
      }
      return { success: true, message: '发布成功' };
  };

  const deletePost = async (id: string) => {
      if (state.serverMode === 'GLOBAL' && db) await deleteDoc(doc(db, "posts", id));
      // China mode delete omitted for brevity
  };

  const toggleLike = async (id: string) => {
      if (state.serverMode === 'GLOBAL' && db) {
          const post = state.posts.find(p => p.id === id);
          if(!post) return;
          const hasLiked = post.likes.includes(state.user.email);
          await updateDoc(doc(db, "posts", id), { likes: hasLiked ? arrayRemove(state.user.email) : arrayUnion(state.user.email) });
      } else {
          const post = state.posts.find(p => p.id === id);
          if(!post) return;
          const hasLiked = post.likes.includes(state.user.email);
          await cnLikePost(id, state.user.email, !hasLiked);
          // Optimistic update
          setState(prev => ({
              ...prev,
              posts: prev.posts.map(p => p.id === id ? { ...p, likes: hasLiked ? p.likes.filter(x => x!==state.user.email) : [...p.likes, state.user.email] } : p)
          }));
      }
  };

  const addComment = async (id: string, content: string) => {
      const comment = { id: Date.now().toString(), postId: id, authorId: state.user.email, authorName: state.user.name, content, timestamp: Date.now() };
      if (state.serverMode === 'GLOBAL' && db) {
          await updateDoc(doc(db, "posts", id), { comments: arrayUnion(comment) });
      } else {
          await cnAddComment(id, comment);
          // Optimistic
          setState(prev => ({
              ...prev,
              posts: prev.posts.map(p => p.id === id ? { ...p, comments: [...p.comments, comment] } : p)
          }));
      }
      return { success: true, message: 'ok' };
  };

  // --- AI ---
  const sendUserMessage = async (text: string) => {
      // Setup session locally first
      let activeSessionId = state.currentSessionId;
      if (!activeSessionId) {
          const newId = Date.now().toString();
          activeSessionId = newId;
          setState(prev => ({ ...prev, chatSessions: [{ id: newId, title: '新对话', messages: [], createdAt: Date.now(), updatedAt: Date.now() }, ...prev.chatSessions], currentSessionId: newId }));
      }
      const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', content: text, timestamp: Date.now() };
      let msgs = [...(state.chatSessions.find(s=>s.id===activeSessionId)?.messages || []), userMsg];
      
      setState(p => ({ ...p, chatSessions: p.chatSessions.map(s => s.id === activeSessionId ? { ...s, messages: msgs } : s) }));
      setIsTyping(true);

      if (state.serverMode === 'CHINA') {
          // GEMINI BLOCKED IN CHINA - Return mock or error
          setTimeout(() => {
              const botMsg: ChatMessage = { id: Date.now().toString(), sender: 'bot', content: '提示：由于 Google Gemini AI 在中国大陆无法访问，智能助手当前处于离线模式。请切换到全球模式或挂载 VPN 使用完整 AI 功能。但您的任务和社区功能依然正常可用。', timestamp: Date.now() };
              setState(p => ({ ...p, chatSessions: p.chatSessions.map(s => s.id === activeSessionId ? { ...s, messages: [...msgs, botMsg] } : s) }));
              setIsTyping(false);
          }, 1000);
          return;
      }

      // GLOBAL MODE - Call Gemini
      try {
          const apiKey = process.env.API_KEY;
          if (!apiKey) throw new Error("No Key");
          const ai = new GoogleGenAI({ apiKey });
          const chat = ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction: `角色: 留学助手 ${state.user.name}.`, tools: [{ functionDeclarations: [createTaskTool] }] } });
          const result = await chat.sendMessageStream({ message: text });
          let botId = (Date.now()+1).toString();
          let botContent = "";
          
          msgs.push({ id: botId, sender: 'bot', content: '', timestamp: Date.now() });
          
          for await (const chunk of result) {
              if (chunk.text) {
                  botContent += chunk.text;
                  setState(p => ({ ...p, chatSessions: p.chatSessions.map(s => s.id === activeSessionId ? { ...s, messages: msgs.map(m => m.id === botId ? { ...m, content: botContent } : m) } : s) }));
              }
          }
      } catch (e) {
          console.error(e);
          setState(p => ({ ...p, chatSessions: p.chatSessions.map(s => s.id === activeSessionId ? { ...s, messages: [...msgs, { id: Date.now().toString(), sender: 'bot', content: 'AI 服务连接失败', timestamp: Date.now() }] } : s) }));
      } finally {
          setIsTyping(false);
      }
  };

  // --- UTILS ---
  const getProgress = (cat?: TaskCategory) => {
      const target = cat ? state.tasks.filter(t => t.category === cat) : state.tasks;
      if (!target.length) return 0;
      return Math.round((target.filter(t => t.status === 'DONE').length / target.length) * 100);
  };
  
  const resetData = () => { if(confirm('Clear?')) { localStorage.clear(); window.location.reload(); } };
  
  // Helpers not fully implemented for China mode yet
  const reportContent = async () => {};
  const resolveReport = async () => {};
  const replyToFeedback = async () => {};
  const submitFeedback = async (type: FeedbackType, content: string) => { return { success: true, message: '已收到' }; };
  const addResource = async () => { return { success: false, message: '功能开发中' }; };
  const deleteResource = async () => {};

  return {
      ...state,
      isTyping,
      switchServerMode,
      login, loginAsGuest, register, logout, updateUser, changePassword,
      addTask, updateTask, toggleTask, deleteTask,
      createPost, deletePost, toggleLike, addComment,
      sendUserMessage, createNewSession: () => {}, switchSession: (id: string) => setState(p => ({...p, currentSessionId: id})), deleteSession: () => {},
      getProgress, resetData, updatePreferences: (k: any) => setState(p => ({...p, preferences: {...p.preferences, [k]: !p.preferences[k]}})),
      reportContent, resolveReport, submitFeedback, replyToFeedback, addResource, deleteResource
  };
};
