import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Hero, EventCard } from '../components/UI';
import { MOCK_EVENTS, SCHEDULE } from '../constants';
import { Calendar, TrendingUp, Play } from 'lucide-react';
import { supabase, Event } from '../lib/supabase';

export default function Home() {
  const [events, setEvents] = useState<Event[]>(MOCK_EVENTS);
  const [activeBroadcast, setActiveBroadcast] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch for active stream
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

    async function fetchEvents() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('start_time', { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) {
          setEvents(data);
        }
      } catch (err) {
        console.warn('Could not fetch from Supabase, using mock data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen pb-20">
      <Hero activeBroadcast={activeBroadcast} />
      
      <main className="max-w-[1600px] mx-auto px-6 mt-16 space-y-12">
        {/* Bento Grid Header */}
        <div className="grid grid-cols-12 gap-6">
          <section className="col-span-12 lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">TOP <span className="text-brand-primary">LIVE EVENTS</span></h2>
              <div className="bg-brand-surface border border-brand-border px-3 py-1 rounded-full text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Real-time Feed</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                >
                  <EventCard event={event} />
                </motion.div>
              ))}
            </div>
          </section>

          <aside className="col-span-12 lg:col-span-4 grid grid-rows-2 gap-6">
            {/* Stats Bento Box */}
            <div className="bento-card p-6 flex flex-col justify-between bg-zinc-900/40">
              <div className="flex justify-between items-start">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Live Statistics (Supabase)</h3>
                <div className="flex gap-1 items-end">
                  <div className="w-1.5 h-6 bg-brand-primary rounded-full" />
                  <div className="w-1.5 h-4 bg-zinc-700 rounded-full" />
                  <div className="w-1.5 h-8 bg-brand-primary/60 rounded-full" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center py-4">
                <div className="flex flex-col">
                  <span className="text-3xl font-black">2.4M</span>
                  <span className="text-[9px] uppercase text-zinc-600 font-bold tracking-widest">Views</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black">64ms</span>
                  <span className="text-[9px] uppercase text-zinc-600 font-bold tracking-widest">Latency</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black">4K</span>
                  <span className="text-[9px] uppercase text-zinc-600 font-bold tracking-widest">Resolution</span>
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
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/50">Coming Up Next</h3>
              <div>
                <p className="text-3xl font-black leading-tight text-white mb-4">Wimbledon 2024: Men's Final</p>
                <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl text-xs font-bold text-white backdrop-blur-sm border border-white/10">
                  <Calendar size={14} />
                  20:00 • JULY 15
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Trending Highlights */}
        <section className="bento-card p-8 bg-brand-surface/40">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black italic tracking-tighter uppercase">TRENDING <span className="text-brand-primary">HIGHLIGHTS</span></h2>
            <TrendingUp size={20} className="text-brand-primary" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4 group">
                <div className="aspect-[16/10] bg-brand-surface-light rounded-[1.5rem] overflow-hidden relative border border-brand-border group-hover:border-brand-primary/30 transition-colors">
                  <img 
                    src={`https://images.unsplash.com/photo-${1500000000000 + (i * 100)}?auto=format&fit=crop&q=80&w=800`}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                    alt="Highlight"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center shadow-lg">
                      <Play fill="white" size={20} className="ml-1" />
                    </div>
                  </div>
                </div>
                <h4 className="font-bold text-zinc-400 group-hover:text-zinc-100 transition-colors">Momentum: Highlights from Apex Series #{i}</h4>
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming Schedule */}
        <section className="pb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black italic tracking-tighter uppercase">BROADCAST <span className="text-brand-primary">SCHEDULE</span></h2>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-primary" />
              <div className="w-2 h-2 rounded-full bg-zinc-800" />
              <div className="w-2 h-2 rounded-full bg-zinc-800" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SCHEDULE.map((item, idx) => (
              <div key={idx} className="p-6 bento-card bg-zinc-900/20 flex flex-col justify-between h-36 group hover:bg-brand-primary/5 transition-colors">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded uppercase tracking-widest">{item.sport}</span>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{item.time} TODAY</span>
                </div>
                <div className="text-lg font-black tracking-tight leading-none group-hover:text-brand-primary transition-colors">
                  {item.team1} <span className="text-zinc-600 block text-sm font-normal">VS</span> {item.team2}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
