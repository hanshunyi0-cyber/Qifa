
import React, { useState } from 'react';
import type { Task, StudyResource, ResourceCategory, UserProfile } from '../types';
import { Icons } from '../components/Icon';
import { ProgressBar } from '../components/ProgressBar';
import { TaskItem } from '../components/TaskItem';

interface StudyCenterProps {
  user: UserProfile;
  tasks: Task[];
  resources: StudyResource[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddTask: () => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onAddResource: (res: Omit<StudyResource, 'id'>, file?: File) => Promise<{ success: boolean; message: string }>;
  onDeleteResource: (id: string) => void;
}

const ResourceCard: React.FC<{ res: StudyResource, isAdmin: boolean, onDelete: () => void }> = ({ res, isAdmin, onDelete }) => {
    const getIcon = () => {
        switch(res.category) {
            case 'EXCHANGE_GUIDE': return <Icons.Plane className="text-blue-500" />;
            case 'EXAM_PAPER': return <Icons.FileText className="text-orange-500" />;
            case 'COURSE_NOTE': return <Icons.Edit className="text-green-500" />;
            case 'LANGUAGE_PREP': return <Icons.MessageSquare className="text-purple-500" />;
            default: return <Icons.FileText className="text-gray-500" />;
        }
    };

    const getBadge = () => {
      switch(res.category) {
          case 'EXCHANGE_GUIDE': return <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full">交换指南</span>;
          case 'EXAM_PAPER': return <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full">真题库</span>;
          case 'COURSE_NOTE': return <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full">学霸笔记</span>;
          case 'LANGUAGE_PREP': return <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full">语言备考</span>;
      }
    };

    const handleDownload = () => {
        if (res.downloadUrl) {
            window.open(res.downloadUrl, '_blank');
        } else {
            alert("该资源暂无下载链接");
        }
    };

    return (
        <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-violet-200 dark:hover:border-violet-800 transition-all group relative">
            {isAdmin && (
                <button 
                    onClick={onDelete}
                    className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    title="删除资源"
                >
                    <Icons.Trash2 size={16} />
                </button>
            )}
            <div className="flex justify-between items-start mb-2">
                <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                        {getIcon()}
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm line-clamp-1 group-hover:text-primary transition-colors">{res.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            {getBadge()}
                            <span className="text-xs text-gray-400">{res.size} • {res.fileType}</span>
                        </div>
                    </div>
                </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2 min-h-[2.5em]">{res.description}</p>
            
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 dark:border-gray-700">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Icons.User size={12} /> {res.author}
                </div>
                <div className="flex gap-3">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Icons.Search size={12} /> {res.downloadCount}
                    </div>
                    <button 
                        onClick={handleDownload}
                        className="text-primary hover:text-primary/80 text-xs font-bold flex items-center gap-1"
                    >
                        <Icons.Share2 size={12} /> 下载
                    </button>
                </div>
            </div>
        </div>
    );
};

export const StudyCenter: React.FC<StudyCenterProps> = ({ 
    user, tasks, resources, onToggle, onDelete, onAddTask, onUpdateTask, onAddResource, onDeleteResource
}) => {
  const [activeTab, setActiveTab] = useState<ResourceCategory | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Upload Modal State
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'FILE' | 'LINK'>('FILE');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newRes, setNewRes] = useState<{
      title: string; category: ResourceCategory; description: string; link: string; author: string
  }>({
      title: '', category: 'EXCHANGE_GUIDE', description: '', link: '', author: '管理员'
  });

  const studyTasks = tasks.filter(t => t.category === 'STUDY');
  const doneCount = studyTasks.filter(t => t.status === 'DONE').length;
  const progress = studyTasks.length ? Math.round((doneCount / studyTasks.length) * 100) : 0;

  const filteredResources = resources.filter(res => {
      const matchesTab = activeTab === 'ALL' || res.category === activeTab;
      const matchesSearch = res.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            res.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
  });

