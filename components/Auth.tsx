import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Mail, Lock, Loader2, BookOpen, FileText, Zap, Brain, Clock, ArrowRight } from 'lucide-react';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
          setError('Success! Please check your email for a confirmation link to log in.');
          return;
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-violet-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-6xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left: Auth Form */}
          <div className="w-full bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-violet-200/40 p-8 border border-white/60">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30 mb-4">
            <BookOpen size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-800 tracking-tight">WorkSphere</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Your Personal Study Space</p>
        </div>

        {error && (
          <div className="bg-rose-50/80 text-rose-600 p-4 rounded-xl text-sm font-medium mb-6 border border-rose-100">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
                  placeholder="John Doe"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-slate-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
                placeholder="student@university.edu"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-slate-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-6"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-medium text-slate-500 hover:text-violet-600 transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
          </div>

          {/* Right: Feature Showcase */}
          <div className="hidden lg:flex flex-col gap-4">
            <div className="mb-2">
              <h3 className="text-2xl font-display font-bold text-slate-800 mb-1">PowerPacked Features</h3>
              <p className="text-sm text-slate-500 font-medium">Everything you need to ace your studies</p>
            </div>

            {/* Feature Cards */}
            <div className="space-y-3">
              {/* Scan Card */}
              <div className="group p-5 bg-gradient-to-br from-violet-50/80 to-indigo-50/50 backdrop-blur-sm rounded-2xl border border-violet-200/40 hover:border-violet-400/60 transition-all hover:shadow-lg hover:shadow-violet-500/20 hover:-translate-y-1 cursor-default">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-violet-500/30 flex-shrink-0 group-hover:scale-110 transition-transform">
                    <FileText size={24} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 text-sm">Smart Scanning</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Upload PDFs, docs & images</p>
                  </div>
                </div>
              </div>

              {/* Analyze Card */}
              <div className="group p-5 bg-gradient-to-br from-fuchsia-50/80 to-violet-50/50 backdrop-blur-sm rounded-2xl border border-fuchsia-200/40 hover:border-fuchsia-400/60 transition-all hover:shadow-lg hover:shadow-fuchsia-500/20 hover:-translate-y-1 cursor-default">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-fuchsia-500/30 flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Brain size={24} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 text-sm">AI Analysis</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Get instant summaries & insights</p>
                  </div>
                </div>
              </div>

              {/* Focus Timer Card */}
              <div className="group p-5 bg-gradient-to-br from-indigo-50/80 to-blue-50/50 backdrop-blur-sm rounded-2xl border border-indigo-200/40 hover:border-indigo-400/60 transition-all hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-1 cursor-default">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/30 flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Clock size={24} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 text-sm">Focus Timer</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Pomodoro & deep work sessions</p>
                  </div>
                </div>
              </div>

              {/* Flashcards Card */}
              <div className="group p-5 bg-gradient-to-br from-violet-50/80 to-purple-50/50 backdrop-blur-sm rounded-2xl border border-violet-200/40 hover:border-violet-400/60 transition-all hover:shadow-lg hover:shadow-violet-500/20 hover:-translate-y-1 cursor-default">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-violet-500/30 flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Zap size={24} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 text-sm">Generate Flashcards</h4>
                    <p className="text-xs text-slate-500 mt-0.5">AI-powered study cards</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Text */}
            <div className="mt-6 p-4 bg-gradient-to-r from-violet-500/5 to-indigo-500/5 rounded-xl border border-violet-200/30 backdrop-blur-sm">
              <p className="text-xs text-slate-600 font-medium flex items-center gap-2">
                <ArrowRight size={14} className="text-violet-600" />
                <span>Join thousands of students boosting their grades</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
