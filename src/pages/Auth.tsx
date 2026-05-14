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

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 flex items-center justify-center">
      <div className="bento-card max-w-md w-full p-10 bg-zinc-900/40 space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black italic tracking-tighter uppercase">
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
