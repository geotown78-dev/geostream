import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  User, Play, LogOut, Settings, 
  Home as HomeIcon, Trophy, Radio, LayoutList, Users, Newspaper,
  Facebook, Instagram, Youtube, Calendar, Clock, Trash2,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../contexts/AuthContext';
import { ADMIN_EMAILS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

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
    { icon: LayoutList, path: '/stats', label: 'ლიდერბორდი' },
    { icon: Users, path: '/fighters', label: 'მებრძოლები' },
  ];

  const handleSamePageClick = (path: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname === path) {
      e.preventDefault();
      window.location.reload();
    }
  };

  return (
    <aside className="fixed sm:left-0 bottom-0 sm:top-0 h-16 sm:h-full w-full sm:w-20 bg-brand-surface/95 backdrop-blur-xl border-t sm:border-t-0 sm:border-r border-brand-border flex sm:flex-col flex-row items-center justify-around sm:justify-start sm:py-6 z-[60]">
      <Link to="/" onClick={handleSamePageClick('/')} className="mb-10 hidden sm:flex">
        <div className="w-12 h-12 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
          <Play fill="white" size={24} className="ml-1" />
        </div>
      </Link>

      <nav className="flex-1 flex sm:flex-col flex-row sm:gap-8 items-center sm:w-full justify-around sm:justify-start">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={handleSamePageClick(item.path)}
            className={cn(
              "group relative p-2 sm:p-3 rounded-xl transition-all duration-300 flex flex-col items-center justify-center",
              location.pathname === item.path 
                ? "text-brand-primary sm:bg-brand-primary sm:text-white" 
                : "text-zinc-500 hover:text-white hover:bg-white/5"
            )}
            title={item.label}
          >
            <item.icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
            {location.pathname === item.path && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute left-[-1.5rem] w-1 h-8 bg-brand-primary rounded-r-full hidden sm:block"
              />
            )}
            <div className="sm:hidden text-[7px] font-black uppercase tracking-tighter mt-0.5 text-center leading-none">{item.label}</div>
          </Link>
        ))}
      </nav>

      <div className="hidden sm:flex flex-col gap-6 items-center justify-center">
        <Link
          to="/profile"
          onClick={handleSamePageClick('/profile')}
          className={cn(
            "p-3 rounded-xl transition-all duration-300 flex items-center justify-center border border-transparent",
            location.pathname === '/profile'
              ? "text-brand-primary bg-brand-primary/10 border-brand-primary/20"
              : "text-zinc-500 hover:text-white hover:bg-white/5"
          )}
          title="პროფილი"
        >
          <User className="w-[22px] h-[22px]" strokeWidth={2.5} />
        </Link>
      </div>
    </aside>
  );
}

