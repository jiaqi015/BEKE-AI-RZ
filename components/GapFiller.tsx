
import React, { useState } from 'react';
import { RegistrationInfo, FactPack } from '../types';

interface Props {
  factPack: FactPack;
  onSubmit: (info: RegistrationInfo) => void;
}

const COMMON_LANGUAGES = ['Java', 'TypeScript', 'JavaScript', 'Python', 'Go', 'C#', 'C++', 'Swift', 'Kotlin', 'Rust', 'PHP', 'SQL', 'Dart'];
const COMMON_TOOLS = ['IntelliJ IDEA', 'VS Code', 'WebStorm', 'PyCharm', 'Xcode', 'Android Studio', 'MySQL', 'Redis', 'Docker', 'Nginx', 'Maven', 'Git', 'CocoaPods'];

const GapFiller: React.FC<Props> = ({ factPack, onSubmit }) => {
  const type = factPack.softwareType;
  const isJava = type === 'Backend';
  const isWeb = type === 'Web';
  const isApp = type === 'App';
  
  // Intelligence Defaults
  let defaultTools = ['VS Code', 'Git'];
  let defaultLangs = ['TypeScript'];
  let defaultDevEnv = 'macOS Sonoma 14.2 / Windows 11 Pro';
  let defaultRunEnv = 'Linux CentOS 7.9 / Docker';

  if (isJava) {
      defaultTools = ['IntelliJ IDEA', 'MySQL', 'Redis', 'Maven'];
      defaultLangs = ['Java', 'SQL'];
  } else if (isApp) {
      defaultTools = ['Android Studio', 'Xcode', 'Git'];
      defaultLangs = ['Kotlin', 'Swift', 'Dart'];
      defaultDevEnv = 'MacBook Pro M3 (Required for iOS)';
      defaultRunEnv = 'iOS 16+ / Android 13+';
  } else if (isWeb) {
      defaultTools = ['WebStorm', 'VS Code', 'Chrome DevTools'];
      defaultLangs = ['TypeScript', 'Vue.js', 'CSS'];
  }

  const [formData, setFormData] = useState<RegistrationInfo>({
    softwareFullName: factPack.softwareNameCandidates[0] || '',
    softwareAbbreviation: '',
    version: 'V1.0.0',
    completionDate: new Date().toISOString().split('T')[0],
    copyrightHolder: '',
    devHardwareEnv: 'MacBook Pro; Apple M3 Max; 32G RAM; 1TB SSD',
    runHardwareEnv: isApp ? 'iPhone 14 / Xiaomi 13 (Standard Test Devices)' : 'Linux CentOS 7.9; Intel Xeon Platinum; 8 Core 16G',
    devSoftwareEnv: defaultDevEnv,
    runSoftwareEnv: defaultRunEnv,
    devTools: defaultTools,
    programmingLanguage: defaultLangs,
    sourceLineCount: '32500', 
    isCollaboration: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const InputField = ({ label, value, onChange, required = false, type = "text", placeholder = "" }: any) => (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-semibold text-zinc-300 uppercase tracking-wider ml-1">{label} {required && <span className="text-rose-400">*</span>}</label>
      <input 
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none transition-all placeholder-zinc-400 hover:bg-black/30 backdrop-blur-sm"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );

  const TagInput = ({ label, values, onChange, suggestions, required = false }: { label: string, values: string[], onChange: (v: string[]) => void, suggestions: string[], required?: boolean }) => {
    const [inputValue, setInputValue] = useState('');

    const addTag = (tag: string) => {
      if (!tag.trim()) return;
      if (!values.includes(tag.trim())) {
        onChange([...values, tag.trim()]);
      }
      setInputValue('');
    };

    const removeTag = (tagToRemove: string) => {
      onChange(values.filter(t => t !== tagToRemove));
    };

    return (
      <div className="space-y-2">
        <label className="block text-[10px] font-semibold text-zinc-300 uppercase tracking-wider ml-1">{label} {required && <span className="text-rose-400">*</span>}</label>
        
        <div className="flex flex-wrap gap-2 mb-2 p-1">
          {values.map(tag => (
            <span key={tag} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-200 text-xs font-medium group backdrop-blur-sm">
              {tag}
              <button 
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-2 text-blue-300 hover:text-white transition-colors"
              >
                &times;
              </button>
            </span>
          ))}
        </div>

        <input 
          type="text"
          className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none transition-all placeholder-zinc-400 backdrop-blur-sm"
          placeholder="输入并回车添加..."
          value={inputValue}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag(inputValue);
            }
          }}
          onChange={(e) => setInputValue(e.target.value)}
        />
        
        <div className="flex flex-wrap gap-2 mt-2">
           {suggestions.map(s => (
             <button 
                key={s} 
                type="button"
                onClick={() => addTag(s)}
                className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                  values.includes(s) 
                  ? 'bg-zinc-800 text-zinc-500 border-zinc-800 cursor-default opacity-50' 
                  : 'bg-white/5 text-zinc-400 border-white/10 hover:border-white/30 hover:text-zinc-200 hover:bg-white/10'
                }`}
                disabled={values.includes(s)}
             >
               + {s}
             </button>
           ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-zinc-900/60 backdrop-blur-xl rounded-[24px] shadow-2xl border border-white/10 overflow-hidden flex flex-col h-full ring-1 ring-white/5 relative">
      {/* Decorative Top Line for Sheet */}
      <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full"></div>

      <div className="px-6 py-5 border-b border-white/5 flex items-center space-x-3 mt-4">
        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
             <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b]"></div>
        </div>
        <div>
            <h3 className="text-base font-bold text-white tracking-tight">缺失信息补全</h3>
            <p className="text-[10px] text-zinc-300">请补充官方申请表必需字段</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
        {/* Section 1 */}
        <div className="space-y-5">
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">基础登记信息</h3>
            <div className="grid grid-cols-2 gap-5">
                <InputField label="软件全称" value={formData.softwareFullName} onChange={(v: string) => setFormData({...formData, softwareFullName: v})} required />
                <InputField label="软件简称" value={formData.softwareAbbreviation} onChange={(v: string) => setFormData({...formData, softwareAbbreviation: v})} placeholder="如：千机" />
            </div>
            <div className="grid grid-cols-2 gap-5">
                <InputField label="版本号" value={formData.version} onChange={(v: string) => setFormData({...formData, version: v})} required placeholder="V1.0.0" />
                <InputField label="源程序量(行)" value={formData.sourceLineCount} onChange={(v: string) => setFormData({...formData, sourceLineCount: v})} required />
            </div>
            <TagInput 
              label="编程语言" 
              values={formData.programmingLanguage} 
              onChange={(v) => setFormData({...formData, programmingLanguage: v})} 
              suggestions={COMMON_LANGUAGES}
              required 
            />
        </div>

        {/* Section 2 */}
        <div className="space-y-5">
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">技术环境配置</h3>
            <div className="grid grid-cols-1 gap-5">
                <InputField label="开发硬件环境" value={formData.devHardwareEnv} onChange={(v: string) => setFormData({...formData, devHardwareEnv: v})} required />
                <InputField label="运行硬件环境" value={formData.runHardwareEnv} onChange={(v: string) => setFormData({...formData, runHardwareEnv: v})} required />
            </div>
            <div className="grid grid-cols-1 gap-5">
                <InputField label="开发操作系统" value={formData.devSoftwareEnv} onChange={(v: string) => setFormData({...formData, devSoftwareEnv: v})} required />
                <TagInput 
                    label="开发工具" 
                    values={formData.devTools} 
                    onChange={(v) => setFormData({...formData, devTools: v})} 
                    suggestions={COMMON_TOOLS}
                    required 
                />
                <InputField label="运行操作系统" value={formData.runSoftwareEnv} onChange={(v: string) => setFormData({...formData, runSoftwareEnv: v})} required />
            </div>
        </div>

        {/* Section 3 */}
        <div className="space-y-5">
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">权属声明</h3>
            <div className="grid grid-cols-2 gap-5">
                <InputField label="完成日期" type="date" value={formData.completionDate} onChange={(v: string) => setFormData({...formData, completionDate: v})} required />
                <InputField label="著作权人" value={formData.copyrightHolder} onChange={(v: string) => setFormData({...formData, copyrightHolder: v})} required />
            </div>
            
            <div className="flex items-center space-x-3 bg-black/20 p-4 rounded-xl border border-white/5 hover:bg-black/30 transition-colors cursor-pointer" onClick={() => setFormData({...formData, isCollaboration: !formData.isCollaboration})}>
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.isCollaboration ? 'bg-blue-500 border-blue-500' : 'border-zinc-600'}`}>
                    {formData.isCollaboration && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <label className="text-xs text-zinc-300 font-medium select-none cursor-pointer">此软件为合作开发项目</label>
            </div>
        </div>
      </form>

      <div className="p-6 border-t border-white/5 bg-black/20 backdrop-blur-md">
        <button 
          onClick={handleSubmit}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center space-x-2 text-sm transform active:scale-[0.99]"
        >
          <span>保存配置并生成文档</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
      </div>
    </div>
  );
};

export default GapFiller;
