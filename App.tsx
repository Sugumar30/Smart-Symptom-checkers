/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Activity, 
  Mic, 
  MicOff, 
  Volume2, 
  History, 
  User, 
  AlertTriangle, 
  ChevronRight, 
  Home, 
  Languages, 
  MapPin, 
  Search,
  ArrowLeft,
  Loader2,
  Calendar,
  ShieldCheck,
  Stethoscope,
  LayoutDashboard,
  PlusCircle,
  FileText,
  Settings,
  Moon,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import { analyzeSymptoms } from './services/geminiService';
import { LanguageProvider, useLanguage } from './LanguageContext';

// Types
type Severity = 'Mild' | 'Moderate' | 'Emergency';

interface AnalysisResult {
  severity: Severity;
  summary: string;
  actions: string[];
  conditions: string[];
  disclaimer: string;
}

interface HistoryItem extends AnalysisResult {
  id: string;
  symptoms: string;
  timestamp: string;
}

interface UserProfile {
  id: string;
  name: string;
  age: number;
  bloodType: string;
}

// Utils
const getSeverityBadgeStyles = (severity: Severity) => {
  switch (severity) {
    case 'Mild': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Moderate': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Emergency': return 'bg-rose-100 text-rose-800 border-rose-200';
    default: return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

const getSeverityAccentColor = (severity: Severity) => {
  switch (severity) {
    case 'Mild': return 'var(--color-mild)';
    case 'Moderate': return 'var(--color-moderate)';
    case 'Emergency': return 'var(--color-emergency)';
    default: return 'var(--color-accent)';
  }
};

const getRecItemStyles = (severity: Severity) => {
  switch (severity) {
    case 'Mild': return 'border-emerald-500 bg-emerald-50/50';
    case 'Moderate': return 'border-amber-500 bg-amber-50/50';
    case 'Emergency': return 'border-rose-500 bg-rose-50/50';
    default: return 'border-slate-500 bg-slate-50/50';
  }
};

// Components
const Sidebar = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<UserProfile>({ id: 'guest', name: 'Anonymous User', age: 25, bloodType: 'Not Set' });

  useEffect(() => {
    const saved = localStorage.getItem('user_profile');
    if (saved) setProfile(JSON.parse(saved));
  }, []);

  const NavItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active?: boolean }) => (
    <Link 
      to={to} 
      className={clsx(
        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200",
        active ? "bg-blue-50 text-blue-600 font-semibold shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span>{label}</span>
    </Link>
  );

  return (
    <aside className="w-[280px] bg-white border-r border-slate-200 p-6 flex flex-col hidden md:flex h-screen sticky top-0">
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
          <Stethoscope className="w-6 h-6" />
        </div>
        <span className="font-extrabold text-xl tracking-tight text-slate-800 uppercase">SmartSymptom</span>
      </div>

      <div className="space-y-8 flex-1">
        <div className="space-y-2">
          <h3 className="text-[10px] font-black tracking-widest text-slate-400 uppercase ml-4 mb-4">{t('menu')}</h3>
          <NavItem to="/" icon={LayoutDashboard} label={t('dashboard')} active={location.pathname === '/'} />
          <NavItem to="/input" icon={PlusCircle} label={t('checkNew')} active={location.pathname === '/input'} />
          <NavItem to="/history" icon={History} label={t('history')} active={location.pathname === '/history' || location.pathname === '/results'} />
          <NavItem to="/hospitals" icon={MapPin} label={t('medicalCenters')} active={location.pathname === '/hospitals'} />
        </div>

        <div className="space-y-2">
          <h3 className="text-[10px] font-black tracking-widest text-slate-400 uppercase ml-4 mb-4">{t('settings')}</h3>
          <NavItem to="/profile" icon={User} label={t('profile')} active={location.pathname === '/profile'} />
          <div className="flex items-center justify-between px-4 py-3 text-slate-500 cursor-pointer hover:text-slate-900 text-sm">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5" />
              <span>{t('darkMode')}</span>
            </div>
            <div className="w-8 h-4 bg-slate-200 rounded-full relative">
              <div className="absolute left-1 top-1 w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto p-4 bg-slate-50 rounded-2xl flex items-center gap-3 border border-slate-100">
        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">
          <User className="w-6 h-6" />
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-bold text-slate-800 truncate">{profile.name}</p>
          <p className="text-[10px] text-slate-400 font-medium">Age: {profile.age} • {profile.bloodType}</p>
        </div>
      </div>
    </aside>
  );
};

const MobileNavbar = () => {
  const location = useLocation();
  const { t } = useLanguage();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 md:hidden">
      <Link to="/" className={clsx("flex flex-col items-center gap-1 transition-colors", location.pathname === '/' ? "text-blue-600" : "text-slate-400")}>
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px] font-bold uppercase tracking-wider">{t('dashboard')}</span>
      </Link>
      <Link to="/input" className={clsx("flex flex-col items-center gap-1 transition-colors", location.pathname === '/input' ? "text-blue-600" : "text-slate-400")}>
        <PlusCircle className="w-5 h-5" />
        <span className="text-[10px] font-bold uppercase tracking-wider">{t('checkNew')}</span>
      </Link>
      <Link to="/history" className={clsx("flex flex-col items-center gap-1 transition-colors", location.pathname === '/history' ? "text-blue-600" : "text-slate-400")}>
        <History className="w-5 h-5" />
        <span className="text-[10px] font-bold uppercase tracking-wider">{t('history')}</span>
      </Link>
      <Link to="/profile" className={clsx("flex flex-col items-center gap-1 transition-colors", location.pathname === '/profile' ? "text-blue-600" : "text-slate-400")}>
        <User className="w-5 h-5" />
        <span className="text-[10px] font-bold uppercase tracking-wider">{t('profile')}</span>
      </Link>
    </nav>
  );
};

