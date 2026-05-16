import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  User, Play, LogOut, Settings, 
  Home as HomeIcon, Trophy, Radio, BarChart3, Users, Newspaper,
  Facebook, Instagram, Youtube, Calendar, Clock
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../contexts/AuthContext';
import { ADMIN_EMAILS } from '../constants';
import { motion } from 'framer-motion';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    { icon: HomeIcon, path: '/', label: 'მთავარი' },
    { icon: Trophy, path: '/sports', label: 'სპორტი' },
    { icon: Radio, path: '/live', label: 'ლაივი' },
    { icon: BarChart3, path: '/stats', label: 'რეიტინგები' },
    { icon: Users, path: '/fighters', label: 'მებრძოლები' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-20 bg-brand-surface border-r border-brand-border flex flex-col items-center py-6 z-[60]">
      <Link to="/" className="mb-10">
        <div className="w-12 h-12 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
          <Play fill="white" size={24} className="ml-1" />
        </div>
      </Link>

      <nav className="flex-1 flex flex-col gap-8">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "group relative p-3 rounded-xl transition-all duration-300",
              location.pathname === item.path 
                ? "bg-brand-primary text-white" 
                : "text-zinc-500 hover:text-white hover:bg-white/5"
            )}
            title={item.label}
          >
            <item.icon size={24} strokeWidth={2.5} />
            {location.pathname === item.path && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute left-[-1.5rem] w-1 h-8 bg-brand-primary rounded-r-full"
              />
            )}
          </Link>
        ))}
      </nav>

      <div className="flex flex-col gap-6 text-zinc-600">
        <a href="#" className="hover:text-white transition-colors"><Facebook size={20} /></a>
        <a href="#" className="hover:text-white transition-colors"><Instagram size={20} /></a>
      </div>
    </aside>
  );
}

export function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const tabs = [
    { name: 'მთავარი', path: '/' },
    { name: 'ფეხბურთი', path: '/football' },
    { name: 'UFC', path: '/ufc' },
  ];

  return (
    <header className="fixed top-0 left-20 right-0 h-20 bg-brand-black/80 backdrop-blur-xl border-b border-brand-border z-50 flex items-center justify-between px-8">
      <nav className="flex items-center gap-8">
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            to={tab.path}
            className={cn(
              "text-[11px] font-black uppercase tracking-widest transition-all",
              location.pathname === tab.path ? "text-brand-primary" : "text-zinc-400 hover:text-white"
            )}
          >
            {tab.name}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-6">
        {user ? (
          <div className="flex items-center gap-4">
            {ADMIN_EMAILS.includes(user.email || '') && (
              <Link 
                to="/admin" 
                className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all"
              >
                <Settings size={14} />
                ადმინ
              </Link>
            )}
            <div className="flex items-center gap-3 bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5">
              <div className="w-6 h-6 rounded bg-brand-primary flex items-center justify-center text-[10px] font-black">
                {user.email?.[0].toUpperCase()}
              </div>
              <span className="text-xs font-bold text-zinc-300 truncate max-w-[100px]">{user.email?.split('@')[0]}</span>
            </div>
            <button onClick={signOut} className="text-zinc-500 hover:text-brand-primary transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <Link 
            to="/login"
            className="px-6 py-2.5 bg-brand-primary text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-brand-primary-dark transition-all"
          >
            შესვლა
          </Link>
        )}
      </div>
    </header>
  );
}

