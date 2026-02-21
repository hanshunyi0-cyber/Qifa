
import type { UserProfile, TaskCategory } from '../types';

interface RecommendationItem {
  id: string;
  icon: string; // Emoji or icon name
  text: string;
  type: 'URGENT' | 'TIP' | 'CHECKLIST';
}

interface SmartAdvice {
  title: string;
  description: string;
  items: RecommendationItem[];
}

// Helper to detect region based on city string
const getRegion = (city: string): 'PARIS' | 'SOUTH' | 'ALPS' | 'NORTH' | 'OTHER' => {
  if (!city) return 'OTHER';
  if (city.includes('Paris') || city.includes('巴黎')) return 'PARIS';
  if (city.includes('Nice') || city.includes('Marseille') || city.includes('Montpellier') || city.includes('Toulouse') || city.includes('Bordeaux')) return 'SOUTH';
  if (city.includes('Grenoble') || city.includes('Annecy')) return 'ALPS';
  if (city.includes('Lille') || city.includes('Rouen') || city.includes('Strasbourg')) return 'NORTH';
  return 'OTHER';
};

// --- NEW FUNCTION: Calculate Dynamic Due Date ---
export const calculateRecommendedDueDate = (taskTitle: string, category: TaskCategory, userStartDateStr: string): string => {
    const today = new Date();
    // Reset time part to avoid timezone issues affecting comparison logic slightly
    today.setHours(0, 0, 0, 0);

    // Default to next September if no start date provided, or parse user date
    let startDate = userStartDateStr ? new Date(userStartDateStr) : new Date();
    if (!userStartDateStr) {
        // If no date, default to 3 months from now
        startDate.setMonth(today.getMonth() + 3);
    }
    
    // If start date is invalid or in the past relative to today (already started), 
    // set a theoretical deadline 1 month from today for new tasks
    if (isNaN(startDate.getTime()) || startDate < today) {
        const fallback = new Date(today);
        fallback.setDate(today.getDate() + 30);
        return fallback.toISOString().split('T')[0];
    }

    let targetDate = new Date(startDate);

    // --- Knowledge Base Logic for Timeline ---
    // Reverse engineer timeline based on French Study Knowledge Base
    
    if (category === 'PRE_DEPARTURE') {
        if (taskTitle.includes('签证') || taskTitle.includes('VLS-TS')) {
            // Visa usually 2-3 months before
            targetDate.setDate(startDate.getDate() - 60);
        } else if (taskTitle.includes('公证') || taskTitle.includes('认证')) {
            // Notarization needs time, 3 months before
            targetDate.setDate(startDate.getDate() - 90);
        } else if (taskTitle.includes('住宿') || taskTitle.includes('房')) {
            // Housing 2-3 months before
            targetDate.setDate(startDate.getDate() - 75);
        } else if (taskTitle.includes('机票')) {
            // Flight 1.5 months before
            targetDate.setDate(startDate.getDate() - 45);
        } else if (taskTitle.includes('行李') || taskTitle.includes('采购')) {
            // Luggage 2 weeks before
            targetDate.setDate(startDate.getDate() - 14);
        } else {
            // General pre-departure: 1 month before
            targetDate.setDate(startDate.getDate() - 30);
        }
    } else if (category === 'ARRIVAL') {
        // Arrival tasks happen immediately upon arrival (approx start date)
        // We set it to Start Date or slightly before to indicate urgency upon landing
        if (taskTitle.includes('开户') || taskTitle.includes('银行')) {
            targetDate.setDate(startDate.getDate() - 2); 
        } else if (taskTitle.includes('手机') || taskTitle.includes('卡')) {
             targetDate.setDate(startDate.getDate() - 3);
        } else if (taskTitle.includes('OFII') || taskTitle.includes('居留')) {
            // OFII is technically within 3 months AFTER arrival, but to keep it safe as "start task"
            // we set it to start date + 1 week usually, but constraint says "NOT AFTER START DATE"
            // So we clamp it to Start Date.
            targetDate = new Date(startDate);
        } else {
            targetDate.setDate(startDate.getDate() - 1);
        }
    } else if (category === 'STUDY') {
        if (taskTitle.includes('注册')) {
             targetDate.setDate(startDate.getDate() - 7); // Registration usually week before
        } else if (taskTitle.includes('书单') || taskTitle.includes('预习')) {
             targetDate.setDate(startDate.getDate() - 20); // Reading list 3 weeks before
        } else {
             targetDate.setDate(startDate.getDate() - 5);
        }
    } else {
        // LIFE category
        targetDate.setDate(startDate.getDate() - 10);
    }

    // --- CONSTRAINTS ENFORCEMENT ---
    
    // 1. Cannot be before Today
    if (targetDate < today) {
        // If the ideal date has passed, suggest "Today + 2 days" to give immediate action time
        // but keep it realistic (not yesterday)
        targetDate = new Date(today);
        targetDate.setDate(today.getDate() + 2);
    }

    // 2. Cannot be after Start Date (Strict User Requirement)
    if (targetDate > startDate) {
        targetDate = new Date(startDate);
    }

    return targetDate.toISOString().split('T')[0];
};