const Layout = ({ children, title, showBack = false, langSwitch = false }: { children: React.ReactNode, title: string, showBack?: boolean, langSwitch?: boolean }) => {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  return (
    <div className="flex min-h-screen bg-brand-bg w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 bg-brand-bg/80 backdrop-blur-md px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBack && (
              <button onClick={() => navigate(-1)} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
          </div>
          {langSwitch && (
            <div className="bg-white p-1.5 border border-slate-200 rounded-xl flex shadow-sm">
               {(['English', 'Tamil', 'Hindi'] as const).map(l => (
                  <button 
                    key={l}
                    onClick={() => setLanguage(l)}
                    className={clsx(
                    "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                    l === language ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-slate-500 hover:text-slate-800"
                  )}>
                    {l === 'English' ? l : l === 'Tamil' ? 'தமிழ்' : 'हिंदी'}
                  </button>
               ))}
            </div>
          )}
        </header>

        <main className="flex-1 px-6 pb-24 md:pb-8">
          <div className="max-w-5xl mx-auto w-full">
            {children}
          </div>
        </main>
        
        <MobileNavbar />
      </div>
    </div>
  );
};

// Pages
const HomePage = () => {
  const [profile, setProfile] = useState<UserProfile>({ id: 'guest', name: 'Anonymous User', age: 25, bloodType: 'O+' });
  const { t } = useLanguage();

  useEffect(() => {
    const saved = localStorage.getItem('user_profile');
    if (saved) setProfile(JSON.parse(saved));
  }, []);

  return (
    <Layout title={t('dashboard')}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-[32px] p-10 border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                <Activity className="w-4 h-4" /> AI Diagnostics
              </div>
              <h2 className="text-4xl font-extrabold text-slate-900 leading-[1.1]">{t('welcome').replace('?', '')}, {profile.name.split(' ')[0]}?</h2>
              <p className="text-slate-500 text-lg max-w-sm">{t('assessmentDesc')}</p>
              <Link to="/input" className="inline-flex items-center gap-3 bg-blue-600 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all active:translate-y-0">
                {t('startAssessment')} <PlusCircle className="w-5 h-5 ml-1" />
              </Link>
            </div>
            <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl group-hover:bg-blue-100/50 transition-colors"></div>
            <Stethoscope className="absolute right-8 top-12 w-48 h-48 text-slate-100 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
          </section>

          <div className="grid grid-cols-2 gap-6">
            <Link to="/history" className="sleek-card p-6 flex items-start gap-4 group hover:border-blue-200 transition-colors">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{t('history')}</h3>
                <p className="text-xs text-slate-400 mt-1">{t('trackRecords')}</p>
              </div>
            </Link>
            <Link to="/hospitals" className="sleek-card p-6 flex items-start gap-4 group hover:border-rose-200 transition-colors">
              <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 group-hover:bg-rose-100 transition-colors">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{t('nearbyHospitals')}</h3>
                <p className="text-xs text-slate-400 mt-1">{t('findCare')}</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="space-y-6">
           <section className="sleek-card p-8 space-y-6">
             <div className="flex items-center gap-3">
               <ShieldCheck className="w-6 h-6 text-emerald-500" />
               <h3 className="font-extrabold text-slate-800">{t('safetyInfo')}</h3>
             </div>
             <div className="space-y-4">
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                 <p className="text-sm font-semibold text-slate-800 mb-1">{t('safetyInfo')}</p>
                 <p className="text-xs text-slate-500 leading-relaxed">{t('safetyDesc')}</p>
               </div>
               <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                 <p className="text-sm font-semibold text-rose-800 mb-1">{t('emergencyAlert')}</p>
                 <p className="text-xs text-rose-600/80 leading-relaxed">{t('emergencyAlert')}</p>
               </div>
             </div>
           </section>

           <div className="sleek-card p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
             <div className="relative z-10 space-y-4">
               <div className="flex items-center gap-2 text-blue-400">
                 <PlusCircle className="w-5 h-5" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Medical ID</span>
               </div>
               <div>
                  <p className="text-lg font-bold">{profile.name}</p>
                  <p className="text-xs text-slate-400">Age: {profile.age} • Blood: {profile.bloodType}</p>
               </div>
               <button className="w-full bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl text-xs font-bold border border-white/10 transition-all">
                 View Full Record
               </button>
             </div>
             <Activity className="absolute -right-8 -bottom-8 w-32 h-32 text-white/5" />
           </div>
        </div>
      </div>
    </Layout>
  );
};

