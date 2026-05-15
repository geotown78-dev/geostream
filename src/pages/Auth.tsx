import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, Loader2, Mail, Lock } from 'lucide-react';

export default function AuthPage({ mode = 'login' }: { mode?: 'login' | 'register' }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 flex items-center justify-center text-white">
      <div className="bento-card max-w-md w-full p-10 bg-zinc-900/40 space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black italic tracking-tighter uppercase text-white">
            {mode === 'login' ? 'ავტორიზაცია' : 'რეგისტრაცია'}
          </h1>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest leading-none">
            კეთილი იყოს თქვენი მობრძანება GeoStream ქსელში
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-xl animate-in shake duration-300">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-brand-secondary/10 border border-brand-secondary/20 text-brand-secondary text-xs font-bold rounded-xl animate-in slide-in-from-top-4 duration-300">
            რეგისტრაცია წარმატებულია! გთხოვთ შეამოწმოთ იმეილი აქტივაციისთვის.
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3.5 bg-white text-black font-bold rounded-2xl hover:bg-zinc-100 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-sm disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.53 12-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google-ით გაგრძელება
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-border"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-zinc-600">
              <span className="bg-[#0c0c0c] px-3">ან</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">იმეილი</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-black border border-brand-border rounded-2xl p-4 pl-12 focus:border-brand-primary outline-none transition-all font-bold text-sm text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">პაროლი</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black border border-brand-border rounded-2xl p-4 pl-12 focus:border-brand-primary outline-none transition-all font-bold text-sm text-white"
              />
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full py-4 bg-brand-primary text-white font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_-15px_rgba(99,102,241,0.5)] disabled:opacity-50 disabled:scale-100"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : mode === 'login' ? (
              <>შესვლა <LogIn size={18} /></>
            ) : (
              <>რეგისტრაცია <UserPlus size={18} /></>
            )}
          </button>
        </form>

        <div className="text-center pt-4">
          <Link
            to={mode === 'login' ? '/register' : '/login'}
            className="text-[10px] font-black text-brand-primary uppercase tracking-widest hover:underline"
          >
            {mode === 'login' ? 'არ გაქვს ანგარიში? შექმენი' : 'უკვე გაქვს ანგარიში? გაიარე ავტორიზაცია'}
          </Link>
        </div>
      </div>
    </div>
  );
}