  const handleUpload = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!newRes.title) return alert('请输入标题');
      if (uploadType === 'LINK' && !newRes.link) return alert('请输入链接');
      if (uploadType === 'FILE' && !selectedFile) return alert('请选择文件');

      setIsUploading(true);

      const result = await onAddResource({
          title: newRes.title,
          category: newRes.category,
          description: newRes.description,
          author: newRes.author,
          downloadCount: 0,
          size: 'Unknown',
          fileType: 'LINK', // Will be overwritten by file logic if file exists
          uploadDate: new Date().toLocaleDateString(),
          timestamp: Date.now(),
          downloadUrl: uploadType === 'LINK' ? newRes.link : ''
      }, uploadType === 'FILE' && selectedFile ? selectedFile : undefined);

      setIsUploading(false);

      if(result.success) {
          setUploadModalOpen(false);
          setNewRes({ title: '', category: 'EXCHANGE_GUIDE', description: '', link: '', author: '管理员' });
          setSelectedFile(null);
          alert('上传成功');
      } else {
          alert(result.message);
      }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
        {/* Upload Modal */}
        {isUploadModalOpen && (
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-dark-surface w-full max-w-lg rounded-2xl shadow-xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg dark:text-white">上传新资源</h3>
                        <button onClick={() => setUploadModalOpen(false)} className="text-gray-400 hover:text-gray-600"><Icons.Check className="rotate-45" size={24} /></button>
                    </div>
                    
                    {/* Upload Type Toggle */}
                    <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
                        <button 
                            type="button"
                            onClick={() => setUploadType('FILE')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${uploadType === 'FILE' ? 'bg-white dark:bg-gray-600 text-primary shadow-sm' : 'text-gray-500'}`}
                        >
                            本地文件
                        </button>
                        <button 
                            type="button"
                            onClick={() => setUploadType('LINK')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${uploadType === 'LINK' ? 'bg-white dark:bg-gray-600 text-primary shadow-sm' : 'text-gray-500'}`}
                        >
                            外部链接
                        </button>
                    </div>

                    <form onSubmit={handleUpload} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">资源标题</label>
                            <input required value={newRes.title} onChange={e => setNewRes({...newRes, title: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="如：2024真题" />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">分类</label>
                            <select value={newRes.category} onChange={e => setNewRes({...newRes, category: e.target.value as ResourceCategory})} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <option value="EXCHANGE_GUIDE">交换指南</option>
                                <option value="EXAM_PAPER">真题库</option>
                                <option value="COURSE_NOTE">高分笔记</option>
                                <option value="LANGUAGE_PREP">语言备考</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">简介</label>
                            <textarea value={newRes.description} onChange={e => setNewRes({...newRes, description: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows={3} placeholder="简要描述资源内容..." />
                        </div>

                        {uploadType === 'FILE' ? (
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">选择文件</label>
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-primary transition-colors bg-gray-50 dark:bg-gray-800">
                                    <input 
                                        type="file" 
                                        id="file-upload"
                                        className="hidden" 
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setSelectedFile(e.target.files[0]);
                                                if(!newRes.title) setNewRes({...newRes, title: e.target.files[0].name.split('.')[0]});
                                            }
                                        }}
                                    />
                                    <label htmlFor="file-upload" className="cursor-pointer">
                                        <div className="text-gray-500 dark:text-gray-400">
                                            {selectedFile ? (
                                                <div className="flex items-center justify-center gap-2 text-primary font-medium">
                                                    <Icons.FileText size={20} />
                                                    {selectedFile.name}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <Icons.FolderOpen size={24} className="mb-2" />
                                                    <span>点击选择文件</span>
                                                    <span className="text-xs text-gray-400 mt-1">支持 PDF, Word, Zip 等格式</span>
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">外部链接</label>
                                <input value={newRes.link} onChange={e => setNewRes({...newRes, link: e.target.value})} placeholder="https://..." className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-4">
                            <button type="button" onClick={() => setUploadModalOpen(false)} disabled={isUploading} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50">取消</button>
                            <button type="submit" disabled={isUploading} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isUploading && <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>}
                                {isUploading ? '上传中...' : '确认发布'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 md:p-8 text-white shadow-lg shadow-violet-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10">
                <Icons.Study size={180} />
            </div>
            <div className="relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                            <Icons.Study size={32} /> 学习中心
                        </h1>
                        <p className="mt-2 text-violet-100 max-w-xl">
                            这里汇集了中法项目的核心学术资源。从出国前的语言备考，到交换期间的选课指南与真题复习，助力你的 GPA 提升。
                        </p>
                    </div>
                    {user.role === 'ADMIN' && (
                        <button 
                            onClick={() => setUploadModalOpen(true)}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all border border-white/20"
                        >
                            <Icons.Plus size={18} /> 上传资源
                        </button>
                    )}
                </div>
                
                <div className="mt-6 flex gap-4 text-sm font-medium">
                   <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center gap-2">
                       <Icons.FileText size={16} /> 资源总数: {resources.length}
                   </div>
                   <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center gap-2">
                       <Icons.Check size={16} /> 任务进度: {progress}%
                   </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Study Tasks (For Progress Bar) */}
            <div className="space-y-4">
                <div className="bg-white dark:bg-dark-surface p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm sticky top-24">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Icons.Check className="text-green-500" size={20} /> 我的学习任务
                        </h3>
                        <button onClick={onAddTask} className="text-primary text-sm hover:underline">+ 新增</button>
                    </div>
                    
                    <div className="mb-4">
                        <div className="flex justify-between mb-1 text-xs text-gray-500">
                            <span>完成度</span>
                            <span>{progress}%</span>
                        </div>
                        <ProgressBar value={progress} colorClass="bg-violet-500" />
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-hide">
                        {studyTasks.length === 0 ? (
                            <p className="text-center text-gray-400 text-sm py-4">暂无学习类任务</p>
                        ) : (
                            studyTasks.sort((a,b) => (a.status==='DONE'?1:-1)).map(task => (
                                <TaskItem key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} onUpdate={onUpdateTask} />
                            ))
                        )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-400 leading-relaxed">
                            <Icons.AlertTriangle size={12} className="inline mr-1" />
                            此处的任务进度将直接同步至首页。建议将"行政注册"、"选课"等关键节点添加至此。
                        </p>
                    </div>
                </div>
            </div>

            {/* Right: Resource Library */}
            <div className="lg:col-span-2 space-y-6">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
                        <button onClick={() => setActiveTab('ALL')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'ALL' ? 'bg-white dark:bg-gray-600 text-primary shadow-sm' : 'text-gray-500'}`}>全部</button>
                        <button onClick={() => setActiveTab('EXCHANGE_GUIDE')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'EXCHANGE_GUIDE' ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm' : 'text-gray-500'}`}>交换指南</button>
                        <button onClick={() => setActiveTab('EXAM_PAPER')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'EXAM_PAPER' ? 'bg-white dark:bg-gray-600 text-orange-600 shadow-sm' : 'text-gray-500'}`}>真题库</button>
                        <button onClick={() => setActiveTab('COURSE_NOTE')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'COURSE_NOTE' ? 'bg-white dark:bg-gray-600 text-green-600 shadow-sm' : 'text-gray-500'}`}>高分笔记</button>
                        <button onClick={() => setActiveTab('LANGUAGE_PREP')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'LANGUAGE_PREP' ? 'bg-white dark:bg-gray-600 text-purple-600 shadow-sm' : 'text-gray-500'}`}>语言备考</button>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="搜索资源..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-violet-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Resource Grid */}
                {filteredResources.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-dark-surface rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                        <Icons.FolderOpen className="mx-auto text-gray-300 mb-2" size={32} />
                        <p className="text-gray-500 dark:text-gray-400">未找到相关资源</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredResources.map(res => (
                            <ResourceCard 
                                key={res.id} 
                                res={res} 
                                isAdmin={user.role === 'ADMIN'}
                                onDelete={() => onDeleteResource(res.id)}
                            />
                        ))}
                    </div>
                )}
                
                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
                    <Icons.Shield className="text-blue-600 mt-0.5" size={18} />
                    <div>
                        <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300">资源由管理员审核上传</h4>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            为保证学术资料的准确性，所有上传文件均经过教务处或各专业负责人审核。如果您有优质的笔记或真题想要分享，请联系管理员 (admin@qifa.com)。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
