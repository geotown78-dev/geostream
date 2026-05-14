import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Hero, EventCard } from '../components/UI';
import { MOCK_EVENTS, SCHEDULE } from '../constants';
import { Calendar, TrendingUp, Play, Trash2, Edit3 } from 'lucide-react';
import { supabase, Event } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ADMIN_EMAILS } from '../constants';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  const [events, setEvents] = useState<Event[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [activeBroadcast, setActiveBroadcast] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(1);
  const [liveStats, setLiveStats] = useState({ activeRooms: 0, totalParticipants: 0 });

  useEffect(() => {
    // 1. Supabase Presence for Site Online Users
    const presenceChannel = supabase.channel('site-presence', {
      config: { presence: { key: Math.random().toString(36).substring(7) } }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState();
        setOnlineCount(Object.keys(newState).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ online_at: new Date().toISOString() });
        }
      });

    // 2. Fetch LiveKit Stats from Backend
    const fetchLiveStats = async () => {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        setLiveStats(data);
      } catch (e) {
        console.warn('Failed to fetch live stats');
      }
    };

    fetchLiveStats();
    const statsInterval = setInterval(fetchLiveStats, 10000); // Update every 10s

    // 3. Initial fetch for active stream
    const fetchActiveStream = async () => {
      try {
        const { data, error } = await supabase
          .from('active_streams')
          .select('*')
          .eq('id', 'global-stream')
          .single();
        
        if (error) {
          if (error.code !== 'PGRST116') { // Ignore "no rows found" error
            console.warn('Active stream check skipped (Table might not exist):', error.message);
          }
          return;
        }

        if (data?.is_active) {
          setActiveBroadcast(data);
        }
      } catch (err) {
        console.warn('Network issue checking stream status');
      }
    };

    fetchActiveStream();

    // Real-time subscription
    const channel = supabase
      .channel('active-streams-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'active_streams' },
        (payload: any) => {
          if (payload.new && payload.new.id === 'global-stream') {
            setActiveBroadcast(payload.new.is_active ? payload.new : null);
          }
        }
      )
      .subscribe();

    async function fetchCMSData() {
      if (!supabase || !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
        setLoading(false);
        return;
      }
      try {
        // Fetch Events
        const { data: eData, error: eErr } = await supabase.from('events').select('*').order('created_at', { ascending: false });
        if (eErr && eErr.code !== 'PGRST205') console.warn('Error fetching events:', eErr);
        if (eData && eData.length > 0) setEvents(eData);

        // Fetch Highlights
        const { data: hData, error: hErr } = await supabase.from('highlights').select('*').order('created_at', { ascending: false });
        if (hErr && hErr.code !== 'PGRST205') console.warn('Error fetching highlights:', hErr);
        if (hData && hData.length > 0) setHighlights(hData);

        // Fetch Schedule
        const { data: scData, error: scErr } = await supabase.from('schedule').select('*').order('created_at', { ascending: false });
        if (scErr && scErr.code !== 'PGRST205') console.warn('Error fetching schedule:', scErr);
        if (scData && scData.length > 0) setSchedule(scData);

      } catch (err) {
        console.warn('CMS data fetch skipped:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCMSData();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(presenceChannel);
      clearInterval(statsInterval);
    };
  }, []);

  const handleDelete = async (table: string, id: string) => {
    if (!window.confirm('ნამდვილად გსურთ წაშლა?')) return;
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      
      // Refresh local state
      if (table === 'events') setEvents(prev => prev.filter(e => e.id !== id));
      if (table === 'highlights') setHighlights(prev => prev.filter(h => h.id !== id));
      if (table === 'schedule') setSchedule(prev => prev.filter(s => (s.id && s.id !== id))); 
      
      // Full refresh to be sure
      window.location.reload();
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <Hero activeBroadcast={activeBroadcast} />
      
      <main className="max-w-[1600px] mx-auto px-6 mt-16 space-y-12">
        {/* Bento Grid Header */}
        <div className="grid grid-cols-12 gap-6">
          <section className="col-span-12 lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">პოპულარული <span className="text-brand-primary">ლაივები</span></h2>
              <div className="bg-brand-surface border border-brand-border px-3 py-1 rounded-full text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">ლაივ რეჟიმი</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.length > 0 ? events.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="relative group/admin"
                >
                  <EventCard event={event} />
                  {isAdmin && (
                    <div className="absolute top-4 right-4 z-30 flex gap-2 opacity-0 group-hover/admin:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.preventDefault(); navigate('/admin'); }}
                        className="p-2 bg-brand-surface border border-brand-border rounded-lg text-white hover:bg-brand-primary transition-colors"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={(e) => { e.preventDefault(); handleDelete('events', event.id); }}
                        className="p-2 bg-brand-surface border border-brand-border rounded-lg text-white hover:bg-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </motion.div>
              )) : (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-800 rounded-[2rem]">
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">ლაივები არ არის</p>
                </div>
              )}
            </div>
          </section>

          <aside className="col-span-12 lg:col-span-4 grid grid-rows-2 gap-6">
            {/* Stats Bento Box */}
            <div className="bento-card p-6 flex flex-col justify-between bg-zinc-900/40">
              <div className="flex justify-between items-start">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">ცოცხალი სტატისტიკა</h3>
                <div className="flex gap-1 items-end">
                  <div className="w-1.5 h-6 bg-brand-primary rounded-full" />
                  <div className="w-1.5 h-4 bg-zinc-700 rounded-full" />
                  <div className="w-1.5 h-8 bg-brand-primary/60 rounded-full" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center py-4">
                <div className="flex flex-col">
                  <span className="text-3xl font-black">{liveStats.totalParticipants}</span>
                  <span className="text-[9px] uppercase text-zinc-600 font-bold tracking-widest">მაყურებელი</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black">{onlineCount}</span>
                  <span className="text-[9px] uppercase text-zinc-600 font-bold tracking-widest">ონლაინ</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black">{liveStats.activeRooms}</span>
                  <span className="text-[9px] uppercase text-zinc-600 font-bold tracking-widest">აქტიური</span>
                </div>
              </div>
              <div className="h-1.5 w-full bg-brand-surface-light rounded-full overflow-hidden">
                <div className="h-full bg-brand-primary w-[75%] animate-pulse" />
              </div>
            </div>

            {/* Next Big Event Bento Box */}
            <div className="bg-brand-primary rounded-[2rem] p-8 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Calendar size={200} />
              </div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/50">მალე დაიწყება</h3>
              <div>
                <p className="text-3xl font-black leading-tight text-white mb-4">Wimbledon 2024: მამაკაცთა ფინალი</p>
                <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl text-xs font-bold text-white backdrop-blur-sm border border-white/10">
                  <Calendar size={14} />
                  20:00 • 15 ივლისი
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Trending Highlights */}
        {highlights.length > 0 && (
          <section className="bento-card p-8 bg-brand-surface/40">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">პოპულარული <span className="text-brand-primary">მომენტები</span></h2>
              <TrendingUp size={20} className="text-brand-primary" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {highlights.map((h, i) => (
                <div key={h.id || i} className="space-y-4 group relative">
                  <div className="aspect-[16/10] bg-brand-surface-light rounded-[1.5rem] overflow-hidden relative border border-brand-border group-hover:border-brand-primary/30 transition-colors">
                    <img 
                      src={h.thumbnail}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                      alt={h.title}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center shadow-lg">
                        <Play fill="white" size={20} className="ml-1" />
                      </div>
                    </div>
                  </div>
                  {isAdmin && h.id && (
                    <div className="absolute top-2 right-2 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => navigate('/admin')}
                        className="p-2 bg-brand-surface/80 backdrop-blur-md border border-brand-border rounded-lg text-white hover:bg-brand-primary transition-colors"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button 
                        onClick={() => handleDelete('highlights', h.id)}
                        className="p-2 bg-brand-surface/80 backdrop-blur-md border border-brand-border rounded-lg text-white hover:bg-red-600 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                  <h4 className="font-bold text-zinc-400 group-hover:text-zinc-100 transition-colors">
                    {h.title}
                  </h4>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Schedule */}
        {schedule.length > 0 && (
          <section className="pb-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">ლაივების <span className="text-brand-primary">განრიგი</span></h2>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-primary" />
                <div className="w-2 h-2 rounded-full bg-zinc-800" />
                <div className="w-2 h-2 rounded-full bg-zinc-800" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {schedule.map((item, idx) => (
                <div key={item.id || idx} className="p-6 bento-card bg-zinc-900/20 flex flex-col justify-between h-36 group relative hover:bg-brand-primary/5 transition-all overflow-hidden">
                  {item.thumbnail && (
                    <img 
                      src={item.thumbnail} 
                      className="absolute inset-0 w-full h-full object-cover opacity-10 group-hover:opacity-20 group-hover:scale-105 transition-all duration-700 pointer-events-none" 
                      alt="" 
                    />
                  )}
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    {isAdmin && item.id && (
                      <div className="absolute top-0 right-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => navigate('/admin')}
                          className="p-1.5 bg-brand-surface border border-brand-border rounded-lg text-white hover:bg-brand-primary transition-colors"
                        >
                          <Edit3 size={10} />
                        </button>
                        <button 
                          onClick={() => handleDelete('schedule', item.id)}
                          className="p-1.5 bg-brand-surface border border-brand-border rounded-lg text-white hover:bg-red-600 transition-colors"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    )}
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded uppercase tracking-widest">{item.sport}</span>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                        {new Date(item.time).toLocaleString('ka-GE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-lg font-black tracking-tight leading-none group-hover:text-brand-primary transition-colors">
                      {item.team1} <span className="text-zinc-600 block text-sm font-normal">წინააღმდეგ</span> {item.team2}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