const SymptomInputPage = () => {
  const [input, setInput] = useState('');
  const { language, t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();

  const recognition = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;

      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + ' ' + transcript);
        setIsListening(false);
      };

      recognition.current.onerror = () => setIsListening(false);
      recognition.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognition.current?.stop();
    } else {
      setIsListening(true);
      recognition.current?.start();
    }
  };

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setIsAnalyzing(true);
    try {
       const savedProfile = localStorage.getItem('user_profile');
       const age = savedProfile ? JSON.parse(savedProfile).age : 25;
       const result = await analyzeSymptoms(input, language, age);
       
       const userId = localStorage.getItem('user_id') || 'guest';
       await fetch('/api/history', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ ...result, symptoms: input, userId })
       });

       navigate('/results', { state: { result, symptoms: input } });
    } catch (error) {
       console.error(error);
       alert('Analysis failed. Please try again.');
    } finally {
       setIsAnalyzing(false);
    }
  };

  return (
    <Layout title={t('checkNew')} showBack langSwitch>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="sleek-card p-8 space-y-6">
             <div className="space-y-1">
               <h2 className="text-xl font-bold text-slate-800">{t('symptomPrompt')}</h2>
               <p className="text-sm text-slate-400">{t('symptomDesc')}</p>
             </div>
             
             <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 relative group focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-500 transition-all">
               <textarea
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 placeholder={t('inputPlaceholder')}
                 className="w-full h-48 bg-transparent text-slate-800 placeholder:text-slate-300 outline-none resize-none font-medium leading-relaxed"
               />
               <button 
                 onClick={toggleListening}
                 className={clsx(
                   "absolute bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300",
                   isListening ? "bg-red-500 text-white animate-pulse scale-110" : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105"
                 )}
               >
                 {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
               </button>
             </div>

             <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-4">
                <div className="flex items-center gap-3 text-slate-400">
                  <Info className="w-4 h-4" />
                  <span className="text-[11px] font-bold uppercase tracking-widest">{t('inputPlaceholder').split('...')[0]}</span>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={!input.trim() || isAnalyzing}
                  className="bg-slate-900 text-white font-black uppercase tracking-widest text-xs px-10 py-5 rounded-2xl shadow-xl hover:bg-black transition-all disabled:opacity-50 flex items-center gap-3"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t('analyzing')}</span>
                    </>
                  ) : (
                    <>
                      <Stethoscope className="w-4 h-4" />
                      <span>{t('analyzeNow')}</span>
                    </>
                  )}
                </button>
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <section className="sleek-card p-6 space-y-4 bg-blue-50/50 border-blue-100">
             <h3 className="font-bold text-blue-900">{t('tips')}</h3>
             <ul className="space-y-3">
               {[
                 t('tip1'),
                 t('tip2'),
                 t('tip3'),
                 t('tip4')
               ].map((tip, i) => (
                 <li key={i} className="flex gap-3 text-xs text-blue-800/70 font-medium">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5"></div>
                   <span>{tip}</span>
                 </li>
               ))}
             </ul>
          </section>
        </div>
      </div>
    </Layout>
  );
};