export function Hero({ activeBroadcast, exclusiveEvent }: { activeBroadcast?: any, exclusiveEvent?: any }) {
  // Only render match info if exclusiveEvent or activeBroadcast is present
  const displayMatch = exclusiveEvent ? {
    title: exclusiveEvent.team1 ? `${exclusiveEvent.team1} VS ${exclusiveEvent.team2}` : exclusiveEvent.title,
    event: exclusiveEvent.sport || exclusiveEvent.league || "FEATURED EVENT",
    date: exclusiveEvent.time ? new Date(exclusiveEvent.time).toLocaleString('ka-GE', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : "ახლა პირდაპირ ეთერში",
    image: exclusiveEvent.thumbnail || "https://images.unsplash.com/photo-1504450758481-7338ef7535af?auto=format&fit=crop&q=80&w=2000",
    room_id: exclusiveEvent.room_name || exclusiveEvent.id
  } : activeBroadcast ? {
    title: activeBroadcast.room_id.replace(/-/g, ' ').toUpperCase(),
    event: "LIVE BROADCAST",
    date: "მიმდინარეობს პირდაპირი ეთერი",
    image: "https://images.unsplash.com/photo-1541252260730-0412e3e2108e?auto=format&fit=crop&q=80&w=2000",
    room_id: activeBroadcast.room_id
  } : null;

  return (
    <section className="relative h-[500px] rounded-2xl overflow-hidden mb-12 group bg-brand-surface border border-brand-border">
      {displayMatch ? (
        <>
          <div className="absolute inset-0">
            <img 
              src={displayMatch.image} 
              className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[2s]"
              alt=""
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-black to-transparent" />
          </div>

          <div className="relative h-full flex items-center px-12 z-10">
            <div className="max-w-2xl space-y-6">
              <div className="flex items-center gap-3">
                <span className="bg-brand-primary text-white text-[10px] font-black px-2 py-0.5 rounded italic">ექსკლუზივი</span>
                <span className="text-brand-primary text-[10px] font-black tracking-[0.2em] uppercase text-shadow-sm">{displayMatch.event}</span>
              </div>
              
              <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-[0.9]">
                {displayMatch.title.includes('VS') ? displayMatch.title.split('VS').map((part: string, i: number) => (
                  <span key={i}>
                    {i > 0 && <span className="text-brand-primary mx-4 text-shadow-glow">VS</span>}
                    {part.trim()}
                  </span>
                )) : displayMatch.title}
              </h1>

              <div className="flex items-center gap-6 text-zinc-400 font-bold uppercase tracking-widest text-[11px]">
                <div className="flex items-center gap-2">
                  <Calendar className="text-brand-primary" size={16} />
                  {displayMatch.date}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="text-brand-primary" size={16} />
                  სრული ტრანსლაცია
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <Link 
                  to={`/watch/${displayMatch.room_id}`}
                  className="flex items-center gap-3 px-8 py-4 bg-brand-primary text-white font-black uppercase tracking-widest text-xs rounded-lg hover:bg-brand-primary-dark transition-all transform hover:scale-105 shadow-2xl shadow-brand-primary/40"
                >
                  <Play fill="currentColor" size={18} />
                  ლაივ სტრიმი
                </Link>
                <button className="flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest text-xs rounded-lg transition-all backdrop-blur-md border border-white/10">
                  დეტალები
                </button>
              </div>
            </div>

            <div className="absolute right-12 top-12 flex gap-4">
              {[
                { label: 'დღე', value: '00' },
                { label: 'სთ', value: '00' },
                { label: 'წთ', value: '00' },
                { label: 'წმ', value: '00' }
              ].map((item, i) => (
                <div key={i} className="glass-card p-4 min-w-[70px] text-center">
                  <div className="text-xl font-black text-white leading-none">{item.value}</div>
                  <div className="text-[9px] font-black text-brand-primary uppercase mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center text-center p-12 bg-[radial-gradient(circle_at_center,_var(--color-brand-primary)_0%,_transparent_100%)] opacity-20">
          <Play size={48} className="text-brand-primary mb-6 animate-pulse" />
          <h2 className="text-4xl font-black italic uppercase tracking-widest opacity-50">GeoStream Network</h2>
          <p className="text-xs font-bold uppercase tracking-[0.3em] mt-4 opacity-30">მოლოდინის რეჟიმი</p>
        </div>
      )}
    </section>
  );
}

export function LiveCard({ event }: { event: any }) {
  return (
    <Link to={`/watch/${event.room_name || event.id}`} className="group relative block aspect-video rounded-xl overflow-hidden bg-brand-surface border border-brand-border hover:border-brand-primary/50 transition-all">
      <img src={event.thumbnail} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" alt="" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <div className="bg-brand-primary text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1.5 uppercase">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
        <div className="bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-black flex items-center gap-1 text-zinc-300">
          <Users size={10} />
          {event.viewers || '1.2K'}
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center gap-4 px-4">
        <div className="text-center flex-1">
          <div className="w-12 h-12 mx-auto mb-2 bg-white/5 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
            <Trophy size={20} className="text-white" />
          </div>
          <div className="text-[11px] font-black text-white uppercase truncate">{event.team1 || event.title}</div>
        </div>
        <div className="text-xs font-black italic text-brand-primary">VS</div>
        <div className="text-center flex-1">
          <div className="w-12 h-12 mx-auto mb-2 bg-white/5 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
            <Trophy size={20} className="text-white" />
          </div>
          <div className="text-[11px] font-black text-white uppercase truncate">{event.team2 || 'TBA'}</div>
        </div>
      </div>

      <div className="absolute bottom-3 left-4">
        <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{event.league || 'GeoStream Network'}</div>
      </div>
    </Link>
  );
}

export function UpcomingCard({ event }: { event: any }) {
  const date = new Date(event.time || Date.now());
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = date.getDate();
  const time = date.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div className="group relative block bg-brand-surface border border-brand-border rounded-xl p-5 hover:border-brand-primary/30 transition-all">
      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-col items-center">
          <div className="bg-brand-primary text-[8px] font-black px-2 py-0.5 rounded-t w-full text-center">{month}</div>
          <div className="bg-white/5 w-full text-center py-1 text-sm font-black rounded-b border-x border-b border-brand-border">{day}</div>
        </div>
        <div className="text-[10px] font-black text-zinc-400">{time}</div>
      </div>

      <div className="flex items-center justify-center gap-6 mb-6">
        <div className="text-center flex-1">
          <div className="w-10 h-10 mx-auto mb-2 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
            <Trophy size={16} className="text-zinc-400 group-hover:text-brand-primary transition-colors" />
          </div>
          <div className="text-[10px] font-black text-zinc-300 uppercase truncate">{event.team1 || 'TEAM A'}</div>
        </div>
        <div className="text-[10px] font-black italic text-zinc-700">VS</div>
        <div className="text-center flex-1">
          <div className="w-10 h-10 mx-auto mb-2 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
            <Trophy size={16} className="text-zinc-400 group-hover:text-brand-primary transition-colors" />
          </div>
          <div className="text-[10px] font-black text-zinc-300 uppercase truncate">{event.team2 || 'TEAM B'}</div>
        </div>
      </div>

      <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{event.sport || event.league || 'Event'}</div>
    </div>
  );
}
