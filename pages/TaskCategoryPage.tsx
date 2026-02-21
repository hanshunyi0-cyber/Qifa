
import React from 'react';
import type { Task, TaskCategory } from '../types';
import { RECOMMENDED_TASKS } from '../types';
import { TaskItem } from '../components/TaskItem';
import { ProgressBar } from '../components/ProgressBar';
import { Icons } from '../components/Icon';
import { useAppLogic } from '../hooks/useAppLogic'; // Need user info
import { getSmartRecommendations, calculateRecommendedDueDate } from '../services/recommendations';

interface TaskCategoryPageProps {
  title: string;
  category: TaskCategory;
  icon: React.ReactNode;
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddTask: () => void;
  onQuickAdd: (title: string, category: TaskCategory, dueDate: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
}

export const TaskCategoryPage: React.FC<TaskCategoryPageProps> = ({ 
    title, category, icon, tasks, onToggle, onDelete, onAddTask, onQuickAdd, onUpdateTask
}) => {
  const { user } = useAppLogic(); // Retrieve user profile for recommendations
  
  const categoryTasks = tasks.filter(t => t.category === category);
  const doneCount = categoryTasks.filter(t => t.status === 'DONE').length;
  const progress = categoryTasks.length ? Math.round((doneCount / categoryTasks.length) * 100) : 0;

  // Get recommendations that are NOT already in the user's list (by title matching for simplicity)
  const availableRecommendations = RECOMMENDED_TASKS.filter(
      rt => rt.category === category && !tasks.some(ut => ut.title === rt.title)
  );

  // Get AI Smart Recommendations
  const smartAdvice = getSmartRecommendations(user, category);

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                {icon} {title}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm md:text-base">
                共 {categoryTasks.length} 个任务，已完成 {doneCount} 个
            </p>
        </div>
        <button 
          onClick={onAddTask}
          className="btn bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 shadow-sm flex items-center justify-center gap-2 w-full md:w-auto transition-all"
        >
            <Icons.Plus size={18} /> 新增自定义任务
        </button>
      </div>

      <div className="bg-white dark:bg-dark-surface p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between mb-2 text-sm font-medium">
            <span className="text-gray-600 dark:text-gray-400">当前进度</span>
            <span className="text-primary">{progress}%</span>
        </div>
        <ProgressBar value={progress} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Task List - Takes 2 columns on Desktop, full on Mobile */}
         <div className="lg:col-span-2 space-y-4">
             {categoryTasks.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-8 bg-white dark:bg-dark-surface rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                     <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-full mb-3">
                        <Icons.FileText className="text-gray-400" size={24} />
                     </div>
                     <p className="text-gray-500 dark:text-gray-400 font-medium">该模块暂时没有任务</p>
                     <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">从右侧建议中选择，或手动添加</p>
                 </div>
             ) : (
                categoryTasks.sort((a, b) => {
                     // Sort by done status (done at bottom), then priority, then date
                     if (a.status === 'DONE' && b.status !== 'DONE') return 1;
                     if (a.status !== 'DONE' && b.status === 'DONE') return -1;
                     return 0;
                }).map(task => (
                    <TaskItem key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} onUpdate={onUpdateTask} />
                ))
             )}

             {/* Quick Add Recommendations */}
             {availableRecommendations.length > 0 && (
                 <div className="mt-8">
                     <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                         推荐添加的任务
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         {availableRecommendations.map(rec => {
                             // Calculate dynamic date
                             const dynamicDate = calculateRecommendedDueDate(rec.title, rec.category, user.startDate);
                             return (
                                 <div key={rec.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-transparent hover:border-primary/30 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group">
                                     <div className="overflow-hidden">
                                         <p className="font-medium text-gray-700 dark:text-gray-300 truncate">{rec.title}</p>
                                         <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                             <Icons.Clock size={10} /> 建议: {dynamicDate}
                                         </p>
                                     </div>
                                     <button 
                                         onClick={() => onQuickAdd(rec.title, rec.category, dynamicDate)}
                                         className="w-8 h-8 shrink-0 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-primary flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-colors shadow-sm"
                                         title="添加"
                                     >
                                         <Icons.Plus size={16} />
                                     </button>
                                 </div>
                             );
                         })}
                     </div>
                 </div>
             )}
         </div>
         
         {/* Sidebar / Smart Advice */}
         <div className="space-y-6">
             {smartAdvice && (
                <div className="bg-white dark:bg-dark-surface p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                       <Icons.Bot className="text-primary" size={20} /> 
                       {smartAdvice.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        {smartAdvice.description}
                    </p>
                    
                    <div className="space-y-3">
                        {smartAdvice.items.map(item => (
                            <div key={item.id} className="flex gap-3 items-start text-sm p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                <span className="text-lg shrink-0">{item.icon}</span>
                                <div>
                                    <p className="text-gray-700 dark:text-gray-300 leading-snug">{item.text}</p>
                                    {item.type === 'URGENT' && (
                                        <span className="inline-block mt-1 text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
                                            重要
                                        </span>
                                    )}
                                    {item.type === 'CHECKLIST' && (
                                         <span className="inline-block mt-1 text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                                            清单
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             )}
         </div>
      </div>
    </div>
  );
};
