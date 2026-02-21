
import React, { useState, useEffect } from 'react';
import { Icons } from './components/Icon';
import { AddTaskModal } from './components/AddTaskModal';
import { useAppLogic } from './hooks/useAppLogic';
import type { Page } from './types';

// Pages
import { Home } from './pages/Home';
import { Assistant } from './pages/Assistant';
import { Report } from './pages/Report';
import { Settings } from './pages/Settings';
import { TaskCategoryPage } from './pages/TaskCategoryPage';
import { StudyCenter } from './pages/StudyCenter'; // Import new page
import { Auth } from './pages/Auth';
import { Community } from './pages/Community';

export default function App() {
  const { 
    isAuthenticated, isGuest, user, tasks, chatSessions, currentSessionId, preferences, isTyping,
    posts, reports, feedbacks, resources, // Get resources
    updateUser, addTask, updateTask, toggleTask, deleteTask, sendUserMessage, getProgress,
    resetData, updatePreferences, login, loginAsGuest, register, logout, changePassword,
    createPost, deletePost, toggleLike, addComment, reportContent, resolveReport, replyToFeedback,
    createNewSession, switchSession, deleteSession,
    addResource, deleteResource // New methods
  } = useAppLogic();
  
  const [currentPage, setCurrentPage] = useState<Page>('HOME');
  
  const [isDesktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAddTaskOpen, setAddTaskOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentPage]);

  // Handle Dark Mode
  useEffect(() => {
    if (preferences.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences.darkMode]);

  if (!isAuthenticated) {
    return <Auth onLogin={login} onRegister={register} onGuestLogin={loginAsGuest} initialEmail={user.email} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'HOME':
        return <Home user={user} tasks={tasks} getProgress={getProgress} onToggle={toggleTask} onDelete={deleteTask} onAddTask={() => setAddTaskOpen(true)} onNavigate={setCurrentPage} onQuickAdd={addTask} onUpdateTask={updateTask} />;
      case 'PRE_DEPARTURE':
        return <TaskCategoryPage title="行前准备" category="PRE_DEPARTURE" icon={<Icons.Plane className="text-blue-500" size={28} />} tasks={tasks} onToggle={toggleTask} onDelete={deleteTask} onAddTask={() => setAddTaskOpen(true)} onQuickAdd={addTask} onUpdateTask={updateTask} />;
      case 'ARRIVAL':
        return <TaskCategoryPage title="抵达法国" category="ARRIVAL" icon={<Icons.House className="text-green-500" size={28} />} tasks={tasks} onToggle={toggleTask} onDelete={deleteTask} onAddTask={() => setAddTaskOpen(true)} onQuickAdd={addTask} onUpdateTask={updateTask} />;
      case 'LIFE':
        return <TaskCategoryPage title="我的生活" category="LIFE" icon={<Icons.Life className="text-orange-500" size={28} />} tasks={tasks} onToggle={toggleTask} onDelete={deleteTask} onAddTask={() => setAddTaskOpen(true)} onQuickAdd={addTask} onUpdateTask={updateTask} />;
      case 'STUDY':
        // Replace TaskCategoryPage with specialized StudyCenter
        return <StudyCenter 
            user={user}
            tasks={tasks} 
            resources={resources} 
            onToggle={toggleTask} 
            onDelete={deleteTask} 
            onAddTask={() => setAddTaskOpen(true)} 
            onUpdateTask={updateTask}
            onAddResource={addResource}
            onDeleteResource={deleteResource}
        />;
      case 'ASSISTANT':
        return <Assistant 
            user={user} 
            chatSessions={chatSessions}
            currentSessionId={currentSessionId}
            onSendMessage={sendUserMessage} 
            onCreateSession={createNewSession}
            onSwitchSession={switchSession}
            onDeleteSession={deleteSession}
            isTyping={isTyping}
            onBack={() => setCurrentPage('HOME')}
        />;
      case 'COMMUNITY':
        return <Community user={user} posts={posts} reports={reports} feedbacks={feedbacks} onCreatePost={createPost} onDeletePost={deletePost} onLike={toggleLike} onComment={addComment} onReport={reportContent} onResolveReport={resolveReport} onReplyFeedback={replyToFeedback} />;
      case 'REPORT':
        return <Report user={user} tasks={tasks} getProgress={getProgress} />;
      case 'SETTINGS':
        return <Settings user={user} preferences={preferences} onUpdateUser={updateUser} onReset={resetData} onUpdatePreference={updatePreferences} onLogout={logout} onChangePassword={changePassword} />;
      default:
        return <Home user={user} tasks={tasks} getProgress={getProgress} onToggle={toggleTask} onDelete={deleteTask} onAddTask={() => setAddTaskOpen(true)} onNavigate={setCurrentPage} onQuickAdd={addTask} onUpdateTask={updateTask} />;
    }
  };

  const NavItem = ({ page, icon: Icon, label }: { page: Page, icon: any, label: string }) => (
    <button 
      onClick={() => setCurrentPage(page)}
      className={`w-full flex items-center gap-3 px-4 py-3.5 mx-auto rounded-xl transition-all duration-200 group ${
        currentPage === page 
          ? 'bg-primary/10 text-primary font-semibold shadow-none' 
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
      } ${!isDesktopSidebarOpen ? 'justify-center w-12 px-0' : 'max-w-[90%]'}`}
      title={!isDesktopSidebarOpen ? label : ''}
    >
      <Icon size={22} className={`shrink-0 transition-colors ${currentPage === page ? 'text-primary' : 'group-hover:text-gray-900 dark:group-hover:text-white'}`} />
      <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isDesktopSidebarOpen ? 'opacity-100 max-w-[150px]' : 'opacity-0 max-w-0 hidden'}`}>
        {label}
      </span>
    </button>
  );

  const getPageMeta = (page: Page) => {
    switch (page) {
      case 'HOME': return { title: '概览', icon: Icons.Home, color: 'text-primary', bg: 'bg-blue-50' };
      case 'PRE_DEPARTURE': return { title: '行前准备', icon: Icons.Plane, color: 'text-blue-500', bg: 'bg-blue-50' };
      case 'ARRIVAL': return { title: '抵达法国', icon: Icons.House, color: 'text-green-500', bg: 'bg-green-50' };
      case 'LIFE': return { title: '我的生活', icon: Icons.Life, color: 'text-orange-500', bg: 'bg-orange-50' };
      case 'STUDY': return { title: '学习中心', icon: Icons.Study, color: 'text-violet-500', bg: 'bg-violet-50' }; // Updated Title
      case 'ASSISTANT': return { title: '智能助手', icon: Icons.Bot, color: 'text-emerald-600', bg: 'bg-emerald-50' };
      case 'COMMUNITY': return { title: '留学生社区', icon: Icons.MessageSquare, color: 'text-pink-500', bg: 'bg-pink-50' };
      case 'REPORT': return { title: '数据报告', icon: Icons.Report, color: 'text-indigo-500', bg: 'bg-indigo-50' };
      case 'SETTINGS': return { title: '设置', icon: Icons.Settings, color: 'text-gray-500', bg: 'bg-gray-50' };
      default: return { title: '启法助手', icon: Icons.Home, color: 'text-primary', bg: 'bg-blue-50' };
    }
  };

  const activePageMeta = getPageMeta(currentPage);
  const ActiveIcon = activePageMeta.icon;
  const isChatPage = currentPage === 'ASSISTANT';

  return (
    <div className="flex h-[100dvh] bg-[#f8fafc] dark:bg-dark-bg font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300 overflow-hidden relative flex-col">
      
      {isGuest && (
         <div className="bg-orange-100/90 backdrop-blur-sm text-orange-800 px-4 py-2 text-xs md:text-sm flex justify-between items-center z-50 shrink-0 border-b border-orange-200 absolute w-full top-0 left-0">
            <span className="flex items-center gap-2">
               <Icons.Alert size={16} />
               <span>游客模式：数据仅临时存储，社区功能受限</span>
            </span>
            <button onClick={logout} className="underline font-bold hover:text-orange-900 whitespace-nowrap ml-2">
               立即注册
            </button>
         </div>
      )}

      <div className={`flex-1 flex overflow-hidden relative ${isGuest ? 'mt-8' : ''}`}>
        <AddTaskModal 
            isOpen={isAddTaskOpen} 
            onClose={() => setAddTaskOpen(false)} 
            onAdd={addTask} 
        />

        {isMobileMenuOpen && (
            <div 
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            />
        )}

        {/* Main Sidebar (Navigation) */}
        <div className={`
            fixed md:static inset-y-0 left-0 z-50 bg-white dark:bg-dark-surface 
            border-r border-gray-100 dark:border-gray-800 transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) transform 
            ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0 md:shadow-none'}
            ${isDesktopSidebarOpen ? 'md:w-72' : 'md:w-20'}
            flex flex-col
        `}>
          <div className={`p-6 flex items-center ${isDesktopSidebarOpen ? 'justify-between' : 'justify-center'}`}>
             <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-tr from-primary to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                   <Icons.Plane size={20} />
                </div>
                <span className={`font-bold text-xl tracking-tight text-gray-800 dark:text-white ${!isDesktopSidebarOpen && 'md:hidden'}`}>
                   启法 Qifa
                </span>
             </div>
             <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600 p-1">
               <Icons.ChevronLeft size={24} />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2 space-y-1 scrollbar-hide">
            <NavItem page="HOME" icon={Icons.Home} label="概览" />
            
            <div className={`pt-6 pb-2 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider ${!isDesktopSidebarOpen && 'md:hidden'}`}>
               留学规划
            </div>
            {/* Divider for collapsed mode */}
            {!isDesktopSidebarOpen && <div className="my-2 border-t border-gray-100 dark:border-gray-800 md:block hidden" />}
            
            <NavItem page="PRE_DEPARTURE" icon={Icons.Plane} label="行前准备" />
            <NavItem page="ARRIVAL" icon={Icons.House} label="抵达法国" />
            <NavItem page="LIFE" icon={Icons.Life} label="我的生活" />
            <NavItem page="STUDY" icon={Icons.Study} label="学习中心" /> {/* Updated Label */}
            
            <div className={`pt-6 pb-2 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider ${!isDesktopSidebarOpen && 'md:hidden'}`}>
               服务与社区
            </div>
             {!isDesktopSidebarOpen && <div className="my-2 border-t border-gray-100 dark:border-gray-800 md:block hidden" />}
             
            <NavItem page="ASSISTANT" icon={Icons.Bot} label="智能助手" />
            <NavItem page="COMMUNITY" icon={Icons.MessageSquare} label="社区" />
            <NavItem page="REPORT" icon={Icons.Report} label="报告" />
            <NavItem page="SETTINGS" icon={Icons.Settings} label="设置" />
          </div>

          {/* Toggle Sidebar Button (Desktop) */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 hidden md:flex justify-end">
            <button 
                onClick={() => setDesktopSidebarOpen(!isDesktopSidebarOpen)}
                className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 flex items-center justify-center transition-colors"
            >
                {isDesktopSidebarOpen ? <Icons.ChevronLeft size={16} /> : <Icons.ChevronRight size={16} />}
            </button>
          </div>
        </div>

        {/* Main Content Wrapper */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f8fafc] dark:bg-dark-bg relative">
          
          {/* Top Header - Sticky */}
          {!isChatPage && (
            <div className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800 px-6 py-4 flex items-center justify-between shrink-0 sticky top-0 z-30 transition-all">
                <div className="flex items-center gap-4">
                    <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-gray-500 hover:bg-gray-100 p-2 rounded-xl transition-colors">
                        <Icons.Menu size={22} />
                    </button>
                    <div className="flex items-center gap-2 animate-[fadeIn_0.3s_ease-out]">
                        <div className={`p-2 rounded-lg ${activePageMeta.bg}`}>
                           <ActiveIcon size={20} className={activePageMeta.color} />
                        </div>
                        <span className="font-bold text-lg text-gray-800 dark:text-white hidden sm:block">{activePageMeta.title}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end mr-1">
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-none mb-1">{user.name}</span>
                        <span className="text-xs text-gray-500">{user.targetCity} · {user.school}</span>
                    </div>
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 overflow-hidden border-2 border-white dark:border-gray-600 shadow-sm">
                        <Icons.User size={22} />
                    </div>
                </div>
            </div>
          )}

          {/* Page Content Scroll Area */}
          <div className={`flex-1 overflow-x-hidden ${isChatPage ? 'flex flex-col h-full' : 'overflow-y-auto'}`}>
             <div className={`${isChatPage ? 'h-full w-full' : 'max-w-7xl mx-auto p-4 md:p-8 pb-20 md:pb-8'}`}>
                {renderPage()}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
