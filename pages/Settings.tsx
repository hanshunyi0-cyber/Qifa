
import React, { useState, useEffect } from 'react';
import type { UserProfile, AppPreferences, FeedbackType, Feedback } from '../types';
import { Icons } from '../components/Icon';
import { useAppLogic } from '../hooks/useAppLogic';
import { 
    FRENCH_EDUCATION_DATA, 
    DEGREES_DATA, 
    MAJORS_DATA, 
    CUSTOM_OPTION_VALUE 
} from '../services/constants';

interface SettingsProps {
  user: UserProfile;
  preferences: AppPreferences;
  onUpdateUser: (user: Partial<UserProfile>) => void;
  onReset: () => void;
  onUpdatePreference: (key: keyof AppPreferences) => void;
  onLogout: () => void;
  onChangePassword: (current: string, newPass: string) => Promise<{ success: boolean; message: string }>;
}

export const Settings: React.FC<SettingsProps> = ({ 
  user, 
  preferences, 
  onUpdateUser, 
  onReset, 
  onUpdatePreference,
  onLogout,
  onChangePassword
}) => {
  const [formData, setFormData] = useState(user);
  const [isSaved, setIsSaved] = useState(false);
  const { submitFeedback, state, switchServerMode } = useAppLogic();

  // Selection UI States
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  const [selectedDegree, setSelectedDegree] = useState('');

  // Initial Logic: Map User Data back to Selection States
  useEffect(() => {
    if (user) {
        const allCities = Object.keys(FRENCH_EDUCATION_DATA);
        const matchCity = allCities.find(c => c.startsWith(user.targetCity)) || '';
        if (matchCity) setSelectedCity(matchCity);
        else if (user.targetCity) setSelectedCity(CUSTOM_OPTION_VALUE);
        
        const possibleSchools = matchCity ? (FRENCH_EDUCATION_DATA[matchCity] || []) : [];
        if (possibleSchools.includes(user.school)) setSelectedSchool(user.school);
        else if (user.school) setSelectedSchool(CUSTOM_OPTION_VALUE);

        if (MAJORS_DATA.includes(user.program)) setSelectedMajor(user.program);
        else if (user.program) setSelectedMajor(CUSTOM_OPTION_VALUE);

        if (DEGREES_DATA.includes(user.degreeLevel)) setSelectedDegree(user.degreeLevel);
    }
  }, [user]);

  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('FEATURE');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<'IDLE' | 'SUCCESS'>('IDLE');

  const myFeedbacks = state.feedbacks.filter(f => f.userId === (user.email || user.phone));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setIsSaved(false);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setSelectedCity(val);
      if (val !== CUSTOM_OPTION_VALUE) {
          setSelectedSchool(''); 
          setFormData(prev => ({ ...prev, targetCity: val.split(' (')[0], school: '' }));
      } else {
          setFormData(prev => ({ ...prev, targetCity: '' }));
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.current || !passwordData.new) return;
    const result = await onChangePassword(passwordData.current, passwordData.new);
    setPasswordMsg({ type: result.success ? 'success' : 'error', text: result.message });
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!feedbackContent.trim()) return;
      const result = await submitFeedback(feedbackType, feedbackContent);
      if (result.success) {
          setFeedbackStatus('SUCCESS');
          setFeedbackContent('');
          setTimeout(() => setFeedbackStatus('IDLE'), 3000);
      }
  };

  const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" onClick={onChange}>
      <span className="text-gray-700 dark:text-gray-200 font-medium">{label}</span>
      <button className={`w-12 h-7 rounded-full relative transition-colors ${checked ? 'bg-primary' : 'bg-gray-300'}`}>
        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="w-full space-y-4 md:space-y-6 animate-[fadeIn_0.3s_ease-out] pb-8">
      <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">设置</h1>
      </div>

      {/* NEW: Server Mode Switch */}
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Icons.Globe size={20} className="text-blue-500" /> 网络与服务器
        </h2>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 mb-4">
             <div className="flex items-center justify-between mb-2">
                 <h3 className="font-bold text-blue-800 dark:text-blue-200 text-sm">当前模式: {state.serverMode === 'GLOBAL' ? '全球模式 (Firebase)' : '中国模式 (LeanCloud)'}</h3>
                 <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${state.serverMode === 'GLOBAL' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {state.serverMode === 'GLOBAL' ? '需翻墙' : '免 VPN'}
                 </span>
             </div>
             <p className="text-xs text-blue-600 dark:text-blue-300 mb-3">
                 如果您在中国大陆且无法使用 VPN，请切换到“中国模式”。注意：两种模式下的账号数据不互通。
             </p>
             <div className="flex gap-2">
                 <button 
                    onClick={() => switchServerMode('GLOBAL')}
                    className={`flex-1 py-2 text-sm rounded-lg border transition-all ${state.serverMode === 'GLOBAL' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                 >
                    全球模式 (推荐)
                 </button>
                 <button 
                    onClick={() => switchServerMode('CHINA')}
                    className={`flex-1 py-2 text-sm rounded-lg border transition-all ${state.serverMode === 'CHINA' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                 >
                    中国模式 (国内专用)
                 </button>
             </div>
        </div>
      </div>
      
      {/* Profile Form (Simplified for brevity, logic maintained via state) */}
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Icons.User size={20} className="text-primary" /> 个人档案
            </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">姓名</label>
                    <input name="name" value={formData.name} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 dark:text-white outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">目标城市</label>
                    <select value={selectedCity} onChange={handleCityChange} className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 dark:text-white outline-none">
                        <option value="">-- 选择城市 --</option>
                        {Object.keys(FRENCH_EDUCATION_DATA).map(c => <option key={c} value={c}>{c}</option>)}
                        <option value={CUSTOM_OPTION_VALUE}>其他</option>
                    </select>
                </div>
            </div>
            <div className="flex justify-end pt-4">
                <button type="submit" className={`px-6 py-2.5 rounded-lg font-medium text-white transition-all ${isSaved ? 'bg-green-500' : 'bg-primary'}`}>
                    {isSaved ? '已保存 ✓' : '保存更改'}
                </button>
            </div>
        </form>
      </div>

      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Icons.Settings size={20} className="text-primary" /> 应用偏好
        </h2>
        <div className="space-y-4">
            <Toggle label="深色模式" checked={preferences.darkMode} onChange={() => onUpdatePreference('darkMode')} />
            <Toggle label="每日任务提醒" checked={preferences.dailyReminders} onChange={() => onUpdatePreference('dailyReminders')} />
        </div>
      </div>

      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6">
        <button onClick={onLogout} className="w-full py-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 font-semibold border border-red-100 hover:bg-red-100 transition-colors">
            退出登录
        </button>
      </div>
    </div>
  );
};