
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export type TaskCategory = 'PRE_DEPARTURE' | 'ARRIVAL' | 'LIFE' | 'STUDY';

export type Page = 'HOME' | 'PRE_DEPARTURE' | 'ARRIVAL' | 'LIFE' | 'STUDY' | 'ASSISTANT' | 'COMMUNITY' | 'REPORT' | 'SETTINGS';

export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'MUTED' | 'BANNED';

export type FeedbackType = 'FEATURE' | 'CONTENT' | 'BUG' | 'UI' | 'OTHER';

// New Types for Study Center
export type ResourceCategory = 'EXCHANGE_GUIDE' | 'EXAM_PAPER' | 'COURSE_NOTE' | 'LANGUAGE_PREP';

export interface StudyResource {
  id: string;
  title: string;
  category: ResourceCategory;
  description: string;
  author: string; // e.g., "20届学长", "教务处"
  downloadCount: number;
  size: string;
  fileType: 'PDF' | 'DOC' | 'ZIP' | 'LINK';
  uploadDate: string; // Display Date
  timestamp?: number; // Sorting
  downloadUrl?: string; // Cloud Link
}

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  status: TaskStatus;
  dueDate?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  studentId: string;
  school: string;
  degreeLevel: string;
  program: string;
  startDate: string;
  currentLocation: string;
  targetCity: string;
  role: UserRole;
  status: UserStatus;
  isOnline?: boolean; // Added for monitoring
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string; // Email or Phone as ID
  authorName: string;
  content: string;
  timestamp: number;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  title: string;
  content: string;
  likes: string[]; // Array of user IDs
  comments: Comment[];
  timestamp: number;
  isVioplating?: boolean; // Marked by system
}

export interface Report {
  id: string;
  targetId: string; // Post ID or Comment ID
  targetType: 'POST' | 'COMMENT';
  reporterId: string;
  reason: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  timestamp: number;
  contentSnapshot: string; // Keep a copy in case it's deleted
}

export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  type: FeedbackType;
  content: string;
  timestamp: number;
  status: 'PENDING' | 'REVIEWED';
  // Admin Reply Fields
  adminReply?: string;
  replyTimestamp?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface AppPreferences {
  darkMode: boolean;
  dailyReminders: boolean;
}

// Support Dual-Cloud Mode
export type ServerMode = 'GLOBAL' | 'CHINA';

export interface AppState {
  serverMode: ServerMode; // NEW: Control cloud provider
  isAuthenticated: boolean;
  isGuest: boolean;
  user: UserProfile;
  registeredUsers: UserProfile[];
  tasks: Task[];
  // chatHistory: ChatMessage[]; // REMOVED: Replaced by chatSessions
  chatSessions: ChatSession[]; // ADDED
  currentSessionId: string | null; // ADDED
  preferences: AppPreferences;
  // Community Data
  posts: Post[];
  reports: Report[];
  feedbacks: Feedback[]; 
  // Study Center Data
  resources: StudyResource[]; 
}

export const DEFAULT_TASKS: Task[] = [];

export const RECOMMENDED_TASKS: Task[] = [
  { id: 'r1', title: '办理长期留学签证 (VLS-TS)', category: 'PRE_DEPARTURE', status: 'TODO', priority: 'HIGH', dueDate: '2025-07-01' },
  { id: 'r2', title: '购买赴法机票', category: 'PRE_DEPARTURE', status: 'TODO', priority: 'HIGH', dueDate: '2025-07-15' },
  { id: 'r3', title: '购买留学保险 (CVEC缴纳)', category: 'PRE_DEPARTURE', status: 'TODO', priority: 'HIGH', dueDate: '2025-08-01' },
  { id: 'r4', title: '寻找并预定法国住宿', category: 'PRE_DEPARTURE', status: 'TODO', priority: 'HIGH', dueDate: '2025-06-01' },
  { id: 'r5', title: '出生公证双认证', category: 'PRE_DEPARTURE', status: 'TODO', priority: 'MEDIUM', dueDate: '2025-06-20' },
  { id: 'r6', title: '注册法国医保 (Ameli)', category: 'ARRIVAL', status: 'TODO', priority: 'HIGH', dueDate: '2025-09-05' },
  { id: 'r7', title: '法国银行开户 (RIB)', category: 'ARRIVAL', status: 'TODO', priority: 'HIGH', dueDate: '2025-09-02' },
  { id: 'r8', title: '办理 OFII 居留生效', category: 'ARRIVAL', status: 'TODO', priority: 'HIGH', dueDate: '2025-09-15' },
  { id: 'r9', title: '办理交通卡 (Navigo/Imagine R)', category: 'LIFE', status: 'TODO', priority: 'MEDIUM', dueDate: '2025-09-03' },
  { id: 'r10', title: '申请房补 (CAF)', category: 'LIFE', status: 'TODO', priority: 'HIGH', dueDate: '2025-10-01' },
  { id: 'r11', title: '学校行政注册 (Inscription)', category: 'STUDY', status: 'TODO', priority: 'HIGH', dueDate: '2025-09-01' },
  { id: 'r12', title: '阅读专业预习书单', category: 'STUDY', status: 'TODO', priority: 'MEDIUM', dueDate: '2025-08-20' },
];

export const DEFAULT_USER: UserProfile = {
  name: '',
  email: '',
  phone: '',
  studentId: '',
  school: '',
  degreeLevel: '',
  program: '',
  startDate: '',
  currentLocation: '',
  targetCity: '',
  role: 'USER',
  status: 'ACTIVE',
  isOnline: false
};

export const DEFAULT_PREFERENCES: AppPreferences = {
  darkMode: false,
  dailyReminders: true,
};