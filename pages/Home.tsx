
import React from 'react';
import { Icons } from '../components/Icon';
import { ProgressBar } from '../components/ProgressBar';
import { TaskItem } from '../components/TaskItem';
import { RECOMMENDED_TASKS } from '../types';
import type { UserProfile, Task, Page, TaskCategory } from '../types';
import { getSmartRecommendations, calculateRecommendedDueDate } from '../services/recommendations';

interface HomeProps {
  user: UserProfile;
  tasks: Task[];
  getProgress: (cat?: any) => number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddTask: () => void;
  onNavigate: (page: Page) => void;
  onQuickAdd: (title: string, category: TaskCategory, dueDate: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
}

export const Home: React.FC<HomeProps> = ({ 
    user, tasks, getProgress, onToggle, onDelete, onAddTask, onNavigate, onQuickAdd, onUpdateTask
}) => {
  const daysLeft = Math.max(0, Math.ceil((new Date(user.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
  
  // --- Timeline Logic ---
  const timelineTasks = tasks
    .filter(t => t.status !== 'DONE' && t.dueDate)
    .sort((a, b) => {
        const dateA = new Date(a.dueDate!).getTime();
        const dateB = new Date(b.dueDate!).getTime();
        if (dateA !== dateB) return dateA - dateB;
        
        const priorityScore = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        return priorityScore[b.priority] - priorityScore[a.priority];
    })
    .slice(0, 6); 

  const homeRecommendations = getSmartRecommendations(user, 'HOME');

  const getDaysDiff = (dateStr: string) => {
      const today = new Date();
      today.setHours(0,0,0,0);
      const target = new Date(dateStr);
      target.setHours(0,0,0,0);
      const diffTime = target.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  };

  const getPriorityColor = (priority: string) => {
      switch (priority) {
          case 'HIGH': return 'bg-red-500 border-red-200';
          case 'MEDIUM': return 'bg-blue-500 border-blue-200';
          case 'LOW': return 'bg-green-500 border-green-200';
          default: return 'bg-gray-400 border-gray-200';
      }
  };

  // --- Empty State ---
  if (tasks.length === 0) {
      return (
          <div className="space-y-8 animate-[fadeIn_0.5s_ease-out] flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
              <div className="space-y-4 max-w-2xl mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-tr from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <Icons.Plane size={48} className="text-primary drop-shadow-sm" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                      你好，{user.name}！
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 text-lg max-w-lg mx-auto leading-relaxed">
                      欢迎开启留学之旅。目前还没有任务，我们为你精选了一些<span className="text-primary font-semibold">必做准备</span>，点击即可一键添加。
                  </p>
              </div>

              <div className="w-full max-w-4xl bg-white dark:bg-dark-surface rounded-2xl shadow-xl shadow-blue-100/50 dark:shadow-none border border-gray-100 dark:border-gray-700 p-6 md:p-8 text-left">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 text-lg">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg"><Icons.Check className="text-primary" size={20} /></div>
                      推荐的起步任务
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {RECOMMENDED_TASKS.filter(t => t.category === 'PRE_DEPARTURE').slice(0, 4).map(task => {
                          const dynamicDate = calculateRecommendedDueDate(task.title, task.category, user.startDate);
                          return (
                            <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group cursor-pointer" onClick={() => onQuickAdd(task.title, task.category, dynamicDate)}>
                                <div className="flex-1 pr-4">
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{task.title}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-xs text-blue-600 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded font-medium">行前</span>
                                        <span className="text-xs text-gray-400 flex items-center gap-1"><Icons.Clock size={10} /> {dynamicDate}</span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all shadow-sm">
                                    <Icons.Plus size={20} />
                                </div>
                            </div>
                          );
                      })}
                  </div>
                  <div className="mt-8 text-center">
                      <button onClick={onAddTask} className="text-gray-500 hover:text-primary text-sm font-medium transition-colors border-b border-transparent hover:border-primary pb-0.5">
                          或者，手动创建自定义任务
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // --- Main Dashboard ---
  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            早安，{user.name.split(' ')[0]}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-base flex items-center gap-2">
             距离 <span className="font-semibold text-gray-700 dark:text-gray-300">{user.school}</span> 开学还有 
             <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold">{daysLeft} 天</span>
          </p>
        </div>
        <button 
          onClick={onAddTask}
          className="w-full md:w-auto px-6 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 font-semibold" 
        >
          <Icons.Plus size={20} />
          <span>新增任务</span>
        </button>
      </div>

      {/* Progress Cards - Refined Visuals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
            { id: 'PRE_DEPARTURE', title: '行前准备', desc: '签证、机票', icon: Icons.Plane, color: 'text-blue-600', bg: 'bg-blue-50', bar: 'bg-blue-500', nav: 'PRE_DEPARTURE' },
            { id: 'ARRIVAL', title: '抵达法国', desc: '医保、银行', icon: Icons.House, color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500', nav: 'ARRIVAL' },
            { id: 'LIFE', title: '我的生活', desc: '交通、房补', icon: Icons.Life, color: 'text-orange-600', bg: 'bg-orange-50', bar: 'bg-orange-500', nav: 'LIFE' },
            { id: 'STUDY', title: '学习中心', desc: '注册、选课', icon: Icons.Study, color: 'text-violet-600', bg: 'bg-violet-50', bar: 'bg-violet-500', nav: 'STUDY' },
        ].map((item) => (
            <div 
              key={item.id}
              onClick={() => onNavigate(item.nav as Page)}
              className="bg-white dark:bg-dark-surface rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 ${item.bg} rounded-bl-full opacity-50 -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-2.5 rounded-xl ${item.bg} dark:bg-opacity-10`}>
                   <item.icon size={24} className={item.color} />
                </div>
                <span className={`text-2xl font-bold ${item.color}`}>{getProgress(item.id as any)}%</span>
              </div>
              
              <div className="relative z-10">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{item.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">{item.desc}</p>
                  <ProgressBar value={getProgress(item.id as any)} colorClass={item.bar} heightClass="h-1.5" />
              </div>
            </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Timeline Section */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Icons.Clock className="text-primary" size={24} /> 近期任务
            </h2>
            <button 
                onClick={() => onNavigate('PRE_DEPARTURE')}
                className="text-sm text-primary hover:text-blue-700 font-medium transition-colors"
            >
                查看全部 &rarr;
            </button>
          </div>
          
          <div className="relative pl-2">
            {timelineTasks.length > 0 ? (
                <div className="space-y-0 relative">
                    {/* Continuous vertical line */}
                    <div className="absolute left-[7px] top-2 bottom-6 w-0.5 bg-gray-100 dark:bg-gray-700"></div>
                    
                    {timelineTasks.map((task, idx) => {
                        const daysDiff = getDaysDiff(task.dueDate!);
                        const isOverdue = daysDiff < 0;
                        const isUrgent = daysDiff <= 7 && daysDiff >= 0;
                        
                        return (
                            <div key={task.id} className="relative pl-8 pb-8 last:pb-0 group">
                                {/* Timeline Dot */}
                                <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-[3px] bg-white dark:bg-dark-surface z-10 ${getPriorityColor(task.priority)} shadow-sm transition-transform group-hover:scale-110`}></div>
                                
                                {/* Date Label */}
                                <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-2">
                                    <span className="font-mono tracking-tight">{task.dueDate}</span>
                                    {isOverdue && <span className="text-red-600 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full scale-90 origin-left">已逾期 {Math.abs(daysDiff)} 天</span>}
                                    {isUrgent && <span className="text-orange-600 bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 rounded-full scale-90 origin-left">剩余 {daysDiff} 天</span>}
                                    {!isOverdue && !isUrgent && <span className="text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full scale-90 origin-left">{daysDiff} 天后</span>}
                                </div>

                                {/* Use TaskItem directly but inside the timeline structure */}
                                <div className="transform transition-transform hover:translate-x-1">
                                    <TaskItem 
                                        task={task} 
                                        onToggle={onToggle} 
                                        onDelete={onDelete} 
                                        onUpdate={onUpdateTask}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="py-16 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-gray-400 mb-3">暂无待办任务</p>
                    <button onClick={onAddTask} className="text-primary text-sm font-semibold hover:underline">
                        + 添加新任务
                    </button>
                </div>
            )}
          </div>
        </div>

        {/* AI Recommendations - Right Column */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 sticky top-28">
             <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="p-2 bg-gradient-to-br from-primary to-blue-600 rounded-lg text-white shadow-sm">
                   <Icons.Bot size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {homeRecommendations?.title || 'AI 智能建议'}
                </h2>
             </div>
             
             <div className="space-y-3">
                {homeRecommendations?.items.map(item => (
                   <div key={item.id} className={`p-4 rounded-xl border transition-all hover:shadow-sm ${
                      item.type === 'URGENT' 
                        ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' 
                        : 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30'
                   }`}>
                      <div className="flex gap-3">
                        <span className="text-xl shrink-0 filter drop-shadow-sm">{item.icon}</span>
                        <div>
                            <p className="text-gray-800 dark:text-gray-200 text-sm font-medium leading-snug">{item.text}</p>
                            {item.type === 'URGENT' && <span className="text-[10px] text-red-500 font-bold mt-1 block">需重点关注</span>}
                        </div>
                      </div>
                   </div>
                ))}
                
                {getProgress('PRE_DEPARTURE') < 50 && (
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30 flex gap-3">
                     <span className="text-xl">⚠️</span>
                     <p className="text-gray-800 dark:text-gray-200 text-sm font-medium">行前准备进度滞后，请优先处理签证材料。</p>
                  </div>
                )}
             </div>
             
             <button onClick={() => onNavigate('ASSISTANT')} className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-primary transition-colors flex items-center justify-center gap-1">
                <span>进入 AI 助手</span>
                <Icons.ChevronRight size={14} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