const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { result, symptoms } = location.state as { result: AnalysisResult, symptoms: string };
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!result) return <div className="p-10 text-center font-bold text-slate-400">Assessment not available.</div>;

  const badgeClass = getSeverityBadgeStyles(result.severity);
  const accentColor = getSeverityAccentColor(result.severity);

  const speak = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }
      const text = `${result.summary}. ${result.actions.join('. ')}. ${result.disclaimer}`;
      const utterance = new SpeechSynthesisUtterance(text);
      if (language === 'Tamil') utterance.lang = 'ta-IN';
      if (language === 'Hindi') utterance.lang = 'hi-IN';
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  return (
    <Layout title={t('resultsTitle')} showBack>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="sleek-card p-8 space-y-8">
             <div className="flex items-center justify-between flex-wrap gap-4">
               <div className={clsx("px-5 py-2.5 rounded-full border text-xs font-black tracking-widest uppercase flex items-center gap-2 shadow-sm", badgeClass)}>
                 {result.severity === 'Emergency' ? `⚠️ ${t('emergencyAlert').toUpperCase()}` : result.severity === 'Moderate' ? `⏳ ${result.severity.toUpperCase()}` : `✅ ${result.severity.toUpperCase()}`}
               </div>
               <button 
                 onClick={speak} 
                 className={clsx(
                   "flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all",
                   isSpeaking ? "text-blue-600 scale-105" : "text-slate-400 hover:text-blue-600"
                 )}
               >
                 <Volume2 className="w-5 h-5" />
                 <span>{isSpeaking ? t('listening') : t('listenAnalysis')}</span>
               </button>
             </div>

             <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col gap-2">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('symptomPrompt')}</span>
               <p className="text-slate-700 font-medium italic leading-relaxed">"{symptoms}"</p>
             </div>

             <div className="space-y-4">
               <h3 className="text-lg font-bold text-slate-800">{t('aiObservation')}</h3>
               <p className="text-slate-600 leading-relaxed max-w-2xl">{result.summary}</p>
             </div>

             <div className="space-y-4">
               <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">{t('careInstructions')}</h4>
               <div className="space-y-3">
                 {result.actions.map((action, i) => (
                   <motion.div 
                     initial={{ opacity: 0, x: -10 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: i * 0.1 }}
                     key={i} 
                     className={clsx("p-5 border-l-4 rounded-r-2xl text-sm font-medium text-slate-700", getRecItemStyles(result.severity))}
                   >
                     {action}
                   </motion.div>
                 ))}
               </div>
             </div>
          </section>

          {result.severity === 'Emergency' && (
             <section className="bg-rose-600 p-10 rounded-[32px] text-white shadow-2xl shadow-rose-200 relative overflow-hidden">
                <div className="relative z-10 space-y-6">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <AlertTriangle className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-extrabold uppercase tracking-tight">{t('seekImmediate')}</h2>
                    <p className="text-rose-100 font-medium">{t('emergencyDesc')}</p>
                  </div>
                  <button onClick={() => navigate('/hospitals')} className="bg-white text-rose-600 px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl flex items-center gap-3">
                    <MapPin className="w-4 h-4" /> {t('locateFacility')}
                  </button>
                </div>
                <AlertTriangle className="absolute -right-12 -bottom-12 w-64 h-64 text-white/5" />
             </section>
          )}
        </div>

        <div className="space-y-8">
           <section className="sleek-card p-6 divide-y divide-slate-100">
              <h3 className="font-bold text-slate-800 mb-4 px-2">{t('commonConditions')}</h3>
              {result.conditions.length > 0 ? (
                result.conditions.map((c, i) => (
                  <div key={i} className="py-4 px-2 last:pb-0 first:pt-2">
                    <p className="font-bold text-slate-800 text-sm mb-1">{c}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{t('results')}</p>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-slate-300 italic text-sm">{t('noRecords')}</div>
              )}
           </section>

           <section className="bg-slate-50 border border-slate-200 p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-3 text-slate-800">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h4 className="font-bold text-sm uppercase tracking-tight">{t('disclaimerTitle')}</h4>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500 font-medium">{result.disclaimer}</p>
           </section>
        </div>
      </div>
    </Layout>
  );
};

const HistoryPage = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const userId = localStorage.getItem('user_id') || 'guest';
        const res = await fetch(`/api/history?userId=${userId}`);
        const data = await res.json();
        setHistory(data.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <Layout title={t('assessmentHistory')}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-24 flex flex-col items-center gap-4 text-slate-300">
             <Loader2 className="w-12 h-12 animate-spin" />
             <p className="font-black uppercase tracking-[0.2em] text-xs">{t('analyzing')}</p>
          </div>
        ) : history.length === 0 ? (
           <div className="col-span-full py-24 text-center space-y-6 sleek-card border-dashed">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                <FileText className="w-10 h-10" />
             </div>
             <p className="text-slate-400 font-medium">{t('noRecords')}</p>
             <Link to="/input" className="inline-flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-xs px-6 py-3 bg-blue-50 rounded-xl">
               {t('startFirst')} <ChevronRight className="w-4 h-4" />
             </Link>
           </div>
        ) : (
          history.map(item => (
            <Link 
              key={item.id} 
              to="/results" 
              state={{ result: item, symptoms: item.symptoms }}
              className="sleek-card p-6 group hover:border-blue-200 transition-all hover:shadow-2xl hover:shadow-blue-100 flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-6">
                 <div className={clsx("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", getSeverityBadgeStyles(item.severity))}>
                    {item.severity}
                 </div>
                 <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">{new Date(item.timestamp).toLocaleDateString()}</span>
              </div>
              <h4 className="font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">"{item.symptoms}"</h4>
              <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-6">{item.summary}</p>
              <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{t('results')}</span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
              </div>
            </Link>
          ))
        )}
      </div>
    </Layout>
  );
};

