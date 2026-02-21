
import React, { useState } from 'react';
import type { TaskCategory } from '../types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, category: TaskCategory, dueDate: string) => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('PRE_DEPARTURE');
  const [dueDate, setDueDate] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    onAdd(title, category, dueDate);
    setTitle('');
    setDueDate('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-lg animate-[fadeIn_0.2s_ease-out]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">新增任务</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-3xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-600 mb-2 text-sm font-medium">任务名称</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-100 text-gray-900 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50" 
              placeholder="例如：预约体检" 
              autoFocus
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-2 text-sm font-medium">分类</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              className="w-full bg-gray-100 text-gray-900 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="PRE_DEPARTURE">行前准备</option>
              <option value="ARRIVAL">抵达法国</option>
              <option value="LIFE">日常生活</option>
              <option value="STUDY">学习中心</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-600 mb-2 text-sm font-medium">截止日期</label>
            <input 
              type="date" 
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-gray-100 text-gray-900 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50" 
            />
          </div>
          <div className="flex justify-end pt-4 gap-3">
             <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
             <button type="submit" className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-lg shadow-md transition-all">保存任务</button>
          </div>
        </form>
      </div>
    </div>
  );
};