export const getSmartRecommendations = (user: UserProfile, category: TaskCategory | 'HOME'): SmartAdvice | null => {
  const region = getRegion(user.targetCity);
  const isArtStudent = user.program.includes('Art') || user.program.includes('Design') || user.program.includes('Fashion') || user.program.includes('设计') || user.program.includes('艺术');
  const isEngineer = user.program.includes('Engineer') || user.program.includes('Science') || user.program.includes('工程') || user.program.includes('理工');

  // --- 1. HOME PAGE HIGHLIGHTS ---
  if (category === 'HOME') {
    const highlights: RecommendationItem[] = [];
    
    // City specific
    if (region === 'PARIS') {
      highlights.push({ id: 'h1', icon: '🚇', text: `你将前往巴黎地区，建议提前了解 "Navigo" 交通卡的分区计费规则。`, type: 'TIP' });
      highlights.push({ id: 'h2', icon: '🏠', text: `巴黎租房市场非常紧张，建议提前 2-3 个月开始寻找担保人 (Garant)。`, type: 'URGENT' });
    } else if (region === 'SOUTH') {
      highlights.push({ id: 'h3', icon: '☀️', text: `南部阳光充足，但早晚温差大，记得准备墨镜和防风外套。`, type: 'TIP' });
    } else if (region === 'ALPS') {
      highlights.push({ id: 'h4', icon: '🏔️', text: `格勒诺布尔群山环绕，冬季寒冷，请务必准备高品质的羽绒服和登山鞋。`, type: 'URGENT' });
    }

    // Major specific
    if (isArtStudent) {
      highlights.push({ id: 'h5', icon: '🎨', text: `艺术生请注意：大部分画材在法国较贵，建议从国内携带常用画笔和颜料。`, type: 'TIP' });
    }

    return {
      title: 'AI 智能洞察',
      description: `基于你的档案 (${user.targetCity} / ${user.program}) 生成的个性化建议`,
      items: highlights
    };
  }

  // --- 2. PRE_DEPARTURE (Luggage & Visa) ---
  if (category === 'PRE_DEPARTURE') {
    const luggageItems: RecommendationItem[] = [
      { id: 'l1', icon: '📄', text: '重要文件原件 (护照/录取信/出生公证/证件照x10)', type: 'URGENT' },
      { id: 'l2', icon: '🔌', text: '欧标转换插头 x 2 + 多口插线板', type: 'CHECKLIST' },
      { id: 'l3', icon: '💊', text: '常用药品 (消炎药/感冒药/肠胃药 - 法国买抗生素需处方)', type: 'CHECKLIST' },
    ];

    // Region specific luggage
    if (region === 'PARIS' || region === 'NORTH') {
      luggageItems.push({ id: 'l4', icon: '☔️', text: '结实的折叠伞 (这里雨水频繁)', type: 'CHECKLIST' });
      luggageItems.push({ id: 'l5', icon: '🧥', text: '防雨冲锋衣或风衣', type: 'CHECKLIST' });
    } else if (region === 'SOUTH') {
      luggageItems.push({ id: 'l6', icon: '🕶️', text: '墨镜和高倍防晒霜 (必备)', type: 'CHECKLIST' });
      luggageItems.push({ id: 'l7', icon: '🩳', text: '夏装和泳衣', type: 'CHECKLIST' });
    }

    // Major specific luggage
    if (isEngineer) {
      luggageItems.push({ id: 'l8', icon: '💻', text: '高性能笔记本电脑 (法语键盘布局不同，建议自带)', type: 'TIP' });
    }

    return {
      title: '智能行李与签证清单',
      description: `针对 ${user.targetCity} 的气候及 ${user.degreeLevel} 签证要求`,
      items: luggageItems
    };
  }

  // --- 3. ARRIVAL (Admin) ---
  if (category === 'ARRIVAL') {
    const adminItems: RecommendationItem[] = [
      { id: 'a1', icon: '🏦', text: '预约银行开户 (建议 BNP, Société Générale 或 LCL)', type: 'URGENT' },
      { id: 'a2', icon: '📱', text: '办理手机卡 (Free Mobile 便宜量大，Orange 信号最好)', type: 'CHECKLIST' },
      { id: 'a3', icon: '🎫', text: '激活 VLS-TS 签证 (务必在落地3个月内完成)', type: 'URGENT' },
      { id: 'a4', icon: '🏠', text: '申请 CAF 房补 (拿到住房合同后立即申请)', type: 'TIP' },
    ];

    if (region === 'PARIS') {
      adminItems.push({ id: 'a5', icon: '🚇', text: '办理 Imagine R 学生交通卡 (比普通月票便宜很多)', type: 'TIP' });
    }

    return {
      title: '落地安家向导',
      description: '抵达法国第一周必须完成的关键事项',
      items: adminItems
    };
  }

  // --- 4. STUDY (Academic) ---
  if (category === 'STUDY') {
    const studyItems: RecommendationItem[] = [
      { id: 's1', icon: '🎓', text: '完成学校行政注册 (Inscription Administrative)', type: 'URGENT' },
      { id: 's2', icon: '📅', text: '下载学校课表 App / 确认 Moodle 账号', type: 'CHECKLIST' },
    ];

    if (isArtStudent) {
      studyItems.push({ id: 's3', icon: '🎨', text: '准备作品集 (Portfolio) 用于开学展示', type: 'TIP' });
      studyItems.push({ id: 's4', icon: '🏛️', text: '办理卢浮宫/奥赛博物馆青年卡 (艺术生常需临摹)', type: 'TIP' });
    } else if (user.program.includes('Business') || user.program.includes('Management') || user.program.includes('商')) {
      studyItems.push({ id: 's5', icon: '👔', text: '准备一套正式西装/正装 (用于 Presentation 和面试)', type: 'CHECKLIST' });
      studyItems.push({ id: 's6', icon: '🤝', text: '更新 LinkedIn 个人档案为英/法双语', type: 'TIP' });
    } else {
      studyItems.push({ id: 's7', icon: '📚', text: '寻找上一届学长学姐购买二手教材', type: 'TIP' });
    }

    return {
      title: '学业衔接建议',
      description: `针对 ${user.program} 专业的特定建议`,
      items: studyItems
    };
  }

  // --- 5. LIFE (Daily) ---
  if (category === 'LIFE') {
    return {
      title: '生活小贴士',
      description: '像当地人一样生活',
      items: [
        { id: 'lf1', icon: '🛒', text: '周日大部分超市关门，记得周六备货', type: 'TIP' },
        { id: 'lf2', icon: '🩺', text: '注册 Doctolib App，方便预约医生', type: 'CHECKLIST' },
        { id: 'lf3', icon: '🍽️', text: '申请 CROUS 食堂卡，享受 1 欧元(或低价)午餐', type: 'TIP' },
      ]
    };
  }

  return null;
};
