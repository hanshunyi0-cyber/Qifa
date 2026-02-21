
import React, { useState, useEffect } from 'react';
import { Icons } from '../components/Icon';
import type { UserProfile } from '../types';
import { 
  FRENCH_EDUCATION_DATA, 
  DEGREES_DATA, 
  MAJORS_DATA, 
  CUSTOM_OPTION_VALUE 
} from '../services/constants';

interface AuthProps {
  onLogin: (identifier: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  onRegister: (profile: UserProfile, password?: string) => Promise<{ success: boolean; message?: string }>;
  onGuestLogin: () => void;
  initialEmail?: string;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onRegister, onGuestLogin, initialEmail }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [loginIdentifier, setLoginIdentifier] = useState(initialEmail || '');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Registration State
  const [regMethod, setRegMethod] = useState<'EMAIL' | 'PHONE'>('EMAIL');
  const [registerPassword, setRegisterPassword] = useState('');
  
  // Selection States
  const [selectedCity, setSelectedCity] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [customSchool, setCustomSchool] = useState('');
  
  const [selectedDegree, setSelectedDegree] = useState('');
  
  const [selectedMajor, setSelectedMajor] = useState('');
  const [customMajor, setCustomMajor] = useState('');

  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    studentId: string;
    startDate: string;
    currentLocation: string;
  }>({
    name: '',
    email: '',
    phone: '',
    studentId: '',
    startDate: '',
    currentLocation: '',
  });

  // Password Strength Calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strengthScore = getPasswordStrength(registerPassword);

  const getStrengthColor = (score: number) => {
      if (score <= 2) return 'bg-red-400';
      if (score === 3) return 'bg-yellow-400';
      if (score === 4) return 'bg-green-500';
      return 'bg-emerald-500';
  };

  const getStrengthLabel = (score: number) => {
      if (score <= 2) return '弱';
      if (score === 3) return '中等';
      if (score === 4) return '强';
      return '极强';
  };

  // Reset school selection when city changes
  useEffect(() => {
    if (selectedCity !== CUSTOM_OPTION_VALUE) {
       setSelectedSchool('');
       setCustomSchool('');
    }
  }, [selectedCity]);

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!loginIdentifier || !password) {
        setErrorMsg('请输入账号和密码');
        return;
    }

    setIsLoading(true);
    try {
        const result = await onLogin(loginIdentifier, password);
        if (!result.success) {
            setErrorMsg(result.message || '登录失败');
        }
    } catch (e) {
        setErrorMsg('发生未知错误，请重试');
    } finally {
        setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // 1. Determine final values for select/custom fields
    const finalCity = selectedCity === CUSTOM_OPTION_VALUE ? customCity : selectedCity;
    const finalSchool = selectedSchool === CUSTOM_OPTION_VALUE ? customSchool : selectedSchool;
    const finalMajor = selectedMajor === CUSTOM_OPTION_VALUE ? customMajor : selectedMajor;

    // 2. Validation
    if (!formData.name) { setErrorMsg('请填写您的称呼'); return; }
    
    if (regMethod === 'EMAIL' && !formData.email) { setErrorMsg('请填写电子邮箱'); return; }
    if (regMethod === 'PHONE' && !formData.phone) { setErrorMsg('请填写手机号'); return; }

    if (!registerPassword || registerPassword.length < 6) {
      setErrorMsg('请设置密码，长度至少6位');
      return;
    }

    if (!finalCity) { setErrorMsg('请选择或填写目标城市'); return; }
    if (!finalSchool) { setErrorMsg('请选择或填写目标院校'); return; }
    if (!selectedDegree) { setErrorMsg('请选择学历等级'); return; }
    if (!finalMajor) { setErrorMsg('请选择或填写留学专业'); return; }

    // 3. Construct Profile
    const profile: UserProfile = {
        ...formData,
        targetCity: finalCity.split(' (')[0], // Clean up city name for display
        school: finalSchool,
        degreeLevel: selectedDegree,
        program: finalMajor.startsWith('---') ? '' : finalMajor, // Safety check
        // Ensure empty strings for unused fields if necessary
        email: regMethod === 'EMAIL' ? formData.email : '',
        phone: regMethod === 'PHONE' ? formData.phone : '',
        role: 'USER',
        status: 'ACTIVE'
    };

    setIsLoading(true);
    try {
        const result = await onRegister(profile, registerPassword);
        if (!result.success) {
            setErrorMsg(result.message || '注册失败');
        }
    } catch (e) {
        setErrorMsg('发生未知错误，请重试');
    } finally {
        setIsLoading(false);
    }
  };

  const switchMode = (newMode: 'LOGIN' | 'REGISTER') => {
      setMode(newMode);
      setErrorMsg('');
      setPassword('');
      setRegisterPassword('');
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-dark-bg transition-colors duration-300">
      {/* Left Side - Image & Branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary to-blue-600 relative overflow-hidden items-center justify-center text-white p-12">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="relative z-10 max-w-md">
           <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-6">
              <Icons.Plane size={32} className="text-white" />
           </div>
           <h1 className="text-4xl font-bold mb-4">启法助手 Qifa</h1>
           <p className="text-lg text-blue-100 leading-relaxed">
             你的专属智能留学伙伴。从签证办理到落地安家，全流程陪伴你的法国留学之旅。
           </p>
           <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                 <Icons.Bot className="mb-2 opacity-80" />
                 <h3 className="font-bold">AI 智能问答</h3>
                 <p className="text-xs text-blue-100 opacity-70">定制化解答留学疑惑</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                 <Icons.Check className="mb-2 opacity-80" />
                 <h3 className="font-bold">任务管理</h3>
                 <p className="text-xs text-blue-100 opacity-70">行前与抵达待办清单</p>
              </div>
           </div>
        </div>
      </div>

      {/* Right Side - Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
             <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
               {mode === 'LOGIN' ? '欢迎回来' : '创建账号'}
             </h2>
             <p className="mt-2 text-gray-500 dark:text-gray-400">
               {mode === 'LOGIN' 
                 ? '登录以继续你的留学规划' 
                 : '填写信息，开启你的法国之旅'}
             </p>
          </div>
          
          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
                <Icons.Alert size={16} /> {errorMsg}
            </div>
          )}

          {mode === 'LOGIN' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">邮箱或手机号</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icons.User size={18} className="text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="pl-10 w-full p-3 bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" 
                    placeholder="输入注册的邮箱或手机号" 
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">密码</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-lg">🔒</span>
                  </div>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 w-full p-3 bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" 
                    placeholder="••••••••" 
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                  <button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? '登录中...' : '立即登录'}
                  </button>
                  <button 
                    type="button" 
                    onClick={onGuestLogin}
                    disabled={isLoading}
                    className="w-full bg-white border-2 border-gray-100 hover:bg-gray-50 text-gray-600 font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>👀</span> 游客试用
                  </button>
              </div>

              <div className="text-center pt-2">
                <span className="text-gray-500 text-sm">还没有账号？ </span>
                <button type="button" onClick={() => switchMode('REGISTER')} disabled={isLoading} className="text-primary font-medium hover:underline text-sm disabled:opacity-50">立即注册</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
              {/* Registration Method Toggle */}
              <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
                  <button
                    type="button"
                    onClick={() => setRegMethod('EMAIL')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
                        regMethod === 'EMAIL' 
                        ? 'bg-white dark:bg-gray-600 text-primary shadow-sm' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    }`}
                  >
                     <Icons.Send size={14} /> 邮箱注册
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegMethod('PHONE')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
                        regMethod === 'PHONE' 
                        ? 'bg-white dark:bg-gray-600 text-primary shadow-sm' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    }`}
                  >
                     <Icons.Smartphone size={14} /> 手机号注册
                  </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">你的称呼 *</label>
                    <input name="name" required value={formData.name} onChange={handleRegisterChange} className="w-full p-2.5 bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:border-primary outline-none" placeholder="如：张同学" />
                 </div>
                 {regMethod === 'EMAIL' ? (
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">电子邮箱 *</label>
                        <input name="email" type="email" required value={formData.email} onChange={handleRegisterChange} className="w-full p-2.5 bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:border-primary outline-none" placeholder="name@example.com" />
                    </div>
                 ) : (
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">手机号码 *</label>
                        <input name="phone" type="tel" required value={formData.phone} onChange={handleRegisterChange} className="w-full p-2.5 bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:border-primary outline-none" placeholder="输入手机号" />
                    </div>
                 )}
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">设置密码 *</label>
                <input 
                    type="password" 
                    required 
                    value={registerPassword} 
                    onChange={(e) => setRegisterPassword(e.target.value)} 
                    className="w-full p-2.5 bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:border-primary outline-none" 
                    placeholder="至少 6 位字符"
                />
                {registerPassword.length > 0 && (
                  <div className="mt-2 animate-[fadeIn_0.2s_ease-out]">
                    <div className="flex gap-1 h-1.5 mb-1">
                        {[1, 2, 3, 4, 5].map((idx) => (
                           <div 
                             key={idx} 
                             className={`flex-1 rounded-full transition-colors duration-300 ${
                                idx <= strengthScore ? getStrengthColor(strengthScore) : 'bg-gray-200 dark:bg-gray-700'
                             }`} 
                           />
                        ))}
                    </div>
                    <p className="text-xs text-right text-gray-500">
                        强度: <span className={`font-medium ${
                            strengthScore <= 2 ? 'text-red-500' : 
                            strengthScore === 3 ? 'text-yellow-600' : 
                            'text-green-600'
                        }`}>{getStrengthLabel(strengthScore)}</span>
                    </p>
                  </div>
                )}
              </div>
              
              {/* Cascading City & School Selection */}
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">目标城市 *</label>
                    <select 
                        value={selectedCity} 
                        onChange={(e) => {
                            setSelectedCity(e.target.value);
                            setCustomCity('');
                        }}
                        className="w-full p-2.5 bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:border-primary outline-none text-sm"
                    >
                        <option value="">-- 城市 --</option>
                        {Object.keys(FRENCH_EDUCATION_DATA).map(city => (
                            <option key={city} value={city}>{city}</option>
                        ))}
                        <option value={CUSTOM_OPTION_VALUE}>其他 (自定义)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">目标院校 *</label>
                    <select 
                        value={selectedSchool} 
                        onChange={(e) => setSelectedSchool(e.target.value)}
                        disabled={!selectedCity}
                        className="w-full p-2.5 bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:border-primary outline-none text-sm disabled:opacity-50"
                    >
                        <option value="">
                            {!selectedCity ? '-- 先选城市 --' : '-- 院校 --'}
                        </option>
                        {selectedCity && selectedCity !== CUSTOM_OPTION_VALUE && FRENCH_EDUCATION_DATA[selectedCity]?.map(school => (
                            <option key={school} value={school}>{school}</option>
                        ))}
                        <option value={CUSTOM_OPTION_VALUE}>其他 (自定义)</option>
                    </select>
                  </div>
              </div>

              {/* Custom Inputs for City/School */}
              {(selectedCity === CUSTOM_OPTION_VALUE || selectedSchool === CUSTOM_OPTION_VALUE) && (
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                         {selectedCity === CUSTOM_OPTION_VALUE && (
                             <input 
                                 type="text"
                                 value={customCity}
                                 onChange={(e) => setCustomCity(e.target.value)}
                                 placeholder="输入城市"
                                 className="w-full p-2.5 bg-gray-50 dark:bg-dark-surface border border-primary/30 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:border-primary outline-none text-sm animate-[fadeIn_0.2s_ease-out]"
                             />
                         )}
                      </div>
                      <div>
                         {selectedSchool === CUSTOM_OPTION_VALUE && (
                             <input 
                                 type="text"
                                 value={customSchool}
                                 onChange={(e) => setCustomSchool(e.target.value)}
                                 placeholder="输入院校名称"
                                 className="w-full p-2.5 bg-gray-50 dark:bg-dark-surface border border-primary/30 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:border-primary outline-none text-sm animate-[fadeIn_0.2s_ease-out]"
                             />
                         )}
                      </div>
                  </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">学历等级 *</label>
                    <select 
                        value={selectedDegree} 
                        onChange={(e) => setSelectedDegree(e.target.value)}
                        className="w-full p-2.5 bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:border-primary outline-none text-sm"
                    >
                        <option value="">-- 选择学历 --</option>
                        {DEGREES_DATA.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">留学专业 *</label>
                    <select 
                        value={selectedMajor} 
                        onChange={(e) => {
                            setSelectedMajor(e.target.value);
                            setCustomMajor('');
                        }}
                        className="w-full p-2.5 bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:border-primary outline-none text-sm"
                    >
                        <option value="">-- 选择专业 --</option>
                        {MAJORS_DATA.map(m => (
                            <option key={m} value={m} disabled={m.startsWith('---')}>{m}</option>
                        ))}
                        <option value={CUSTOM_OPTION_VALUE}>其他 (自定义)</option>
                    </select>
                 </div>
              </div>

              {selectedMajor === CUSTOM_OPTION_VALUE && (
                 <input 
                     type="text"
                     value={customMajor}
                     onChange={(e) => setCustomMajor(e.target.value)}
                     placeholder="请输入您的专业名称"
                     className="w-full p-2.5 bg-gray-50 dark:bg-dark-surface border border-primary/30 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:border-primary outline-none text-sm animate-[fadeIn_0.2s_ease-out]"
                 />
              )}

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">开学日期</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleRegisterChange} className="w-full p-2.5 bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:border-primary outline-none text-sm" />
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">目前所在地</label>
                    <input name="currentLocation" value={formData.currentLocation} onChange={handleRegisterChange} className="w-full p-2.5 bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:border-primary outline-none text-sm" placeholder="如：上海" />
                 </div>
              </div>

              <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full mt-2 bg-primary hover:bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:scale-[1.02] disabled:opacity-50"
              >
                {isLoading ? '注册中...' : (regMethod === 'EMAIL' ? '注册邮箱账号' : '注册手机账号')}
              </button>
              <div className="text-center">
                 <button type="button" onClick={() => switchMode('LOGIN')} disabled={isLoading} className="text-gray-500 hover:text-gray-700 text-xs disabled:opacity-50">返回登录</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
