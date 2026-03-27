import React, { useState } from 'react';
// Trigger reload
import { 
  LayoutDashboard, 
  CheckSquare, 
  FileText, 
  Clock, 
  MessageSquare,
  BookOpen,
  Brain,
  Calendar,
  LogOut,
  Menu,
  X,
  Trophy,
  Star
} from 'lucide-react';
import { User } from '../types';
import { useAppStore } from '../store/appStore';
import { motion } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: User | null;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  user,
  onLogout
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { userXP, userLevel } = useAppStore();

  // XP Progress Calculation
  const baseXP = userLevel === 1 ? 0 : Math.ceil(100 * Math.pow(userLevel - 1, 1.5));
  const nextLevelXP = Math.ceil(100 * Math.pow(userLevel, 1.5));
  const xpIntoLevel = userXP - baseXP;
  const xpRequiredForLevel = nextLevelXP - baseXP;
  const progressPercent = Math.min(100, Math.max(0, (xpIntoLevel / xpRequiredForLevel) * 100));

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'planner', label: 'Daily Planner', icon: Calendar },
    { id: 'tasks', label: 'My Tasks', icon: CheckSquare },
    { id: 'documents', label: 'My Notes', icon: FileText },
    { id: 'focus', label: 'Focus Zone', icon: Clock },
    { id: 'ai', label: 'AI Tutor', icon: MessageSquare },
    { id: 'flashcards', label: 'Flashcards', icon: BookOpen },
    { id: 'quiz', label: 'Quiz', icon: Brain },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200/60 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-8 pb-6 flex items-center gap-3 border-b border-slate-100/50">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
            <span className="text-white font-display font-bold text-xl">W</span>
          </div>
          <span className="text-xl font-display font-bold text-slate-800 tracking-tight">WorkSphere</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                  import('../utils/sounds').then(s => s.sounds.playClick());
                  onTabChange(item.id);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-violet-500/10 via-fuchsia-500/5 to-transparent text-violet-700 relative animate-gradient-shift bg-[length:200%_200%]'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {activeTab === item.id && (
                 <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 via-fuchsia-400 to-indigo-500 rounded-r-md animate-gradient-shift bg-[length:200%_200%] shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
              )}
              <item.icon 
                size={18} 
                className={`transition-colors duration-300 ${activeTab === item.id ? 'text-violet-600' : 'text-slate-400 group-hover:text-slate-600'}`} 
                strokeWidth={activeTab === item.id ? 2.5 : 2}
              />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100/50">
          <div className="bg-slate-50/80 rounded-2xl p-4 flex flex-col gap-3 mb-3 border border-slate-100 transition-all hover:shadow-md hover:bg-white group cursor-default">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold border-2 border-white shadow-lg shadow-violet-500/30">
                  <Trophy size={18} />
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-bold text-slate-800 truncate">{user?.name || 'User'}</p>
                 <div className="flex items-center gap-1">
                   <Star size={10} className="text-amber-500 fill-amber-500" />
                   <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">Level {userLevel}</p>
                 </div>
               </div>
             </div>
             
             {/* Mini XP Bar */}
             <div className="w-full">
               <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1 px-1 uppercase tracking-wider">
                 <span>{userXP} XP</span>
                 <span>{nextLevelXP} XP</span>
               </div>
               <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${progressPercent}%` }}
                   transition={{ duration: 1, type: "spring" }}
                   className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                 />
               </div>
             </div>
          </div>
          
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors duration-200"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden flex flex-col flex-1 h-screen">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/50 flex items-center justify-between px-4 z-20 sticky top-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-violet-500/20">
              <span className="text-white font-display font-bold">W</span>
            </div>
            <span className="font-display font-bold text-slate-800 text-lg">WorkSphere</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors">
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </header>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-16 left-0 w-full bg-white/95 backdrop-blur-xl z-50 border-b border-slate-200/50 shadow-2xl animate-in slide-in-from-top-2">
             <nav className="p-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    import('../utils/sounds').then(s => s.sounds.playClick());
                    onTabChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 px-5 py-4 text-sm font-medium rounded-xl transition-colors ${
                    activeTab === item.id
                      ? 'bg-violet-50 text-violet-700'
                      : 'text-slate-600'
                  }`}
                >
                  <item.icon size={20} className={activeTab === item.id ? 'text-violet-600' : ''} />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Mobile Main Content */}
        <main className="flex-1 overflow-auto bg-[#F8FAFC] p-4 flex flex-col">
            {children}
        </main>
      </div>

      {/* Desktop Main Content */}
      <main className="hidden md:flex flex-1 flex-col overflow-hidden bg-transparent relative">
        {/* Decorative background elements (Vibrant OS level) */}
        <div className="absolute -top-32 right-0 w-[600px] h-[600px] bg-gradient-to-br from-violet-400/15 to-fuchsia-400/15 rounded-full blur-[100px] pointer-events-none translate-x-1/3 animate-blob"></div>
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-gradient-to-tr from-cyan-400/15 to-teal-400/15 rounded-full blur-[100px] pointer-events-none animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-[20%] w-[500px] h-[500px] bg-gradient-to-t from-indigo-400/10 to-rose-400/10 rounded-full blur-[100px] pointer-events-none animate-blob animation-delay-4000"></div>

        <header className="h-24 flex items-end justify-between px-10 pb-6 z-0">
            <div>
                 <h1 className="text-3xl font-display font-bold text-slate-900 capitalize tracking-tight mb-1 animate-in slide-in-from-bottom-2 duration-500">{navItems.find(n => n.id === activeTab)?.label}</h1>
                 <p className="text-sm font-medium text-slate-500 animate-in slide-in-from-bottom-3 duration-700 delay-100">
                    Welcome back, <span className="text-violet-600 font-semibold">{user?.name?.split(' ')[0] || 'Student'}</span>! Let's make today productive.
                 </p>
            </div>

            {/* Top Right Gamification Badge */}
            <div className="flex items-center gap-4 animate-in slide-in-from-right-4 fade-in duration-700 delay-200">
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3 px-5 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex items-center gap-4 group">
                <div className="bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600 p-2 rounded-xl group-hover:scale-110 transition-transform">
                  <Trophy size={20} className="fill-amber-500/20" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Rank</span>
                    <span className="text-sm font-black text-slate-800">Level {userLevel}</span>
                  </div>
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      key={`topbar-xp-${userLevel}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1, type: "spring" }}
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
        </header>
        
        <div className="flex-1 overflow-auto px-10 pb-8 flex flex-col">
           <div className="max-w-7xl mx-auto w-full flex-1 animate-in fade-in duration-700 slide-in-from-bottom-4 flex flex-col">
               {children}
           </div>
        </div>
      </main>
    </div>
  );
};
