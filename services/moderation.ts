
// services/moderation.ts

// Classified sensitive keywords for better feedback
const SENSITIVE_CATEGORIES = [
  { 
    type: '暴力/恐吓', 
    words: ['暴力', '血腥', '杀人', '自杀', '砍人', '炸弹', 'tuer', '恐怖', '枪击', '分尸', '虐待'] 
  },
  { 
    type: '色情/低俗', 
    words: ['色情', '裸体', '援交', '约炮', '招嫖', 'av', '三级片', '淫秽', 'sexe', '裸聊', 'SM'] 
  },
  { 
    type: '非法金融/诈骗', 
    words: ['赌博', '六合彩', '办证', '发票', '刷单', '套现', '高利贷', '洗钱', '换汇', '出u', '出米', '面交', '私换'] 
  },
  { 
    type: '学术不端', 
    words: ['代写', '代考', '枪手', '保录', '修改成绩', '论文代发', '作弊'] 
  },
  { 
    type: '违禁品', 
    words: ['毒品', '大麻', '枪支', '迷药', '海洛因', 'drogue', '冰毒', '笑气'] 
  },
  { 
    type: '歧视/仇恨', 
    words: ['黑鬼', '阿三', '棒子', '鬼子', '尼哥', 'nigger', 'negro', '支那'] 
  },
  { 
    type: '政治敏感', 
    words: ['法轮功', '台独', '港独', '藏独'] // Basic list for student community safety
  },
  { 
    type: '辱骂/人身攻击', 
    words: ['傻逼', '脑残', '尼玛', '去死', 'merde', 'putain', 'connard', '白痴', '智障', '废物', '滚'] 
  }
];

interface CheckResult {
  valid: boolean;
  violationType?: string;
  reason?: string;
  matchedWord?: string;
}

export const checkContentSafety = (text: string): CheckResult => {
  if (!text) return { valid: true };
  const lowerText = text.toLowerCase();
  
  for (const category of SENSITIVE_CATEGORIES) {
    for (const word of category.words) {
      const lowerWord = word.toLowerCase();
      
      // Improved matching logic:
      // 1. If the keyword contains only ASCII characters (likely English/Pinyin/Abbr),
      //    use Regex with Word Boundaries (\b) to avoid false positives (e.g., preventing "av" matching "have").
      // 2. If it contains non-ASCII (e.g., Chinese characters), use standard substring inclusion.
      
      const isAscii = /^[\x00-\x7F]+$/.test(lowerWord);
      
      let isMatch = false;

      if (isAscii) {
        // Use word boundary for ASCII words to prevent "class" matching "ass", "have" matching "av"
        const regex = new RegExp(`\\b${lowerWord}\\b`, 'i');
        isMatch = regex.test(text);
      } else {
        // Direct inclusion for Chinese/Mixed
        isMatch = lowerText.includes(lowerWord);
      }

      if (isMatch) {
        return {
          valid: false,
          violationType: category.type,
          reason: `内容包含【${category.type}】违规词汇`,
          matchedWord: word
        };
      }
    }
  }
  
  return { valid: true };
};
