import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Hero, LiveCard, UpcomingCard } from '../components/UI';
import { Calendar, Trophy, ChevronRight, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TeamLogo } from '../components/TeamLogo';

export default function Home() {
  const [activeBroadcast, setActiveBroadcast] = useState<any>(null);
  const [exclusiveEvent, setExclusiveEvent] = useState<any>(null);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (path === '/football') {
      setActiveTab('Football');
    } else if (path === '/ufc' || path === '/fighters') {
      setActiveTab('UFC');
    } else if (path === '/sports') {
      setActiveTab('All');
    }
  }, [location.pathname]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Execute queries concurrently using Promise.all to avoid sequence waterfalls
        const [exLiveResponse, liveResponse, upcomingResponse, streamResponse] = await Promise.all([
          supabase.from('events').select('*').eq('is_exclusive', true).eq('is_live', true).order('id', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('events').select('*').eq('is_live', true).order('id', { ascending: false }),
          supabase.from('schedule').select('*').order('time', { ascending: true }).limit(4),
          supabase.from('active_streams').select('*').eq('id', 'global-stream').maybeSingle()
        ]);

        const exLive = exLiveResponse.data;
        if (exLive) {
          setExclusiveEvent(exLive);
        } else {
          const { data: exSched } = await supabase.from('schedule').select('*').eq('is_exclusive', true).order('time', { ascending: true }).limit(1).maybeSingle();
          if (exSched) setExclusiveEvent(exSched);
          else setExclusiveEvent(null);
        }

        setLiveEvents(liveResponse.data || []);
        setUpcomingEvents(upcomingResponse.data || []);

        const streamData = streamResponse.data;
        if (streamData?.is_active) setActiveBroadcast(streamData);
        else setActiveBroadcast(null);

      } catch (e) {
        console.warn('Data fetch error:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Set up real-time listener for live events, schedule, and global status
    const channel = supabase
      .channel('home-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'active_streams' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const categories = ['All', 'Football', 'UFC', 'Boxing', 'NBA'];

  const handleDelete = async (table: string, id: string) => {
    if (!window.confirm('ნამდვილად გსურთ წაშლა?')) return;
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) {
        alert('წაშლა ვერ მოხერხდა: ' + error.message);
      } else {
        // Local refresh
        if (table === 'events') {
          const targetEvent = liveEvents.find(e => e.id === id);
          if (targetEvent?.room_name) {
            try {
              await fetch(`/api/chat/${targetEvent.room_name}`, { method: 'DELETE' });
            } catch (chatErr) {
              console.error('Failed to delete chat history on stream delete:', chatErr);
            }
          }
          setLiveEvents(prev => prev.filter(e => e.id !== id));
        }
        if (table === 'schedule') setUpcomingEvents(prev => prev.filter(e => e.id !== id));
      }
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  const filteredLive = activeTab === 'All' 
    ? liveEvents 
    : liveEvents.filter(e => e.sport?.toLowerCase() === activeTab.toLowerCase());

  const filteredUpcoming = activeTab === 'All' 
    ? upcomingEvents 
    : upcomingEvents.filter(e => e.sport?.toLowerCase() === activeTab.toLowerCase());

  return (
    <div className="min-h-screen">
      <Hero activeBroadcast={activeBroadcast} exclusiveEvent={exclusiveEvent} />
      
      <div className="space-y-16">
        {/* LIVE NOW SECTION */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
              <h2 className="text-xl font-black uppercase tracking-tighter italic">LIVE <span className="text-brand-primary">NOW</span></h2>
            </div>
            <button className="text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">View All</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-video bg-brand-surface border border-brand-border rounded-xl animate-pulse flex items-center justify-center opacity-20">
                  <div className="text-[10px] font-black tracking-widest uppercase">იტვირთება...</div>
                </div>
              ))
            ) : filteredLive.length > 0 ? (
              filteredLive.map((event, i) => (
                <motion.div
                  key={event.id || i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                >
                  <LiveCard event={event} onDelete={(id) => handleDelete('events', id)} />
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center border border-dashed border-zinc-800 rounded-xl opacity-30">
                <p className="text-[10px] font-black uppercase tracking-widest">აქტიური ლაივები არ არის</p>
              </div>
            )}
          </div>
        </section>

        {/* UPCOMING EVENTS SECTION */}
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h2 className="text-xl font-black uppercase tracking-tighter italic">UPCOMING <span className="text-brand-primary">EVENTS</span></h2>
            
            <div className="flex items-center p-1 bg-brand-surface border border-brand-border rounded-xl overflow-x-auto no-scrollbar shrink-0 max-w-full">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${
                    activeTab === cat ? 'bg-brand-primary text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 bg-brand-surface border border-brand-border rounded-xl animate-pulse overflow-hidden">
                  <div className="p-5 opacity-10">
                    <div className="w-8 h-8 bg-white/20 rounded mb-4" />
                    <div className="h-4 bg-white/20 rounded w-2/3 mb-2" />
                    <div className="h-2 bg-white/20 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : filteredUpcoming.length > 0 ? (
              filteredUpcoming.map((event, i) => (
                <motion.div
                  key={event.id || i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <UpcomingCard event={event} onDelete={(id) => handleDelete('schedule', id)} />
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center border border-dashed border-zinc-800 rounded-xl opacity-30">
                <p className="text-[10px] font-black uppercase tracking-widest">დაგეგმილი ღონისძიებები არ არის</p>
              </div>
            )}
          </div>
        </section>

        {/* Info Banner Section */}
        <div className="flex justify-center pb-12 sm:pb-0">
          <div className="w-full max-w-md bg-brand-surface border border-brand-border rounded-xl p-6 flex flex-col justify-start">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Trophy size={14} className="text-brand-primary" /> LA LIGA TOP 5
              </h4>
              <Link to="/stats" className="text-[9px] font-black uppercase text-zinc-500 hover:text-brand-primary transition-colors">სრული</Link>
            </div>
            
            <div className="space-y-3">
              {(function() {
                const saved = localStorage.getItem('laliga_leaderboard');
                const data = saved ? JSON.parse(saved).slice(0, 5) : [
                  { name: 'Barcelona', points: 91, logo: 'https://cdn.worldvectorlogo.com/logos/fc-barcelona.svg' },
                  { name: 'Real Madrid', points: 80, logo: 'https://cdn.worldvectorlogo.com/logos/real-madrid-cf.svg' },
                  { name: 'Villarreal', points: 69, logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/70/Villarreal_CF_logo.svg/100px-Villarreal_CF_logo.svg.png' },
                  { name: 'Atlético Madrid', points: 66, logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f4/Atletico_madrid_2017_logo.svg/100px-Atletico_madrid_2017_logo.svg.png' },
                  { name: 'Real Betis', points: 57, logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/11/Real_Betis_logo.svg/100px-Real_Betis_logo.svg.png' }
                ];
                
                return data.map((team: any, i: number) => (
                  <div key={team.name} className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-white/5 hover:border-brand-primary/30 transition-all group">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black italic text-zinc-600 w-4">{i + 1}</span>
                      <div className="w-5 h-5 flex items-center justify-center overflow-hidden shrink-0">
                        <TeamLogo name={team.name} logoUrl={team.logo} className="w-full h-full" />
                      </div>
                      <span className="text-[10px] font-black uppercase italic group-hover:text-brand-primary transition-colors truncate max-w-[80px]">{team.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-brand-primary">{team.points || team.pts}</span>
                  </div>
                ));
              })()}
            </div>

            <div className="mt-6 pt-4 border-t border-brand-border text-center">
              <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-[0.2em]">სპექტაკლი მუდამ გრძელდება</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
