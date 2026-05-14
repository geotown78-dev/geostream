import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, User, Play, LogOut, Settings } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../contexts/AuthContext';
import { ADMIN_EMAILS } from '../constants';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Navbar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  const navItems = [
    { name: 'მთავარი', path: '/' },
    { name: 'ლაივი', path: '/live' },
    { name: 'განრიგი', path: '/schedule' },
    { name: 'გუნდები', path: '/teams' },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-brand-black px-6 py-6 border-b border-brand-border backdrop-blur-md bg-opacity-80">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center">
            <Play fill="white" size={20} className="ml-1" />
          </div>
          <span className="text-2xl font-bold tracking-tight uppercase italic flex items-center">
            GEO <span className="text-brand-primary ml-1">STREAM</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-2 bg-brand-surface/50 px-2 py-1 rounded-full border border-brand-border">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold tracking-widest transition-all uppercase",
                location.pathname === item.path 
                  ? "bg-brand-primary text-white" 
                  : "text-zinc-500 hover:text-white"
              )}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2 bg-brand-surface/50 px-3 py-1.5 rounded-full border border-brand-border">
              <div className="w-2 h-2 rounded-full bg-brand-secondary"></div>
              <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest leading-none">SUPABASE: ON</span>
            </div>
          </div>
          
          {user ? (
            <div className="flex items-center gap-3">
              {ADMIN_EMAILS.includes(user.email || '') && (
                <Link 
                  to="/admin" 
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2",
                    location.pathname === '/admin'
                      ? "bg-brand-primary text-white border-brand-primary"
                      : "bg-brand-primary/10 text-brand-primary border-brand-primary/20 hover:bg-brand-primary/20"
                  )}
                >
                  <Settings size={14} />
                  ადმინ პანელი
                </Link>
              )}
              <div className="flex items-center gap-2 px-3 py-2 bg-brand-surface rounded-xl border border-brand-border">
                <User size={14} className="text-zinc-500" />
                <span className="text-[10px] font-bold text-zinc-100 uppercase tracking-widest truncate max-w-[100px]">
                  {user.email?.split('@')[0]}
                </span>
              </div>
              <button 
                onClick={signOut}
                className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                title="გამოსვლა"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link 
              to="/login"
              className="px-6 py-2 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all"
            >
              შესვლა
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export function Hero({ activeBroadcast }: { activeBroadcast?: any }) {
  return (
    <section className="relative h-[60vh] flex items-center justify-center overflow-hidden pt-20 rounded-[2.5rem] mt-6 mx-6">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541252260730-0412e3e2108e?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center">
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/40 to-transparent" />
        <div className="absolute inset-0 bg-brand-primary/10 mix-blend-overlay" />
      </div>
      
      <div className="relative z-10 text-center px-4 max-w-4xl">
        <div className={cn(
          "inline-flex items-center gap-2 border px-3 py-1 rounded-full text-[10px] font-black uppercase mb-6 tracking-widest transition-all duration-500",
          activeBroadcast 
            ? "bg-red-600/20 text-red-500 border-red-500/30 animate-pulse" 
            : "bg-zinc-800/20 text-zinc-500 border-zinc-500/30"
        )}>
          <span className={cn("w-2 h-2 rounded-full", activeBroadcast ? "bg-red-500" : "bg-zinc-600")}></span> 
          {activeBroadcast ? 'ქსელი აქტიურია' : 'ქსელი მოლოდინშია'}
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 text-white drop-shadow-2xl uppercase">
          {activeBroadcast ? (
            <>ახლა გადის: <span className="text-brand-primary">{activeBroadcast.room_id}</span></>
          ) : (
            'აიყვანე თამაში ახალ დონეზე'
          )}
        </h1>
        <Link 
          to={activeBroadcast ? `/watch/${activeBroadcast.room_id}` : "/live"} 
          className="inline-flex items-center gap-3 px-10 py-5 bg-brand-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)]"
        >
          {activeBroadcast ? 'შემოუერთდით' : 'უყურეთ GEOSTREAM-ზე'}
          <Play fill="white" size={16} />
        </Link>
      </div>
    </section>
  );
}

export function EventCard({ event }: { event: any }) {
  return (
    <Link to={`/watch/${event.room_name}`} className="group bento-card block transition-all hover:border-brand-primary/50 relative">
      <div className="aspect-[16/10] overflow-hidden relative">
        <img 
          src={event.thumbnail} 
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-surface via-brand-surface/20 to-transparent" />
        
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          {event.is_live && (
            <div className="bg-red-600 text-white px-2 py-1 rounded-md text-[9px] font-black flex items-center gap-1.5 uppercase transition-transform group-hover:scale-105">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> 
              ლაივი
            </div>
          )}
          <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider">
            4K სტრიმი
          </div>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <h3 className="text-xl font-black mb-1 group-hover:text-brand-primary transition-colors">{event.title}</h3>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">მოწოდებულია GeoStream ქსელის მიერ</p>
        </div>
      </div>
    </Link>
  );
}
