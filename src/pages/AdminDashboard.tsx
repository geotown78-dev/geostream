import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Play, StopCircle, Settings, TrendingUp } from 'lucide-react';
import { MOCK_EVENTS } from '../constants';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeStream, setActiveStream] = useState<string | null>(null);

  const startStream = (roomId: string) => {
    setActiveStream(roomId);
    navigate(`/watch/${roomId}`);
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-[1200px] mx-auto">
        <header className="flex justify-between items-end mb-12">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-brand-secondary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary">System Online</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter italic uppercase">BROADCAST <span className="text-brand-primary">CENTER</span></h1>
            <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">Network Administrator Environment</p>
          </div>
          <button className="w-12 h-12 bg-brand-surface border border-brand-border rounded-xl flex items-center justify-center hover:bg-brand-surface-light transition-colors">
            <Settings size={20} className="text-zinc-400" />
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <section className="col-span-12 md:col-span-12 lg:col-span-5 space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-3">
              <Radio size={14} className="text-brand-primary" /> Session Initialization
            </h2>
            <div className="bento-card p-10 bg-zinc-900/40 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Stream Room Identifier</label>
                <input 
                  type="text" 
                  placeholder="CHAMPIONS-LEAGUE-FINAL"
                  className="w-full bg-black border border-brand-border rounded-2xl p-5 focus:border-brand-primary outline-none transition-all font-black text-xl uppercase tracking-tighter placeholder:text-zinc-800"
                />
              </div>
              <button className="w-full py-5 bg-brand-primary text-white font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_-15px_rgba(99,102,241,0.5)]">
                <Play fill="white" size={18} /> INITIALIZE BROADCAST
              </button>
            </div>
            
            <div className="bento-card p-6 bg-brand-secondary/5 border-brand-secondary/20 flex flex-col justify-between h-40">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary">Bitrate Stats</span>
                <TrendingUp size={16} className="text-brand-secondary" />
              </div>
              <div>
                <p className="text-3xl font-black tracking-tighter">18.4 <span className="text-zinc-500 text-sm font-bold uppercase">Mbps</span></p>
                <div className="h-1 w-full bg-brand-secondary/20 rounded-full mt-2">
                  <div className="h-full bg-brand-secondary w-[85%]" />
                </div>
              </div>
            </div>
          </section>

          <section className="col-span-12 md:col-span-12 lg:col-span-7 space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Relational Queue (Mock Data)</h2>
            <div className="space-y-4">
              {MOCK_EVENTS.map((event) => (
                <div key={event.id} className="p-6 bento-card bg-zinc-900/40 flex items-center justify-between group hover:border-brand-primary/30 transition-colors">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl border border-brand-border overflow-hidden rotate-[-2deg] group-hover:rotate-0 transition-transform duration-500">
                      <img src={event.thumbnail} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div>
                      <h4 className="font-black text-xl tracking-tight leading-tight mb-1">{event.title}</h4>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{event.sport} • {new Date(event.start_time).toLocaleTimeString()} • PROD-CLUSTER-A</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => startStream(event.room_name)}
                    className="px-6 py-3 bg-brand-surface border border-brand-border hover:bg-brand-primary hover:border-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                  >
                    DEPLOY
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