export function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const userEmail = user?.email || '';
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || userEmail.split('@')[0];
  const userInitial = userName ? userName[0].toUpperCase() : '';

  const tabs = [
    { name: 'მთავარი', path: '/' },
    { name: 'ფეხბურთი', path: '/football' },
    { name: 'UFC', path: '/ufc' },
    { name: 'სტატისტიკა', path: '/stats' },
  ];

  const handleSamePageClick = (path: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname === path) {
      e.preventDefault();
      window.location.reload();
    }
  };

  return (
    <header className="fixed top-0 sm:left-20 left-0 right-0 h-16 sm:h-20 bg-brand-black/80 backdrop-blur-xl border-b border-brand-border z-50 flex items-center justify-between px-4 sm:px-8">
      <div className="flex items-center gap-4">
        <Link to="/" onClick={handleSamePageClick('/')} className="sm:hidden">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
            <Play fill="white" size={16} className="ml-0.5" />
          </div>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-8 overflow-x-auto no-scrollbar py-2 max-w-[125px] min-[370px]:max-w-[170px] min-[450px]:max-w-[240px] sm:max-w-none">
          {tabs.map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              onClick={handleSamePageClick(tab.path)}
              className={cn(
                "text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                location.pathname === tab.path ? "text-brand-primary" : "text-zinc-400 hover:text-white"
              )}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        {user ? (
          <div className="flex items-center gap-2 sm:gap-4">
            {ADMIN_EMAILS.includes(user.email || '') && (
              <Link 
                to="/admin" 
                onClick={handleSamePageClick('/admin')}
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all animate-fade-in"
              >
                <Settings size={12} className="sm:w-[14px] sm:h-[14px]" />
                <span className="hidden sm:inline">ადმინ</span>
              </Link>
            )}
            <Link 
              to="/profile" 
              onClick={handleSamePageClick('/profile')}
              className="flex items-center gap-2 bg-brand-surface border border-brand-border rounded-lg p-1.5 sm:px-3 sm:py-1.5 hover:border-brand-primary/30 transition-all cursor-pointer"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-brand-primary flex items-center justify-center text-[9px] sm:text-[10px] font-black text-white uppercase">
                {userInitial}
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-zinc-300 truncate max-w-[60px] sm:max-w-[100px] hidden sm:inline uppercase">{userName}</span>
            </Link>
            <button onClick={signOut} className="text-zinc-500 hover:text-brand-primary transition-colors p-1">
              <LogOut size={18} className="sm:w-[20px] sm:h-[20px]" />
            </button>
          </div>
        ) : (
          <Link 
            to="/login"
            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-brand-primary text-white text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-lg hover:bg-brand-primary-dark transition-all"
          >
            შესვლა
          </Link>
        )}
      </div>
    </header>
  );
}

