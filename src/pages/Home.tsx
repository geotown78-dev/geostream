import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Hero, LiveCard, UpcomingCard } from '../components/UI';
import { Calendar, Trophy, ChevronRight, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const [activeBroadcast, setActiveBroadcast] = useState<any>(null);
  const [exclusiveEvent, setExclusiveEvent] = useState<any>(null);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch Exclusive Event (priority: live event first, then schedule)
        const { data: exLive } = await supabase.from('events').select('*').eq('is_exclusive', true).order('created_at', { ascending: false }).limit(1).single();
        if (exLive) {
          setExclusiveEvent(exLive);
        } else {
          const { data: exSched } = await supabase.from('schedule').select('*').eq('is_exclusive', true).order('time', { ascending: true }).limit(1).single();
          if (exSched) setExclusiveEvent(exSched);
        }

        // Fetch Live Streams from 'events' table
        const { data: liveData } = await supabase
          .from('events')
          .select('*')
          .eq('is_live', true)
          .order('created_at', { ascending: false });
        
        setLiveEvents(liveData || []);

        // Fetch Upcoming from 'schedule' table
        const { data: upcomingData } = await supabase
          .from('schedule')
          .select('*')
          .order('time', { ascending: true })
          .limit(4);
        
        setUpcomingEvents(upcomingData || []);

        // Global broadcast status (for Hero section)
        const { data: streamData } = await supabase
          .from('active_streams')
          .select('*')
          .eq('id', 'global-stream')
          .single();
        
        if (streamData?.is_active) setActiveBroadcast(streamData);

      } catch (e) {
        console.warn('Data fetch error:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Set up real-time listener for live events
    const channel = supabase
      .channel('home-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'active_streams' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const categories = ['All', 'Football', 'UFC', 'Boxing', 'NBA'];

  if (loading) return null;

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
            {liveEvents.length > 0 ? (
              liveEvents.map((event, i) => (
                <motion.div
                  key={event.id || i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                >
                  <LiveCard event={event} />
                </motion.div>
              ))
            ) : (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-video bg-brand-surface border border-brand-border rounded-xl animate-pulse flex items-center justify-center opacity-20">
                  <div className="text-[10px] font-black tracking-widest uppercase">No Live Streams</div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* UPCOMING EVENTS SECTION */}
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h2 className="text-xl font-black uppercase tracking-tighter italic">UPCOMING <span className="text-brand-primary">EVENTS</span></h2>
            
            <div className="flex items-center p-1 bg-brand-surface border border-brand-border rounded-xl overflow-hidden shrink-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                    activeTab === cat ? 'bg-brand-primary text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event, i) => (
                <motion.div
                  key={event.id || i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <UpcomingCard event={event} />
                </motion.div>
              ))
            ) : (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 bg-brand-surface border border-brand-border rounded-xl animate-pulse overflow-hidden">
                  <div className="p-5 opacity-10">
                    <div className="w-8 h-8 bg-white/20 rounded mb-4" />
                    <div className="h-4 bg-white/20 rounded w-2/3 mb-2" />
                    <div className="h-2 bg-white/20 rounded w-1/2" />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Info Banner Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 glass-card p-10 relative overflow-hidden group">
            <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <TrendingUp size={300} />
            </div>
            <div className="relative z-10 max-w-lg">
              <h3 className="text-3xl font-black italic uppercase italic mb-4">გახდი <span className="text-brand-primary">გეოსტრიმერი</span></h3>
              <p className="text-zinc-400 font-bold leading-relaxed mb-8">
                შემოუერთდი პირველ ქართულ სტრიმინგ პლატფორმას. გაუზიარე შენი თამაში ათასობით მაყურებელს და გახდი სპორტული სამყაროს ნაწილი.
              </p>
              <button className="px-8 py-4 bg-brand-primary text-white text-xs font-black uppercase tracking-widest rounded-lg hover:shadow-[0_0_30px_-5px_rgba(255,0,51,0.5)] transition-all">დაიწყე ახლა</button>
            </div>
          </div>
          
          <div className="lg:col-span-4 bg-brand-surface border border-brand-border rounded-xl p-8 flex flex-col justify-center text-center">
            <Trophy size={48} className="text-brand-primary mx-auto mb-6" />
            <h4 className="text-base font-black uppercase mb-2">GeoStream Network</h4>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">სპექტაკლი მუდამ გრძელდება</p>
          </div>
        </div>
      </div>
    </div>
  );
}
