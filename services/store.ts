
import { DEFAULT_TASKS, DEFAULT_USER, DEFAULT_PREFERENCES } from '../types';
import type { AppState, UserProfile, ChatSession, StudyResource } from '../types';

const STORAGE_KEY = 'qifa_app_data_v2'; 

// Only keep the Admin user as a seed. Remove other fake users.
const MOCK_USERS: UserProfile[] = [
    {
        name: '系统管理员',
        email: 'admin@qifa.com',
        phone: '13800000000',
        password: 'admin',
        studentId: '000',
        school: 'System',
        degreeLevel: 'PhD',
        program: 'Administration',
        startDate: '2023-09-01',
        currentLocation: 'Paris',
        targetCity: 'Paris',
        role: 'ADMIN',
        status: 'ACTIVE',
        isOnline: true
    }
];

const MOCK_RESOURCES: StudyResource[] = [
    {
        id: 'res-1',
        title: 'Kedge商学院交换项目全流程指南 (2024版)',
        category: 'EXCHANGE_GUIDE',
        description: '包含申请时间线、选课策略及学分转换对照表。',
        author: '教务处 & 21届学长',
        downloadCount: 1240,
        size: '2.4 MB',
        fileType: 'PDF',
        uploadDate: '2024-05-15'
    },
    {
        id: 'res-2',
        title: '蒙彼利埃三大 - FLE语言学期末重点总结',
        category: 'COURSE_NOTE',
        description: '针对L3阶段语言学概论课程的复习笔记，涵盖常考名词解释。',
        author: '19届学姐 Y.Li',
        downloadCount: 856,
        size: '5.1 MB',
        fileType: 'PDF',
        uploadDate: '2023-12-10'
    },
    {
        id: 'res-3',
        title: 'TCF/TEF 听力高频词汇表 (B2-C1)',
        category: 'LANGUAGE_PREP',
        description: '出国前备考必备，整理了近3年机考听力部分的高频场景词。',
        author: '法语教研组',
        downloadCount: 3421,
        size: '1.2 MB',
        fileType: 'DOC',
        uploadDate: '2024-01-20'
    },
    {
        id: 'res-4',
        title: '宏观经济学往年真题 (2020-2023)',
        category: 'EXAM_PAPER',
        description: '索邦大学经济系L2期末考试真题合集，含参考答案。',
        author: '匿名',
        downloadCount: 567,
        size: '15 MB',
        fileType: 'ZIP',
        uploadDate: '2024-06-01'
    },
    {
        id: 'res-5',
        title: '中法项目重修流程说明书',
        category: 'EXCHANGE_GUIDE',
        description: '挂科后如何申请重修？法国成绩如何认定？官方详细解读。',
        author: '学院办公室',
        downloadCount: 230,
        size: '0.8 MB',
        fileType: 'PDF',
        uploadDate: '2024-02-15'
    },
     {
        id: 'res-6',
        title: 'Marketing Strategic 课程Presentation模板',
        category: 'COURSE_NOTE',
        description: '商科高分Pre模板，包含SWOT分析及竞品调研框架。',
        author: '20届学长 David',
        downloadCount: 1102,
        size: '8.5 MB',
        fileType: 'ZIP',
        uploadDate: '2023-11-05'
    }
];

export const loadState = (): AppState => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      // New User: Create one default empty session
      const initialSessionId = Date.now().toString();
      const initialSession: ChatSession = {
          id: initialSessionId,
          title: '新对话',
          messages: [{
            id: 'init-1',
            sender: 'bot',
            content: '你好！我是你的留学助手。有什么我可以帮你的吗？',
            timestamp: Date.now()
          }],
          createdAt: Date.now(),
          updatedAt: Date.now()
      };

      return {
        serverMode: 'GLOBAL', // Default to Firebase
        isAuthenticated: false,
        isGuest: false,
        user: DEFAULT_USER,
        registeredUsers: MOCK_USERS, 
        tasks: DEFAULT_TASKS,
        chatSessions: [initialSession],
        currentSessionId: initialSessionId,
        preferences: DEFAULT_PREFERENCES,
        posts: [],
        reports: [],
        feedbacks: [],
        resources: MOCK_RESOURCES
      };
    }
    
    const parsed = JSON.parse(serializedState);
    
    // --- MIGRATION LOGIC FOR CHAT HISTORY ---
    let chatSessions: ChatSession[] = parsed.chatSessions || [];
    let currentSessionId = parsed.currentSessionId || null;

    // If we have legacy 'chatHistory' but no sessions, migrate it.
    if (parsed.chatHistory && (!chatSessions || chatSessions.length === 0)) {
        const legacySessionId = Date.now().toString();
        chatSessions = [{
            id: legacySessionId,
            title: '历史对话',
            messages: parsed.chatHistory,
            createdAt: Date.now(),
            updatedAt: Date.now()
        }];
        currentSessionId = legacySessionId;
    }
    
    // Fallback if sessions array ends up empty for some reason
    if (chatSessions.length === 0) {
        const newId = Date.now().toString();
        chatSessions = [{
            id: newId,
            title: '新对话',
            messages: [{
                id: 'init-1',
                sender: 'bot',
                content: '你好！我是你的留学助手。有什么我可以帮你的吗？',
                timestamp: Date.now()
            }],
            createdAt: Date.now(),
            updatedAt: Date.now()
        }];
        currentSessionId = newId;
    }

    // Ensure Admin always exists even in local storage data
    let storedUsers = (parsed.registeredUsers && Array.isArray(parsed.registeredUsers))
        ? parsed.registeredUsers.map((u: any) => ({ ...DEFAULT_USER, ...u }))
        : [];

    const adminExists = storedUsers.some((u: UserProfile) => u.email === 'admin@qifa.com');
    if (!adminExists) {
        storedUsers = [...MOCK_USERS, ...storedUsers];
    }

    return {
      ...parsed,
      serverMode: parsed.serverMode || 'GLOBAL', // Restore or default
      isAuthenticated: parsed.isAuthenticated || false,
      isGuest: parsed.isGuest || false,
      user: { ...DEFAULT_USER, ...parsed.user },
      registeredUsers: storedUsers,
      preferences: parsed.preferences || DEFAULT_PREFERENCES,
      posts: parsed.posts || [],
      reports: parsed.reports || [],
      feedbacks: parsed.feedbacks || [],
      chatSessions,
      currentSessionId,
      resources: parsed.resources && parsed.resources.length > 0 ? parsed.resources : MOCK_RESOURCES
    };
  } catch (err) {
    console.error("Load state failed", err);
    // Error Fallback
    const newId = Date.now().toString();
    return { 
      serverMode: 'GLOBAL',
      isAuthenticated: false,
      isGuest: false,
      user: DEFAULT_USER, 
      registeredUsers: MOCK_USERS,
      tasks: DEFAULT_TASKS, 
      chatSessions: [{
          id: newId,
          title: '新对话',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
      }],
      currentSessionId: newId,
      preferences: DEFAULT_PREFERENCES,
      posts: [],
      reports: [],
      feedbacks: [],
      resources: MOCK_RESOURCES
    };
  }
};

export const saveState = (state: AppState) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (err) {
    console.error("Save state failed", err);
  }
};