export function Hero({ activeBroadcast, exclusiveEvent, exclusiveEvents = [] }: { activeBroadcast?: any, exclusiveEvent?: any, exclusiveEvents?: any[] }) {
  const [timeLeft, setTimeLeft] = React.useState({ days: '00', hours: '00', minutes: '00', seconds: '00' });

  const slides = React.useMemo(() => {
    const list: any[] = [];
    if (exclusiveEvents && exclusiveEvents.length > 0) {
      exclusiveEvents.forEach((ev, idx) => {
        list.push({
          id: ev.id || `exclusive-${idx}`,
          title: ev.team1 ? `${ev.team1} VS ${ev.team2}` : ev.title,
          event: ev.sport || ev.league || "რჩეული ღონისძიება",
          date: ev.time ? new Date(ev.time).toLocaleString('ka-GE', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : "ახლა პირდაპირ ეთერში",
          image: ev.thumbnail || "https://images.unsplash.com/photo-1504450758481-7338ef7535af?auto=format&fit=crop&q=80&w=2000",
          room_id: ev.room_name || ev.id,
          targetDate: ev.time ? new Date(ev.time) : null,
          isLive: !!ev.is_live,
          original: ev
        });
      });
    } else if (exclusiveEvent) {
      list.push({
        id: exclusiveEvent.id || 'exclusive-event',
        title: exclusiveEvent.team1 ? `${exclusiveEvent.team1} VS ${exclusiveEvent.team2}` : exclusiveEvent.title,
        event: exclusiveEvent.sport || exclusiveEvent.league || "რჩეული ღონისძიება",
        date: exclusiveEvent.time ? new Date(exclusiveEvent.time).toLocaleString('ka-GE', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : "ახლა პირდაპირ ეთერში",
        image: exclusiveEvent.thumbnail || "https://images.unsplash.com/photo-1504450758481-7338ef7535af?auto=format&fit=crop&q=80&w=2000",
        room_id: exclusiveEvent.room_name || exclusiveEvent.id,
        targetDate: exclusiveEvent.time ? new Date(exclusiveEvent.time) : null,
        isLive: !!exclusiveEvent.is_live,
        original: exclusiveEvent
      });
    } else if (activeBroadcast) {
      list.push({
        id: 'active-broadcast',
        title: activeBroadcast.room_id.replace(/-/g, ' ').toUpperCase(),
        event: "პირდაპირი ეთერი",
        date: "მიმდინარეობს პირდაპირი ეთერი",
        image: "https://images.unsplash.com/photo-1541252260730-0412e3e2108e?auto=format&fit=crop&q=80&w=2000",
        room_id: activeBroadcast.room_id,
        targetDate: null,
        isLive: true,
        original: activeBroadcast
      });
    }
    return list;
  }, [exclusiveEvents, exclusiveEvent, activeBroadcast]);

  const [currentIndex, setCurrentIndex] = React.useState(0);

  // If slide count decreases, clamp currentIndex to avoid out-of-bound errors
  React.useEffect(() => {
    if (currentIndex >= slides.length) {
      setCurrentIndex(0);
    }
  }, [slides, currentIndex]);

  const activeSlide = slides[currentIndex];

  React.useEffect(() => {
    if (!activeSlide?.targetDate) {
      setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' });
      return;
    }

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = activeSlide.targetDate!.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({
        days: days.toString().padStart(2, '0'),
        hours: hours.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0')
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSlide?.targetDate]);

  // Handle Automatic Slide
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    if (slides.length <= 1 || isHovered) return;

    const autoSlideInterval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 7000);

    return () => clearInterval(autoSlideInterval);
  }, [slides.length, isHovered]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full aspect-[16/10] xs:aspect-[16/9] sm:aspect-auto h-auto sm:h-[500px] rounded-2xl overflow-hidden mb-6 sm:mb-12 group/hero bg-brand-surface border border-brand-border"
    >
      {activeSlide ? (
        <>
          <div className="absolute inset-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 flex items-center justify-center bg-zinc-950"
              >
                {/* 1. Ambient blurred backdrop so there are no empty gaps/spaces */}
                <div className="absolute inset-0 overflow-hidden select-none pointer-events-none">
                  <img 
                    src={activeSlide.image} 
                    className="w-full h-full object-cover scale-110 blur-3xl opacity-35 saturate-125"
                    alt=""
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                {/* 2. Foreground crisp image displayed completely without cropping */}
                <img 
                  src={activeSlide.image} 
                  className="w-full h-full object-cover relative z-10 transition-transform duration-[2s]"
                  alt=""
                  referrerPolicy="no-referrer"
                />
                
                {/* 3. Gradient mask for readable text labels */}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-black/95 via-brand-black/40 to-transparent z-20" />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative h-full flex flex-col justify-end p-4 xs:p-6 sm:p-12 z-30 pb-12 sm:pb-16 select-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="max-w-2xl space-y-1.5 xs:space-y-3 sm:space-y-6"
              >
                <div className="flex items-center gap-1.5 sm:gap-3">
                  <span className="bg-brand-primary text-white text-[7px] sm:text-[10px] font-black px-1.5 py-0.5 rounded italic whitespace-nowrap">ექსკლუზივი</span>
                  <span className="text-brand-primary text-[7px] sm:text-[10px] font-black tracking-[0.2em] uppercase text-shadow-sm truncate">{activeSlide.event}</span>
                </div>
                
                <h1 className="text-base xs:text-xl sm:text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-[0.9]">
                  {activeSlide.title.includes('VS') ? activeSlide.title.split('VS').map((part: string, i: number) => (
                    <React.Fragment key={i}>
                      {i > 0 && <span className="text-brand-primary mx-1 sm:mx-4 text-shadow-glow drop-shadow-[0_0_15px_rgba(255,0,51,0.8)]">VS</span>}
                      {part.trim()}
                    </React.Fragment>
                  )) : activeSlide.title}
                </h1>

                <div className="flex flex-row items-center gap-3 sm:gap-6 text-zinc-400 font-bold uppercase tracking-widest text-[7px] xs:text-[9px] sm:text-[11px]">
                  <div className="flex items-center gap-1">
                    <Calendar className="text-brand-primary min-w-[10px]" size={10} />
                    <span className="truncate">{activeSlide.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="text-brand-primary min-w-[10px]" size={10} />
                    <span className="truncate">სრული ტრანსლაცია</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 pt-1 sm:pt-4">
                  {activeSlide.isLive && (
                    <Link 
                      to={`/watch/${activeSlide.room_id}`}
                      className="flex items-center gap-1 text-center justify-center sm:gap-3 px-3 sm:px-8 py-2 sm:py-4 bg-brand-primary text-white font-black uppercase tracking-widest text-[8px] sm:text-xs rounded-lg hover:bg-brand-primary-dark transition-all transform hover:scale-105 shadow-2xl shadow-brand-primary/40 animate-pulse whitespace-nowrap"
                    >
                      <Play fill="currentColor" size={10} className="sm:w-4 sm:h-4" />
                      ლაივის ყურება
                    </Link>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {activeSlide.targetDate && (
              <div className="absolute right-4 bottom-4 sm:right-12 sm:bottom-12 flex gap-1 sm:gap-4 scale-[0.55] min-[380px]:scale-[0.65] xs:scale-75 sm:scale-100 origin-bottom-right z-20">
                {[
                  { label: 'დღე', value: timeLeft.days },
                  { label: 'სთ', value: timeLeft.hours },
                  { label: 'წთ', value: timeLeft.minutes },
                  { label: 'წმ', value: timeLeft.seconds }
                ].map((item, i) => (
                  <div key={i} className="glass-card p-1 sm:p-4 min-w-[32px] xs:min-w-[50px] sm:min-w-[70px] text-center">
                    <div className="text-[10px] xs:text-base sm:text-xl font-black text-white leading-none whitespace-nowrap">{item.value}</div>
                    <div className="text-[5px] sm:text-[9px] font-black text-brand-primary uppercase mt-0.5 sm:mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nav arrows */}
          {slides.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.preventDefault(); prevSlide(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-40 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-brand-primary text-white border border-white/10 flex items-center justify-center transition-all opacity-0 group-hover/hero:opacity-100 backdrop-blur-sm cursor-pointer hover:scale-105"
                title="წინა"
              >
                <ChevronLeft size={18} className="sm:w-6 sm:h-6" />
              </button>
              <button 
                onClick={(e) => { e.preventDefault(); nextSlide(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-40 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-brand-primary text-white border border-white/10 flex items-center justify-center transition-all opacity-0 group-hover/hero:opacity-100 backdrop-blur-sm cursor-pointer hover:scale-105"
                title="შემდეგი"
              >
                <ChevronRight size={18} className="sm:w-6 sm:h-6" />
              </button>
            </>
          )}

          {/* Dot indicators */}
          {slides.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.preventDefault(); setCurrentIndex(idx); }}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                    currentIndex === idx 
                      ? 'bg-brand-primary w-6' 
                      : 'bg-white/30 hover:bg-white/65'
                  }`}
                  title={`${idx + 1}-ე სლაიდი`}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 border-brand-border bg-[radial-gradient(circle_at_center,_var(--color-brand-primary)_0%,_transparent_100%)] opacity-20">
          <Play size={40} className="text-brand-primary mb-4 animate-pulse" />
          <h2 className="text-2xl sm:text-4xl font-black italic uppercase tracking-widest opacity-50">GeoStream Network</h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] mt-2 opacity-30">მოლოდინის რეჟიმი</p>
        </div>
      )}
    </section>
  );
}

export function LiveCard({ event, onDelete }: { event: any, onDelete?: (id: string) => void }) {
  const { user } = useAuth();
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  return (
    <div className="group relative block aspect-video rounded-xl overflow-hidden bg-brand-surface border border-brand-border hover:border-brand-primary/50 transition-all">
      <Link to={`/watch/${event.room_name || event.id}`} className="absolute inset-0 z-10">
        <img src={event.thumbnail} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      </Link>
      
      <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
        <div className="bg-brand-primary text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1.5 uppercase">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          ლაივი
        </div>
        <div className="bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-black flex items-center gap-1 text-zinc-300">
          <Users size={10} />
          {event.viewers || '1.2K'}
        </div>
      </div>

      {isAdmin && onDelete && (
        <button 
          onClick={() => onDelete(event.id)}
          className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md text-red-500 hover:bg-red-500 hover:text-white rounded-lg z-30 transition-all"
        >
          <Trash2 size={12} />
        </button>
      )}

      <div className="absolute inset-0 flex items-center justify-center gap-4 px-4 pointer-events-none z-20">
        <div className="text-center flex-1">
          <div className="w-12 h-12 mx-auto mb-2 bg-white/5 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
            <Trophy size={20} className="text-white" />
          </div>
          <div className="text-[11px] font-black text-white uppercase truncate">{event.team1 || event.title}</div>
        </div>
        <div className="text-xs font-black italic text-brand-primary text-shadow-glow">VS</div>
        <div className="text-center flex-1">
          <div className="w-12 h-12 mx-auto mb-2 bg-white/5 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
            <Trophy size={20} className="text-white" />
          </div>
          <div className="text-[11px] font-black text-white uppercase truncate">{event.team2 || 'TBA'}</div>
        </div>
      </div>

      <div className="absolute bottom-3 left-4 z-20">
        <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{event.league || 'GeoStream Network'}</div>
      </div>
    </div>
  );
}

export function UpcomingCard({ event, onDelete }: { event: any, onDelete?: (id: string) => void }) {
  const { user } = useAuth();
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');
  const date = new Date(event.time || Date.now());
  const month = date.toLocaleString('ka-GE', { month: 'short' }).toUpperCase();
  const day = date.getDate();
  const time = date.toLocaleString('ka-GE', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div 
      className="relative block bg-brand-surface border border-brand-border rounded-xl p-5 shadow-lg overflow-hidden select-none"
    >
      {event.thumbnail && (
        <div className="absolute inset-0 opacity-15">
          <img src={event.thumbnail} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
        </div>
      )}
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col items-center">
            <div className="bg-brand-primary text-[8px] font-black px-2 py-0.5 rounded-t w-full text-center">{month}</div>
            <div className="bg-white/5 w-full text-center py-1 text-sm font-black rounded-b border-x border-b border-brand-border backdrop-blur-sm">{day}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-[10px] font-black text-zinc-400">{time}</div>
            {isAdmin && onDelete && (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(event.id);
                }}
                className="p-1.5 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded transition-all relative z-25 cursor-pointer"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="text-center flex-1">
            <div className="w-10 h-10 mx-auto mb-2 bg-white/5 rounded-full flex items-center justify-center border border-white/10 backdrop-blur-sm">
              <Trophy size={16} className="text-zinc-400" />
            </div>
            <div className="text-[10px] font-black text-zinc-300 uppercase truncate">{event.team1 || 'გუნდი ა'}</div>
          </div>
          <div className="text-[10px] font-black italic text-brand-primary text-shadow-glow">VS</div>
          <div className="text-center flex-1">
            <div className="w-10 h-10 mx-auto mb-2 bg-white/5 rounded-full flex items-center justify-center border border-white/10 backdrop-blur-sm">
              <Trophy size={16} className="text-zinc-400" />
            </div>
            <div className="text-[10px] font-black text-zinc-300 uppercase truncate">{event.team2 || 'გუნდი ბ'}</div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{event.sport || event.league || 'ღონისძიება'}</div>
          <span className="text-[8px] font-black uppercase text-brand-primary tracking-widest bg-brand-primary/10 px-2 py-0.5 rounded">
            მოლოდინი
          </span>
        </div>
      </div>
    </div>
  );
}
