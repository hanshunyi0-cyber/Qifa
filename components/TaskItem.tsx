
import React, { useState } from 'react';
import type { Task } from '../types';
import { Icons } from './Icon';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Task>) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, onUpdate }) => {
  const isDone = task.status === 'DONE';
  const [isEditingDate, setIsEditingDate] = useState(false);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onUpdate) {
          onUpdate(task.id, { dueDate: e.target.value });
      }
  };

  const priorityConfig = {
      HIGH: { color: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30', label: '高优' },
      MEDIUM: { color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30', label: '中' },
      LOW: { color: 'text-gray-500 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700', label: '低' },
  };

  const categoryConfig = {
      PRE_DEPARTURE: { bg: 'bg-sky-50 text-sky-600', label: '行前' },
      ARRIVAL: { bg: 'bg-emerald-50 text-emerald-600', label: '抵达' },
      LIFE: { bg: 'bg-orange-50 text-orange-600', label: '生活' },
      STUDY: { bg: 'bg-violet-50 text-violet-600', label: '学习' },
  };

  const pConfig = priorityConfig[task.priority] || priorityConfig.LOW;
  const cConfig = categoryConfig[task.category];

  return (
    <div className={`
        group relative flex items-center justify-between p-4 mb-3
        bg-white dark:bg-dark-surface rounded-xl border border-gray-100 dark:border-gray-700
        transition-all duration-200 ease-in-out
        ${isDone ? 'opacity-60 grayscale-[0.5]' : 'hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 hover:-translate-y-0.5'}
    `}>
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button 
          onClick={() => onToggle(task.id)}
          className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
            isDone 
              ? 'bg-green-500 border-green-500 scale-100' 
              : 'border-gray-300 hover:border-primary active:scale-95'
          }`}
        >
          {isDone && <Icons.Check size={14} className="text-white animate-[fadeIn_0.2s_ease-out]" />}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
              <p className={`font-medium text-base truncate transition-colors ${isDone ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
                {task.title}
              </p>
              {!isDone && task.priority === 'HIGH' && (
                   <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
              )}
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${pConfig.color}`}>
                  {pConfig.label}
              </span>
              
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  {isEditingDate && onUpdate ? (
                      <input 
                        type="date"
                        className="text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        value={task.dueDate || ''}
                        onChange={handleDateChange}
                        onBlur={() => setIsEditingDate(false)}
                        autoFocus
                      />
                  ) : (
                      <div 
                        className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors py-0.5 rounded"
                        onClick={() => onUpdate && setIsEditingDate(true)}
                        title="点击修改截止日期"
                      >
                        <Icons.Calendar size={12} />
                        <span>{task.dueDate || '无日期'}</span>
                      </div>
                  )}
              </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-2">
        <span className={`hidden md:inline-block text-xs px-2 py-1 rounded-full font-medium ${cConfig.bg} dark:bg-opacity-20`}>
          {cConfig.label}
        </span>
        <button 
            onClick={() => onDelete(task.id)} 
            className="text-gray-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
            title="删除任务"
        >
          <Icons.Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};
