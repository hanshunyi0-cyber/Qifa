
import type { UserProfile } from '../types';

interface KnowledgeEntry {
  id: string;
  keywords: string[];
  priority: number; // 0-10, higher is more important
  response: (user: UserProfile) => string;
}

const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    id: 'greeting',
    keywords: ['你好', 'hi', 'hello', '您好', 'hey', '在吗'],
    priority: 10,
    response: (user) => `你好，${user.name.split(' ')[0]}！我是你的留学智能助手。我可以帮你解答关于签证、租房、银行开户等问题。`
  }
];

export const getAIResponse = (input: string, user: UserProfile): string => {
  const lowerInput = input.toLowerCase();
  const match = KNOWLEDGE_BASE.find(entry => 
    entry.keywords.some(keyword => lowerInput.includes(keyword))
  );
  
  if (match) {
    return match.response(user);
  }
  
  return "我正在学习中，目前只能回答基础问题。你可以尝试问我关于签证或租房的建议。";
};
