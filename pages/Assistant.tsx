
import React, { useRef, useEffect, useState } from 'react';
import type { ChatSession, UserProfile } from '../types';
import { Icons } from '../components/Icon';
import { SUGGESTED_QUESTIONS } from '../services/knowledgeBase';

interface AssistantProps {
  chatSessions: ChatSession[];
  currentSessionId: string | null;
  onSendMessage: (text: string) => void;
  onCreateSession: () => void;
  onSwitchSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  user: UserProfile;
  isTyping?: boolean;
  onBack?: () => void;
}

export const Assistant: React.FC<AssistantProps> = ({ 
    user, chatSessions, currentSessionId, onSendMessage, onCreateSession, onSwitchSession, onDeleteSession, isTyping,
    onBack
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);
  
  const currentSession = chatSessions.find(s => s.id === currentSessionId);
  const chatHistory = currentSession ? currentSession.messages : [];

  const scrollToBottom = (smooth = true) => {
    if (scrollContainerRef.current) {
        const { scrollHeight, clientHeight } = scrollContainerRef.current;
        const maxScrollTop = scrollHeight - clientHeight;
        
        if (maxScrollTop > 0) {
            scrollContainerRef.current.scrollTo({
                top: maxScrollTop,
                behavior: smooth ? 'smooth' : 'auto'
            });
        }
    }
  };

  useEffect(() => {
    if (isFirstLoad.current) {
        isFirstLoad.current = false;
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
        return;
    }
    scrollToBottom();
  }, [chatHistory.length, isTyping, currentSessionId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onSendMessage(inputValue);
    setInputValue('');
    setTimeout(() => scrollToBottom(true), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleSuggestionClick = (question: string) => {
      onSendMessage(question);
      setTimeout(() => scrollToBottom(true), 100);
  };

  const formatMessageContent = (content: string) => {
    return content.split('\n').map((line, i) => {
        const isBullet = line.trim().startsWith('* ');
        const cleanLine = isBullet ? line.trim().substring(2) : line;
        const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
        const formattedChildren = parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="font-bold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
            }
            return <span key={index}>{part}</span>;
        });

        return (
            <div key={i} className={`leading-relaxed ${isBullet ? 'pl-4 relative mb-1.5' : 'min-h-[1.4em] mb-1'}`}>
                {isBullet && <span className="absolute left-0 top-[0.4em] w-1.5 h-1.5 bg-primary/60 rounded-full"></span>}
                {formattedChildren}
            </div>
        );
    });
  };

  return (
    <div className="flex h-full w-full bg-white dark:bg-dark-bg animate-[fadeIn_0.3s_ease-out] overflow-hidden relative rounded-xl shadow-inner md:border border-gray-100 dark:border-gray-800">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
            className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar (History) */}
      <div className={`
         absolute md:static inset-y-0 left-0 z-40 w-72 bg-gray-50 dark:bg-dark-surface/50 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 flex flex-col
         ${isSidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:translate-x-0'}
      `}>
         <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <button 
                onClick={() => { onCreateSession(); setSidebarOpen(false); }}
                className="w-full py-3 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl flex items-center justify-center gap-2 font-medium text-primary dark:text-white shadow-sm transition-all hover:shadow-md"
            >
                <Icons.Plus size={18} /> 新对话
            </button>
         </div>
         
         <div className="flex-1 overflow-y-auto p-3 space-y-1">
             <h3 className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">近期记录</h3>
             {chatSessions.sort((a,b) => b.updatedAt - a.updatedAt).map(session => (
                 <div 
                    key={session.id}
                    className={`group flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all ${
                        session.id === currentSessionId 
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm border border-gray-100 dark:border-gray-600' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-gray-900'
                    }`}
                    onClick={() => { onSwitchSession(session.id); setSidebarOpen(false); }}
                 >
                     <div className="flex items-center gap-3 overflow-hidden">
                         <Icons.MessageSquare size={16} className={`shrink-0 ${session.id === currentSessionId ? 'text-primary' : 'opacity-50'}`} />
                         <span className="text-sm truncate font-medium">{session.title}</span>
                     </div>
                     {chatSessions.length > 1 && (
                         <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-md transition-all"
                         >
                             <Icons.Trash2 size={14} />
                         </button>
                     )}
                 </div>
             ))}
         </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative bg-white dark:bg-dark-bg">
        
        {/* Header - Mobile Only or simple title */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 shrink-0 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-md absolute top-0 left-0 right-0 z-20">
             <div className="flex items-center gap-1.5">
                {onBack && (
                  <button onClick={onBack} className="p-2 -ml-2 text-gray-500 md:hidden hover:bg-gray-100 rounded-lg">
                      <Icons.ChevronLeft size={24} />
                  </button>
                )}
                <button onClick={() => setSidebarOpen(true)} className={`p-2 text-gray-500 md:hidden hover:bg-gray-100 rounded-lg ${!onBack ? '-ml-2' : ''}`}>
                    <Icons.Menu size={20} />
                </button>
                <div className="flex flex-col ml-1">
                    <span className="font-bold text-gray-800 dark:text-white text-sm flex items-center gap-2">
                         {currentSession?.title || '智能助手'}
                         <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-medium">Gemini 2.5</span>
                    </span>
                </div>
             </div>
             <button onClick={onCreateSession} className="p-2 text-gray-400 hover:text-primary transition-colors">
                 <Icons.Edit size={18} />
             </button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden pt-16 relative">
            {/* Messages List */}
            <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-hide pb-32"
            >
            {chatHistory.length <= 1 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 animate-[fadeIn_0.5s_ease-out]">
                     <div className="w-16 h-16 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center mb-6 text-white transform rotate-3">
                        <Icons.Bot size={32} />
                     </div>
                     <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">我是启法 AI 助手</h2>
                     <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium text-center max-w-xs">
                         基于你的档案定制回答。<br/>试着问我这些问题：
                     </p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl px-2">
                         {SUGGESTED_QUESTIONS.slice(0, 4).map((q, idx) => (
                             <button 
                                key={idx}
                                onClick={() => handleSuggestionClick(q)}
                                className="text-left px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all text-sm text-gray-700 dark:text-gray-300 shadow-sm hover:shadow-md"
                             >
                                 {q}
                             </button>
                         ))}
                     </div>
                </div>
            ) : (
                chatHistory.map((msg) => (
                <div key={msg.id} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.2s_ease-out]`}>
                    <div className={`flex max-w-[85%] md:max-w-[70%] gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        {msg.sender === 'bot' && (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center shrink-0 mt-1 border border-emerald-200 dark:border-emerald-800">
                                <Icons.Bot size={16} />
                            </div>
                        )}
                        <div className={`px-5 py-3.5 rounded-2xl text-[15px] shadow-sm leading-relaxed ${
                            msg.sender === 'user' 
                            ? 'bg-gradient-to-br from-primary to-blue-600 text-white rounded-tr-none' 
                            : 'bg-white dark:bg-dark-surface text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700'
                        }`}>
                            {msg.sender === 'user' ? (
                                 <div className="whitespace-pre-wrap">{msg.content}</div>
                            ) : (
                                 <div className="markdown-body">{formatMessageContent(msg.content)}</div>
                            )}
                        </div>
                    </div>
                </div>
                ))
            )}
            
            {isTyping && (
                <div className="flex w-full justify-start animate-[fadeIn_0.2s_ease-out]">
                    <div className="flex gap-3 max-w-[90%]">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center shrink-0 mt-1">
                            <Icons.Bot size={16} />
                        </div>
                        <div className="bg-white dark:bg-dark-surface px-5 py-4 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                </div>
            )}
            </div>

            {/* Input Area - Floating */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:pb-6 bg-gradient-to-t from-white via-white to-transparent dark:from-dark-bg dark:via-dark-bg z-20">
                <form onSubmit={handleSubmit} className="relative flex items-end gap-2 max-w-3xl mx-auto w-full bg-white dark:bg-dark-surface p-2 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-200 dark:border-gray-700">
                    <div className="flex-1 min-h-[44px] flex items-center">
                        <input 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="输入你的问题..."
                            className="w-full bg-transparent border-none text-gray-900 dark:text-gray-100 text-base rounded-full pl-4 pr-2 focus:ring-0 placeholder:text-gray-400"
                            disabled={isTyping}
                            autoComplete="off"
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={!inputValue.trim() || isTyping}
                        className="p-2.5 bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:bg-gray-300 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Icons.Send size={18} className={inputValue.trim() ? "ml-0.5" : ""} />
                    </button>
                </form>
                <p className="text-center text-[10px] text-gray-400 mt-2">AI 生成内容可能包含错误，请结合实际情况判断。</p>
            </div>
        </div>
      </div>
    </div>
  );
};