const ProfilePage = () => {
  const [profile, setProfile] = useState<UserProfile>({ id: 'guest', name: 'Anonymous User', age: 25, bloodType: 'Not Set' });
  const [editing, setEditing] = useState(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    const saved = localStorage.getItem('user_profile');
    if (saved) setProfile(JSON.parse(saved));
  }, []);

  const saveProfile = () => {
    localStorage.setItem('user_profile', JSON.stringify(profile));
    setEditing(false);
  };

  return (
    <Layout title={t('profile')} showBack>
       <div className="max-w-2xl mx-auto space-y-8">
          <section className="sleek-card p-10 flex flex-col items-center gap-8 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
             <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 ring-[12px] ring-slate-50 shadow-inner">
                <User className="w-16 h-16" />
             </div>
             
             {!editing ? (
               <div className="text-center space-y-2">
                 <h2 className="text-3xl font-black text-slate-800">{profile.name}</h2>
                 <p className="text-slate-400 font-medium">{t('profile')}</p>
                 <div className="flex gap-4 pt-4 justify-center">
                    <div className="bg-slate-50 px-6 py-2 rounded-xl text-xs font-bold text-slate-600 border border-slate-100">{t('age')}: {profile.age}</div>
                    <div className="bg-slate-50 px-6 py-2 rounded-xl text-xs font-bold text-slate-600 border border-slate-100">{t('bloodType')}: {profile.bloodType}</div>
                 </div>
                 <button 
                  onClick={() => setEditing(true)}
                  className="mt-8 bg-blue-600 text-white font-black uppercase tracking-[0.2em] text-[10px] px-8 py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all"
                 >
                   {t('edit')}
                 </button>
               </div>
             ) : (
               <div className="w-full space-y-6 max-w-md">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">{t('name')}</label>
                      <input 
                        value={profile.name} 
                        onChange={e => setProfile({...profile, name: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">{t('age')}</label>
                          <input 
                            type="number"
                            value={profile.age} 
                            onChange={e => setProfile({...profile, age: parseInt(e.target.value) || 0})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">{t('bloodType')}</label>
                          <select 
                            value={profile.bloodType} 
                            onChange={e => setProfile({...profile, bloodType: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold"
                          >
                            {['Not Set', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                    </div>
                  </div>
                  <button 
                    onClick={saveProfile} 
                    className="w-full bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[10px] py-5 rounded-2xl shadow-xl hover:bg-black transition-all"
                  >
                    {t('save')}
                  </button>
               </div>
             )}
          </section>

          <section className="sleek-card p-6">
             <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 ml-2">{t('settings')}</h3>
             <div className="space-y-2">
               {[
                 { icon: Languages, label: t('langCode'), value: language },
                 { icon: ShieldCheck, label: t('safetyInfo'), value: 'Active' },
                 { icon: LayoutDashboard, label: t('dashboard'), value: 'Grid' }
               ].map((item, i) => (
                 <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 cursor-pointer transition-colors group">
                   <div className="flex items-center gap-4">
                     <item.icon className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                     <span className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{item.label}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="text-xs font-bold text-slate-400">{item.value}</span>
                     <ChevronRight className="w-4 h-4 text-slate-300" />
                   </div>
                 </div>
               ))}
             </div>
          </section>
       </div>
    </Layout>
  );
}

const HospitalsPage = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isManual, setIsManual] = useState(false);
  const { t, language } = useLanguage();

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsManual(true);
      // We'll update the map query based on the search
    }
  };

  const useDefault = () => {
    // Default to a major city based on language
    const defaults = {
      Tamil: { lat: 13.0827, lng: 80.2707 }, // Chennai
      Hindi: { lat: 28.6139, lng: 77.2090 }, // Delhi
      English: { lat: 40.7128, lng: -74.0060 } // NYC
    };
    setLocation(defaults[language as keyof typeof defaults] || defaults.English);
  };

  useEffect(() => {
    if (!isManual) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => useDefault()
      );
    }
  }, [isManual]);

  return (
    <Layout title={t('careCenters')} showBack>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <div className="sleek-card p-4 bg-white mb-6 flex gap-4 items-center">
             <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <form onSubmit={handleManualSearch}>
                  <input 
                    type="text" 
                    placeholder="Enter city, state or zip code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-6 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium"
                  />
                </form>
             </div>
             <button 
               onClick={handleManualSearch}
               className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-black transition-all"
             >
               Search
             </button>
           </div>

           <div className="sleek-card h-[600px] relative overflow-hidden">
              {location || isManual ? (
                <iframe
                  title="Medical Centers Map"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  src={`https://www.google.com/maps/embed/v1/search?key=${process.env.VITE_GOOGLE_MAPS_API_KEY}&q=hospitals+near+${isManual ? searchQuery : 'me'}&center=${location?.lat || ''},${location?.lng || ''}&zoom=14`}
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 text-slate-300 bg-slate-50">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                    <MapPin className="absolute inset-0 m-auto w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="font-black uppercase tracking-widest text-xs text-slate-500">{t('locating')}</p>
                    <p className="text-[10px] text-slate-400 max-w-[200px]">Sharing your location allows us to find the nearest ER immediately.</p>
                  </div>
                  <button 
                    onClick={useDefault}
                    className="text-blue-600 font-bold text-xs bg-white border border-blue-200 px-6 py-3 rounded-xl hover:bg-blue-50 transition-all"
                  >
                    Continue without location
                  </button>
                </div>
              )}
           </div>
        </div>

        <div className="space-y-6">
          <section className="sleek-card p-6 space-y-6">
            <h3 className="font-extrabold text-slate-800">{t('nearbyER')}</h3>
            <div className="space-y-3">
              {[1, 2, 3].map(h => (
                <div key={h} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-colors cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-sm text-slate-800">Hospital Medical Center #{h}</h4>
                    <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Open</span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> 1.{h} km</span>
                    <span className="flex items-center gap-1.5"><Activity className="w-3 h-3" /> ER Support</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-[10px]">
                    {t('navigate')} <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-4 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] hover:text-slate-600">
              Refresh Local Data
            </button>
          </section>
        </div>
      </div>
    </Layout>
  );
};

// Main App
export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/input" element={<SymptomInputPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/hospitals" element={<HospitalsPage />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}
