import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Mail, Lock, Loader2, BookOpen, User as UserIcon, CheckCircle2, AlertCircle, Target, Clock, Zap, LayoutDashboard, Brain, MessageSquare, Layers, Sparkles } from 'lucide-react';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
            },
          },
        });
        if (error) throw error;
        
        if (data.user && !data.session) {
          setMessage({ text: 'Success! Check your email for a confirmation link.', type: 'success' });
          return;
        }
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'An error occurred during authentication.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage({ text: 'Please enter your email address first to reset your password.', type: 'error' });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setMessage({ text: 'Password reset link sent! Please check your email.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Error sending reset link.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center font-sans relative overflow-hidden bg-[#F4F7FC]">
      
      {/* IMMERSIVE MULTI-LAYERED BACKGROUND */}
      <div className="absolute inset-0 z-0">
          {/* Base gradient map */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-100 via-indigo-50 to-blue-100 opacity-80"></div>
          
          {/* Animated background blobs */}
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-fuchsia-400/30 to-violet-500/40 rounded-full blur-[100px] mix-blend-multiply animate-blob"></div>
          <div className="absolute bottom-[5%] right-[-10%] w-[700px] h-[700px] bg-gradient-to-bl from-blue-400/30 to-indigo-500/40 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-2000"></div>
          
          {/* Grid pattern overlay for texture */}
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.3 }}></div>

          {/* DEEP AMBIENT GLOWS (ORBS) */}
          <div className="absolute top-[-10%] right-[0%] w-[600px] h-[600px] bg-violet-500/40 rounded-full blur-[100px] pointer-events-none animate-pulse hidden lg:block z-0"></div>
          <div className="absolute bottom-[-10%] right-[20%] w-[700px] h-[700px] bg-sky-500/30 rounded-full blur-[100px] pointer-events-none animate-pulse animation-delay-4000 hidden lg:block z-0"></div>
          <div className="absolute top-[30%] right-[35%] w-[500px] h-[500px] bg-fuchsia-500/30 rounded-full blur-[100px] pointer-events-none animate-pulse animation-delay-2000 hidden lg:block z-0"></div>

          {/* FLOATING 3D ELEMENTS - BALANCED 5-POINT DIAGRAM (PENTAGON) */}
          
          {/* Vertex 1: Top Center of Right Section */}
          <div className="absolute top-[18%] right-[20%] lg:right-[25%] w-32 h-12 bg-white/40 backdrop-blur-md rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/60 transform rotate-[4deg] animate-float flex items-center justify-center gap-2 hover:scale-110 hover:-rotate-2 transition-all duration-500 z-0 text-indigo-600 font-bold text-xs cursor-default">
            <Sparkles size={16} className="text-indigo-500" />
            <span>AI Powered</span>
          </div>

          {/* Vertex 2: Mid Right (outer edge) */}
          <div className="absolute top-[38%] right-[4%] lg:right-[6%] w-16 h-16 bg-white/40 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/60 transform rotate-[25deg] animate-float animation-delay-2000 flex items-center justify-center hover:scale-110 hover:-rotate-12 transition-all duration-500 z-0 cursor-default">
             <BookOpen size={24} className="text-violet-500" />
          </div>
          
          {/* Vertex 3: Bottom Right */}
          <div className="absolute bottom-[20%] right-[10%] lg:right-[15%] w-16 h-16 bg-white/40 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/60 transform rotate-12 animate-float flex items-center justify-center hover:scale-110 hover:-rotate-6 transition-all duration-500 z-0 cursor-default">
             <Target size={24} className="text-emerald-500" />
          </div>

          {/* Vertex 4: Bottom Left (inner edge) */}
          <div className="absolute bottom-[20%] right-[38%] lg:right-[42%] w-16 h-16 bg-white/40 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/60 transform -rotate-12 animate-float animation-delay-2000 flex items-center justify-center hover:scale-110 hover:rotate-6 transition-all duration-500 z-0 cursor-default">
             <Brain size={24} className="text-fuchsia-500" />
          </div>

          {/* Vertex 5: Mid Left (inner edge near form) */}
          <div className="absolute top-[38%] right-[42%] lg:right-[46%] w-14 h-14 bg-white/40 backdrop-blur-sm rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/60 animate-float animation-delay-4000 flex items-center justify-center hover:scale-110 transition-all duration-500 z-0 cursor-default">
             <Zap size={20} className="text-blue-500" />
          </div>
      </div>
      
      {/* GLOBAL FOOTER COPYRIGHT */}
      <div className="absolute bottom-6 left-0 w-full text-center z-10 pointer-events-none opacity-60">
          <p className="text-[11px] font-semibold text-slate-500 tracking-wide">
             © {new Date().getFullYear()} WorkSphere AI. Your intelligent workspace.
          </p>
      </div>

      {/* MESSAGE TOAST (Fixed global outside of all filters and overflow containers) */}
      {message && (
         <div className={`fixed top-8 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md p-4 rounded-xl text-sm font-bold border flex items-start justify-center gap-3 animate-in slide-in-from-top-4 fade-in shadow-2xl z-[100] ${
             message.type === 'success' 
             ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
             : 'bg-rose-50 text-rose-600 border-rose-200'
         }`}>
            {message.type === 'success' ? (
                <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
            ) : (
                <AlertCircle size={18} className="text-rose-500 flex-shrink-0 mt-0.5" />
            )}
            <span className="leading-tight text-center">{message.text}</span>
         </div>
      )}

      {/* SPLIT LAYOUT CONTAINER (flex-row-reverse swaps DOM order on Desktop) */}
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row-reverse items-center justify-center lg:justify-between px-4 lg:px-12 gap-8 lg:gap-20">
        {/* RIGHT TEXT PANEL - Hidden on mobile */}
        <div className="hidden lg:flex flex-col flex-1 max-w-lg mb-10 lg:mb-0 animate-in slide-in-from-right-8 fade-in duration-1000 items-center justify-center text-center relative z-10 w-full pl-6">
             
             <h2 className="text-4xl xl:text-5xl font-display font-black text-slate-800 tracking-tight flex flex-col gap-3 lg:gap-4 items-center justify-center mb-8 w-full">
                <span>Elevate your focus.</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 pb-1">Accelerate growth.</span>
             </h2>

             <p className="text-slate-500 font-medium text-[15px] lg:text-base leading-relaxed max-w-sm mx-auto relative z-10 pt-2">
                Unlock your full potential with an intelligent workspace designed to eliminate distractions, accelerate learning, and build unbreakable productivity streaks.
             </p>
        </div>

        {/* LEFT FLOATING GLASSMORPHIC FORM CARD */}
        <div className="w-full max-w-[480px] relative animate-in fade-in zoom-in-[0.98] duration-700 ease-out flex-shrink-0">
        
        <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_0_60px_-15px_rgba(139,92,246,0.25)] ring-1 ring-white/60 p-8 sm:px-10 sm:py-12 relative overflow-hidden flex flex-col min-h-[500px]">
          
          {/* Subtle interior glare */}
          <div className="absolute top-0 left-0 w-full h-[200px] bg-gradient-to-b from-white/60 to-transparent pointer-events-none"></div>

          <div className="flex flex-col items-center text-center mb-8 relative z-10">
            {/* Branding - Worksphere + Icon */}
            <div className="flex items-center gap-3 mb-6 bg-white/50 py-2 px-5 rounded-full border border-white/60 shadow-sm backdrop-blur-sm">
               <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.4)]">
                 <BookOpen size={16} className="text-white" />
               </div>
               <span className="font-display font-black text-xl text-slate-800 tracking-tight">WorkSphere</span>
            </div>

            <h1 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight mb-2">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-sm font-medium text-slate-500 px-4">
              {isLogin ? 'Enter your details to access your workspace.' : 'Start your journey to better productivity.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4 relative z-10 flex-1 flex flex-col justify-center">
            
            <div className="space-y-4 flex-1">
                {!isLogin && (
                <div className="group animate-in fade-in slide-in-from-top-2">
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 group-focus-within:text-violet-600 transition-colors ml-1">Full Name</label>
                    <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <UserIcon size={18} className="text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-white/90 border border-slate-200/50 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-4 focus:ring-violet-500/20 focus:border-violet-400 focus:shadow-[0_0_20px_-5px_rgba(139,92,246,0.15)] transition-all outline-none shadow-sm"
                        placeholder="John Doe"
                        required={!isLogin}
                    />
                    </div>
                </div>
                )}

                <div className="group">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 group-focus-within:text-violet-600 transition-colors ml-1">Email Address</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className="text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                    </div>
                    <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white/90 border border-slate-200/50 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-4 focus:ring-violet-500/20 focus:border-violet-400 focus:shadow-[0_0_20px_-5px_rgba(139,92,246,0.15)] transition-all outline-none shadow-sm"
                    placeholder="student@university.edu"
                    required
                    />
                </div>
                </div>

                <div className="group">
                <div className="flex items-center justify-between mb-1.5 px-1">
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest group-focus-within:text-violet-600 transition-colors">Password</label>
                    {isLogin && <a href="#" onClick={handleResetPassword} className="text-xs font-bold text-violet-600 hover:text-violet-700 transition-colors">Forgot?</a>}
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                    </div>
                    <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white/90 border border-slate-200/50 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-4 focus:ring-violet-500/20 focus:border-violet-400 focus:shadow-[0_0_20px_-5px_rgba(139,92,246,0.15)] transition-all outline-none shadow-sm"
                    placeholder="••••••••"
                    required
                    />
                </div>
                </div>
            </div>

            <div className="mt-auto pt-4">
                <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold tracking-wide py-4 rounded-2xl shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                ) : (
                    isLogin ? 'Sign In to Workspace' : 'Create Account'
                )}
                </button>
            </div>
          </form>

          <div className="mt-6 text-center relative z-10 border-t border-slate-100 pt-6">
            <button
              onClick={() => {
                  setIsLogin(!isLogin);
                  setMessage(null);
                  setEmail('');
                  setPassword('');
              }}
              className="text-sm font-semibold text-slate-500 hover:text-violet-700 transition-colors px-4 py-2 rounded-lg hover:bg-violet-50/50"
            >
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span className="text-violet-600">{isLogin ? "Sign up" : "Sign in"}</span>
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};
