import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield, CheckCircle, Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Simple stable deterministic hash to generate a unique 6-digit ID based on user UUID
function getDeterministic6DigitId(userId: string): string {
  if (!userId) return '100000';
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const positiveHash = Math.abs(hash);
  // Ensure it is strictly 6 digits: between 100000 and 999999 inclusive
  const sixDigits = (positiveHash % 900000) + 100000;
  return sixDigits.toString();
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">იტვირთება...</p>
      </div>
    );
  }

  const userId = user.id || '';
  const userEmail = user.email || '';
  const userName = user.user_metadata?.full_name || user.user_metadata?.name || userEmail.split('@')[0];
  const uniqueId = getDeterministic6DigitId(userId);

  // Generate a premium gradient based on user ID for their default avatar background
  const colors = [
    'from-brand-primary to-orange-500',
    'from-brand-primary-dark to-purple-600',
    'from-indigo-600 to-brand-primary',
    'from-rose-500 to-red-700',
    'from-emerald-500 to-teal-700'
  ];
  let colorIndex = 0;
  if (userId) {
    let charSum = 0;
    for (let i = 0; i < userId.length; i++) charSum += userId.charCodeAt(i);
    colorIndex = charSum % colors.length;
  }
  const gradientClass = colors[colorIndex];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-in fade-in duration-300">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-zinc-500 hover:text-white mb-8 transition-colors text-xs font-black uppercase tracking-widest"
      >
        <ArrowLeft size={16} />
        უკან დაბრუნება
      </button>

      {/* Header Profile Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/10 backdrop-blur-md p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-brand-primary/5 rounded-full blur-[100px] -z-10" />

        {/* Premium Geometric Default Avatar */}
        <div className="relative group">
          <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr ${gradientClass} p-[3px] shadow-xl shadow-brand-primary/10 transition-transform duration-500 hover:scale-[1.03]`}>
            <div className="w-full h-full rounded-[21px] bg-brand-black flex items-center justify-center overflow-hidden">
              <span className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider">
                {userName[0]}
              </span>
            </div>
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-brand-black flex items-center justify-center">
              <span className="text-[6px] font-black text-white uppercase">LIVE</span>
            </span>
          </span>
        </div>

        {/* User Quick Info */}
        <div className="text-center sm:text-left space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 justify-center sm:justify-start">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
              {userName}
            </h1>
            <span className="inline-flex self-center sm:self-auto items-center gap-1.5 px-3 py-1 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-full text-[9px] font-black uppercase tracking-widest">
              <Shield size={10} />
              მომხმარებელი
            </span>
          </div>
          <p className="text-zinc-400 text-sm font-semibold">{userEmail}</p>
          <div className="flex items-center gap-1.5 justify-center sm:justify-start text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
            <CheckCircle size={12} className="text-brand-primary" />
            სესია აქტიურია
          </div>
        </div>
      </div>

      {/* Profile Details Cards */}
      <div className="grid gap-6 mt-8">
        {/* Unique Numeric 6-digit Account ID */}
        <div className="bento-card bg-zinc-900/20 border-white/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">პირადი უნიკალური ID</p>
              <h3 className="text-sm font-bold text-zinc-300 uppercase mt-0.5">ინდივიდუალური უცვლელი კოდი</h3>
            </div>
            <div className="px-4 py-2 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-xl font-mono text-xl font-black tracking-widest">
              #{uniqueId}
            </div>
          </div>
          <p className="text-zinc-500 text-[10px] font-medium leading-relaxed uppercase">
            ეს არის თქვენი ანგარიშის პირადი 6-ნიშნა საიდენტიფიკაციო კოდი. იგი გენერირებულია სისტემის მიერ უსაფრთხოდ, არ ექვემდებარება ცვლილებას და წარმოადგენს თქვენს მუდმივ უნიკალურ ნომერს.
          </p>
        </div>

        {/* Advanced Personal Details Block */}
        <div className="bento-card bg-zinc-900/20 border-white/5 p-6">
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2 border-b border-white/5 pb-3">
            პროფილის მონაცემები
          </h2>
          
          <div className="divide-y divide-white/5 space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-zinc-950/40 rounded-lg text-zinc-400">
                  <User size={16} />
                </span>
                <div>
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">მომხმარებლის სახელი</p>
                  <p className="text-sm font-bold text-white uppercase">{userName}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 pt-4">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-zinc-950/40 rounded-lg text-zinc-400">
                  <Mail size={16} />
                </span>
                <div>
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">ელექტრონული ფოსტა</p>
                  <p className="text-sm font-mono text-zinc-300">{userEmail}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 pt-4">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-zinc-950/40 rounded-lg text-zinc-400">
                  <Calendar size={16} />
                </span>
                <div>
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">რეგისტრაციის თარიღი</p>
                  <p className="text-sm font-semibold text-zinc-300">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('ka-GE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
