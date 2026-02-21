
import React, { useState } from 'react';
import { Icons } from '../components/Icon';
import type { UserProfile, Post, Comment, Report, Feedback } from '../types';

interface CommunityProps {
  user: UserProfile;
  posts: Post[];
  reports: Report[];
  feedbacks: Feedback[];
  onCreatePost: (title: string, content: string) => { success: boolean; message: string };
  onDeletePost: (id: string) => void;
  onLike: (id: string) => void;
  onComment: (id: string, content: string) => { success: boolean; message: string };
  onReport: (id: string, type: 'POST' | 'COMMENT', reason: string) => void;
  onResolveReport: (id: string, action: 'DISMISS' | 'DELETE_CONTENT' | 'BAN_USER') => void;
  onReplyFeedback: (id: string, content: string) => void;
}

export const Community: React.FC<CommunityProps> = ({
  user, posts, reports, feedbacks,
  onCreatePost, onDeletePost, onLike, onComment, onReport, onResolveReport, onReplyFeedback
}) => {
  const [activeTab, setActiveTab] = useState<'LATEST' | 'MY_POSTS' | 'ADMIN'>('LATEST');
  const [adminView, setAdminView] = useState<'REPORTS' | 'FEEDBACKS'>('REPORTS');
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  // Create Post State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  
  // Interaction State
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  
  // Report Modal State
  const [reportTarget, setReportTarget] = useState<{id: string, type: 'POST' | 'COMMENT'} | null>(null);
  const [reportReason, setReportReason] = useState('');

  // Admin Reply State
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    
    const result = onCreatePost(newTitle, newContent);
    if (result.success) {
      setCreateModalOpen(false);
      setNewTitle('');
      setNewContent('');
      alert("发布成功！");
    } else {
      alert(result.message);
    }
  };

  const handleCommentSubmit = (postId: string) => {
    if (!commentText.trim()) return;
    const result = onComment(postId, commentText);
    if (result.success) {
      setCommentText('');
    } else {
      alert(result.message);
    }
  };

  const handleReportSubmit = () => {
    if (!reportTarget || !reportReason) return;
    onReport(reportTarget.id, reportTarget.type, reportReason);
    setReportTarget(null);
    setReportReason('');
    alert("举报已提交，管理员将尽快审核。");
  };

  const handleAdminReply = (feedbackId: string) => {
      const text = replyText[feedbackId];
      if (!text || !text.trim()) return;
      onReplyFeedback(feedbackId, text);
      setReplyText(prev => ({ ...prev, [feedbackId]: '' }));
  };

  const filteredPosts = activeTab === 'MY_POSTS' 
    ? posts.filter(p => p.authorId === (user.email || user.phone)) 
    : posts;

  return (
    <div className="flex flex-col xl:flex-row gap-8 animate-[fadeIn_0.3s_ease-out]">
      
      {/* Left/Center: Feed */}
      <div className="flex-1 min-w-0">
        {/* Header & Tabs */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg text-pink-500"><Icons.MessageSquare size={24} /></div>
              留学生社区
            </h1>
            <button 
              onClick={() => setCreateModalOpen(true)}
              className="w-full sm:w-auto bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Icons.Plus size={20} /> 发布新帖
            </button>
          </div>
          
          <div className="flex gap-8 border-b border-gray-100 dark:border-gray-700 overflow-x-auto scrollbar-hide">
            <button 
              onClick={() => setActiveTab('LATEST')}
              className={`pb-3 px-1 font-semibold text-sm transition-colors relative whitespace-nowrap ${activeTab === 'LATEST' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
            >
              最新动态
              {activeTab === 'LATEST' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full"></div>}
            </button>
            <button 
              onClick={() => setActiveTab('MY_POSTS')}
              className={`pb-3 px-1 font-semibold text-sm transition-colors relative whitespace-nowrap ${activeTab === 'MY_POSTS' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
            >
              我的发布
              {activeTab === 'MY_POSTS' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full"></div>}
            </button>
            {user.role === 'ADMIN' && (
              <button 
                onClick={() => setActiveTab('ADMIN')}
                className={`pb-3 px-1 font-semibold text-sm transition-colors relative flex items-center gap-1 whitespace-nowrap ${activeTab === 'ADMIN' ? 'text-red-500' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Icons.Shield size={14} /> 管理员后台
                {(reports.filter(r => r.status === 'PENDING').length + feedbacks.filter(f => f.status === 'PENDING').length) > 0 && (
                   <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                     {reports.filter(r => r.status === 'PENDING').length + feedbacks.filter(f => f.status === 'PENDING').length}
                   </span>
                )}
                {activeTab === 'ADMIN' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500 rounded-full"></div>}
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        {activeTab === 'ADMIN' ? (
           <div className="space-y-6">
              {/* Admin Sub-Tabs */}
              <div className="flex gap-2 mb-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
                  <button 
                    onClick={() => setAdminView('REPORTS')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        adminView === 'REPORTS' 
                        ? 'bg-white dark:bg-gray-600 text-red-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                  >
                     举报处理 ({reports.filter(r => r.status === 'PENDING').length})
                  </button>
                  <button 
                    onClick={() => setAdminView('FEEDBACKS')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        adminView === 'FEEDBACKS' 
                        ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                  >
                     建议反馈 ({feedbacks.filter(f => f.status === 'PENDING').length})
                  </button>
              </div>

              <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                {/* Admin Logic (Keep existing functionality, just styled container) */}
                {adminView === 'REPORTS' ? (
                    <>
                         <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
                           <Icons.AlertTriangle className="text-red-500" /> 待处理举报
                        </h2>
                        {reports.filter(r => r.status === 'PENDING').length === 0 ? (
                          <p className="text-gray-500 text-sm text-center py-8">暂无待处理的举报，社区环境良好。</p>
                        ) : (
                          <div className="space-y-4">
                             {reports.filter(r => r.status === 'PENDING').map(report => (
                               <div key={report.id} className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-xl">
                                  {/* Report details ... */}
                                  <div className="flex justify-between items-start">
                                     <div>
                                        <span className="text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded">
                                          {report.targetType === 'POST' ? '帖子' : '评论'}
                                        </span>
                                        <span className="text-xs text-gray-500 ml-2">
                                           举报理由: {report.reason}
                                        </span>
                                     </div>
                                     <span className="text-xs text-gray-400">
                                        {new Date(report.timestamp).toLocaleString()}
                                     </span>
                                  </div>
                                  <div className="my-3 p-3 bg-white dark:bg-dark-bg rounded-lg text-sm text-gray-800 dark:text-gray-200 italic border border-red-100/50">
                                     "{report.contentSnapshot}"
                                  </div>
                                  <div className="flex flex-wrap gap-2 mt-3">
                                     <button onClick={() => onResolveReport(report.id, 'DISMISS')} className="px-3 py-1.5 text-xs bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors">忽略</button>
                                     <button onClick={() => onResolveReport(report.id, 'DELETE_CONTENT')} className="px-3 py-1.5 text-xs bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg transition-colors">删除内容</button>
                                     <button onClick={() => onResolveReport(report.id, 'BAN_USER')} className="px-3 py-1.5 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors">删除并封禁</button>
                                  </div>
                               </div>
                             ))}
                          </div>
                        )}
                    </>
                ) : (
                     /* Feedback Admin View */
                     <>
                        <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
                           <Icons.MessageSquare className="text-blue-500" /> 用户反馈与建议
                        </h2>
                        {feedbacks.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-8">暂无反馈信息。</p>
                        ) : (
                            <div className="space-y-4">
                                {feedbacks.sort((a,b) => b.timestamp - a.timestamp).map(fb => (
                                    <div key={fb.id} className="p-5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                        {/* Feedback Item Content */}
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                                                    fb.type === 'BUG' ? 'bg-red-100 text-red-600' : 
                                                    fb.type === 'FEATURE' ? 'bg-purple-100 text-purple-600' :
                                                    'bg-blue-100 text-blue-600'
                                                }`}>
                                                    {fb.type}
                                                </span>
                                                <span className="text-sm font-semibold dark:text-gray-200">{fb.userName}</span>
                                            </div>
                                            <span className="text-xs text-gray-400">{new Date(fb.timestamp).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 bg-white dark:bg-dark-bg p-3 rounded-lg border border-gray-200 dark:border-gray-700">{fb.content}</p>

                                        {fb.status === 'REVIEWED' ? (
                                            <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-lg border border-green-100 dark:border-green-900/30">
                                                <div className="text-xs font-bold text-green-600 dark:text-green-400 mb-1 flex items-center gap-1">
                                                    <Icons.Check size={12} /> 已回复
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-300">{fb.adminReply}</p>
                                            </div>
                                        ) : (
                                            <div className="mt-2 flex gap-2">
                                                <input 
                                                    value={replyText[fb.id] || ''}
                                                    onChange={(e) => setReplyText({...replyText, [fb.id]: e.target.value})}
                                                    placeholder="输入回复内容..."
                                                    className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-bg focus:outline-none focus:border-blue-500 transition-colors"
                                                />
                                                <button 
                                                    onClick={() => handleAdminReply(fb.id)}
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors font-medium"
                                                >
                                                    回复
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                     </>
                )}
              </div>
           </div>
        ) : (
           <div className="space-y-6">
             {filteredPosts.length === 0 ? (
               <div className="text-center py-20 bg-white dark:bg-dark-surface rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                 <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icons.Coffee className="text-gray-400" size={32} />
                 </div>
                 <p className="text-gray-500 font-medium">暂时没有帖子，来发布第一条吧！</p>
               </div>
             ) : (
               filteredPosts.map(post => {
                 const isLiked = post.likes.includes(user.email || user.phone || '');
                 const isAuthor = post.authorId === (user.email || user.phone);
                 
                 return (
                   <div key={post.id} className="bg-white dark:bg-dark-surface rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                               {post.authorName.charAt(0)}
                            </div>
                            <div>
                               <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-900 dark:text-white text-base">{post.authorName}</span>
                                  {post.authorRole === 'ADMIN' && (
                                    <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                                      <Icons.Shield size={10} /> 官方
                                    </span>
                                  )}
                               </div>
                               <span className="text-xs text-gray-400">{new Date(post.timestamp).toLocaleString()}</span>
                            </div>
                         </div>
                         <div className="relative group">
                            {(isAuthor || user.role === 'ADMIN') && (
                              <button onClick={() => onDeletePost(post.id)} className="text-gray-300 hover:text-red-500 p-2 transition-colors">
                                 <Icons.Trash2 size={18} />
                              </button>
                            )}
                            {!isAuthor && (
                              <button 
                                onClick={() => setReportTarget({id: post.id, type: 'POST'})}
                                className="text-gray-300 hover:text-orange-500 p-2 ml-1" 
                                title="举报"
                              >
                                 <Icons.Flag size={18} />
                              </button>
                            )}
                         </div>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 leading-tight">{post.title}</h3>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap mb-6 text-base">{post.content}</p>

                      <div className="flex items-center gap-4 pt-4 border-t border-gray-50 dark:border-gray-700">
                         <button 
                           onClick={() => onLike(post.id)}
                           className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                               isLiked 
                               ? 'text-red-500 bg-red-50 dark:bg-red-900/10' 
                               : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                           }`}
                         >
                            <Icons.Heart size={18} fill={isLiked ? "currentColor" : "none"} className={isLiked ? "scale-110" : ""} />
                            {post.likes.length > 0 ? post.likes.length : '赞'}
                         </button>
                         <button 
                           onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                           className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                               expandedPostId === post.id
                               ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/10'
                               : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                           }`}
                         >
                            <Icons.MessageSquare size={18} />
                            {post.comments.length > 0 ? post.comments.length : '评论'}
                         </button>
                      </div>

                      {expandedPostId === post.id && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20 -mx-6 px-6 pb-2 animate-[fadeIn_0.2s_ease-out]">
                           <div className="space-y-4 mb-5">
                             {post.comments.length === 0 && <p className="text-gray-400 text-sm text-center py-4">暂无评论，快来抢沙发！</p>}
                             {post.comments.map(comment => (
                               <div key={comment.id} className="flex gap-3">
                                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs text-gray-600 dark:text-gray-300 shrink-0 font-bold">
                                     {comment.authorName.charAt(0)}
                                  </div>
                                  <div className="flex-1">
                                     <div className="bg-white dark:bg-dark-surface p-3.5 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 dark:border-gray-700">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-xs text-gray-900 dark:text-gray-100">{comment.authorName}</span>
                                            {user.role !== 'ADMIN' && comment.authorId !== (user.email || user.phone) && (
                                               <button onClick={() => setReportTarget({id: comment.id, type: 'COMMENT'})} className="text-gray-300 hover:text-orange-500">
                                                  <Icons.Flag size={12} />
                                               </button>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{comment.content}</p>
                                     </div>
                                  </div>
                               </div>
                             ))}
                           </div>
                           <div className="flex gap-2">
                              <input 
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="发表你的看法..."
                                className="flex-1 bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                              />
                              <button 
                                onClick={() => handleCommentSubmit(post.id)}
                                disabled={!commentText.trim()}
                                className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md disabled:opacity-50 disabled:shadow-none transition-all"
                              >
                                发送
                              </button>
                           </div>
                        </div>
                      )}
                   </div>
                 );
               })
             )}
           </div>
        )}
      </div>

      {/* Right Side: Guidelines & User Status */}
      <div className="w-full xl:w-80 shrink-0">
         <div className="sticky top-24 space-y-6">
            <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-lg">
                   <Icons.Shield className="text-green-600" size={24} /> 社区公约
                </h2>
                <ul className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                   <li className="flex gap-3 items-start">
                      <span className="text-green-500 bg-green-50 rounded-full p-0.5 mt-0.5"><Icons.Check size={12} /></span> 
                      <span>友善交流，尊重不同的观点和文化背景。</span>
                   </li>
                   <li className="flex gap-3 items-start">
                      <span className="text-green-500 bg-green-50 rounded-full p-0.5 mt-0.5"><Icons.Check size={12} /></span> 
                      <span>分享真实的留学经验，互帮互助。</span>
                   </li>
                   <li className="flex gap-3 items-start">
                      <span className="text-red-500 bg-red-50 rounded-full p-0.5 mt-0.5"><Icons.Trash2 size={12} /></span> 
                      <span>严禁发布广告、暴力、色情或违法信息。</span>
                   </li>
                </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
                 <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-md text-primary">
                       <Icons.User size={24} />
                    </div>
                    <div>
                       <p className="font-bold text-gray-900 dark:text-white text-lg">{user.name}</p>
                       <p className="text-xs text-gray-500 font-medium bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-full w-fit mt-1">{user.role === 'ADMIN' ? '管理员' : '正式用户'}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2 mt-4 text-sm font-medium">
                    <span className={`w-2.5 h-2.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></span>
                    <span className="text-gray-700 dark:text-gray-300">
                       状态: {user.status === 'ACTIVE' ? '正常' : user.status === 'BANNED' ? '已封禁' : '已禁言'}
                    </span>
                 </div>
             </div>
         </div>
      </div>

      {/* Create Post Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white dark:bg-dark-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out] transform scale-100">
              <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                 <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                    <Icons.Edit className="text-primary" size={20} /> 发布新帖
                 </h3>
                 <button onClick={() => setCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors bg-white dark:bg-gray-700 rounded-full p-1 hover:bg-gray-100">
                    <Icons.ChevronLeft size={20} className="rotate-45" /> {/* Use X icon ideally, reusing Chevron rotated or X from lucid */}
                 </button>
              </div>
              <form onSubmit={handleCreateSubmit} className="p-6 space-y-5">
                 <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">标题</label>
                    <input 
                       value={newTitle}
                       onChange={(e) => setNewTitle(e.target.value)}
                       placeholder="一句话概括主题"
                       className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 dark:text-white transition-all"
                       maxLength={50}
                       autoFocus
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">内容</label>
                    <textarea 
                       value={newContent}
                       onChange={(e) => setNewContent(e.target.value)}
                       placeholder="分享你的留学经验、提问或生活感悟..."
                       className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 h-40 resize-none dark:text-white transition-all"
                    />
                 </div>
                 <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setCreateModalOpen(false)} className="px-5 py-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors">取消</button>
                    <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 shadow-lg shadow-blue-500/30 font-bold transition-all transform hover:-translate-y-0.5">发布</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
