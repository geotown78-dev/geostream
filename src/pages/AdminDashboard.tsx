import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Play, StopCircle, Settings, TrendingUp, Monitor, Trash2, Plus, Calendar, Image as ImageIcon, LayoutDashboard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MOCK_EVENTS } from '../constants';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [activeTab, setActiveTab] = useState<'sessions' | 'streams' | 'highlights' | 'schedule'>('sessions');

  // CMS States
  const [streams, setStreams] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCMSData();
  }, [activeTab]);

  const fetchCMSData = async () => {
    setLoading(true);
    try {
      const { data: sData } = await supabase.from('site_events').select('*').order('created_at', { ascending: false });
      const { data: hData } = await supabase.from('site_highlights').select('*').order('created_at', { ascending: false });
      const { data: scData } = await supabase.from('site_schedule').select('*').order('created_at', { ascending: false });
      
      if (sData) setStreams(sData);
      if (hData) setHighlights(hData);
      if (scData) setSchedule(scData);
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const startStream = async (id: string) => {
    navigate(`/broadcast/${id}`);
    try {
      await supabase.from('active_streams').upsert({ 
        id: 'global-stream', 
        room_id: id, 
        is_active: true,
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Supabase sync skipped or failed:', e);
    }
  };

  const deleteItem = async (table: string, id: string) => {
    try {
      await supabase.from(table).delete().eq('id', id);
      fetchCMSData();
    } catch (e) {
      alert('წაშლა ვერ მოხერხდა');
    }
  };

  const [newStream, setNewStream] = useState({ title: '', sport: '', thumbnail: '', room_name: '' });
  const [newHighlight, setNewHighlight] = useState({ title: '', thumbnail: '' });
  const [newSchedule, setNewSchedule] = useState({ team1: '', team2: '', time: '', sport: '' });

  const addStream = async () => {
    if (!newStream.title || !newStream.room_name) return;
    await supabase.from('site_events').insert([{ ...newStream, is_live: true, start_time: new Date().toISOString() }]);
    setNewStream({ title: '', sport: '', thumbnail: '', room_name: '' });
    fetchCMSData();
  };

  const addHighlight = async () => {
    if (!newHighlight.title) return;
    await supabase.from('site_highlights').insert([newHighlight]);
    setNewHighlight({ title: '', thumbnail: '' });
    fetchCMSData();
  };

  const addSchedule = async () => {
    if (!newSchedule.team1 || !newSchedule.team2) return;
    await supabase.from('site_schedule').insert([newSchedule]);
    setNewSchedule({ team1: '', team2: '', time: '', sport: '' });
    fetchCMSData();
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-[1200px] mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-brand-secondary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary">სისტემა ონლაინშია</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter italic uppercase">მართვის <span className="text-brand-primary">პანელი</span></h1>
            <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">GeoStream კონტენტის მართვა</p>
          </div>
          
          <div className="flex bg-brand-surface p-1 rounded-2xl border border-brand-border">
            {(['sessions', 'streams', 'highlights', 'schedule'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab ? 'bg-brand-primary text-white shadow-lg' : 'text-zinc-500 hover:text-white'
                }`}
              >
                {tab === 'sessions' ? 'სესიები' : tab === 'streams' ? 'სტრიმები' : tab === 'highlights' ? 'მომენტები' : 'განრიგი'}
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8">
          {activeTab === 'sessions' && (
            <>
              <section className="space-y-6">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-3">
                  <Radio size={14} className="text-brand-primary" /> სესიის ინიციალიზაცია
                </h2>
                <div className="bento-card p-10 bg-brand-primary/5 border-brand-primary/20 space-y-8">
                  <div className="grid md:grid-cols-2 gap-8 items-end">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">სტრიმის ოთახის იდენტიფიკატორი</label>
                      <input 
                        type="text" 
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        placeholder="ჩემპიონთა-ლიგის-ფინალი"
                        className="w-full bg-black border border-brand-border rounded-2xl p-5 focus:border-brand-primary outline-none transition-all font-black text-xl uppercase tracking-tighter placeholder:text-zinc-800 text-white"
                      />
                    </div>
                    <button 
                      onClick={() => roomId && startStream(roomId)}
                      disabled={!roomId}
                      className="w-full py-5 bg-brand-primary text-white font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_-15px_rgba(99,102,241,0.5)] disabled:opacity-50"
                    >
                      <Monitor size={20} /> სესიის დაწყება
                    </button>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">სწრაფი წვდომა სტრიმებზე</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(streams.length > 0 ? streams : MOCK_EVENTS).map((event) => (
                    <div key={event.id} className="p-6 bento-card bg-zinc-900/40 flex items-center justify-between group hover:border-brand-primary/30 transition-colors">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl border border-brand-border overflow-hidden rotate-[-2deg] group-hover:rotate-0 transition-transform duration-500">
                          <img src={event.thumbnail} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div>
                          <h4 className="font-black text-xl tracking-tight leading-tight mb-1">{event.title}</h4>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{event.sport} • {new Date(event.start_time).toLocaleTimeString()}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => startStream(event.room_name)}
                        className="px-6 py-3 bg-brand-surface border border-brand-border hover:bg-brand-primary hover:border-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                      >
                        ჩართვა
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {activeTab === 'streams' && (
            <section className="space-y-6">
              <div className="bento-card p-8 bg-zinc-900/40 space-y-6">
                <h3 className="text-xl font-black uppercase italic italic text-brand-primary flex items-center gap-2">
                  <Plus size={20} /> ახალი პოპულარული სტრიმის დამატება
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <input 
                    placeholder="დასახელება" 
                    value={newStream.title}
                    onChange={(e) => setNewStream({ ...newStream, title: e.target.value })}
                    className="bg-black border border-brand-border p-3 rounded-xl outline-none focus:border-brand-primary" 
                  />
                   <input 
                    placeholder="სპორტი" 
                    value={newStream.sport}
                    onChange={(e) => setNewStream({ ...newStream, sport: e.target.value })}
                    className="bg-black border border-brand-border p-3 rounded-xl outline-none focus:border-brand-primary" 
                  />
                   <input 
                    placeholder="ოთახის ID (slug)" 
                    value={newStream.room_name}
                    onChange={(e) => setNewStream({ ...newStream, room_name: e.target.value })}
                    className="bg-black border border-brand-border p-3 rounded-xl outline-none focus:border-brand-primary" 
                  />
                  <input 
                    placeholder="სურათის URL" 
                    value={newStream.thumbnail}
                    onChange={(e) => setNewStream({ ...newStream, thumbnail: e.target.value })}
                    className="bg-black border border-brand-border p-3 rounded-xl outline-none focus:border-brand-primary" 
                  />
                </div>
                <button onClick={addStream} className="w-full bg-brand-primary py-4 rounded-xl font-black uppercase text-xs tracking-widest">დამატება</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {streams.map((s) => (
                  <div key={s.id} className="p-4 bento-card bg-zinc-900/40 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img src={s.thumbnail} className="w-12 h-12 object-cover rounded-lg" alt="" />
                      <div>
                        <h4 className="font-bold">{s.title}</h4>
                        <p className="text-[10px] text-zinc-500 uppercase">{s.sport}</p>
                      </div>
                    </div>
                    <button onClick={() => deleteItem('site_events', s.id)} className="text-zinc-600 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'highlights' && (
            <section className="space-y-6">
              <div className="bento-card p-8 bg-zinc-900/40 space-y-6">
                <h3 className="text-xl font-black uppercase italic italic text-brand-primary flex items-center gap-2">
                  <TrendingUp size={20} /> მომენტის დამატება
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <input 
                    placeholder="სათაური" 
                    value={newHighlight.title}
                    onChange={(e) => setNewHighlight({ ...newHighlight, title: e.target.value })}
                    className="bg-black border border-brand-border p-3 rounded-xl outline-none focus:border-brand-primary" 
                  />
                  <input 
                    placeholder="სურათის URL" 
                    value={newHighlight.thumbnail}
                    onChange={(e) => setNewHighlight({ ...newHighlight, thumbnail: e.target.value })}
                    className="bg-black border border-brand-border p-3 rounded-xl outline-none focus:border-brand-primary" 
                  />
                </div>
                <button onClick={addHighlight} className="w-full bg-brand-primary py-4 rounded-xl font-black uppercase text-xs tracking-widest">დამატება</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {highlights.map((h) => (
                  <div key={h.id} className="p-4 bento-card bg-zinc-900/40 space-y-4">
                    <img src={h.thumbnail} className="w-full aspect-video object-cover rounded-lg" alt="" />
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-sm truncate pr-4">{h.title}</h4>
                      <button onClick={() => deleteItem('site_highlights', h.id)} className="text-zinc-600 hover:text-red-500 shrink-0">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'schedule' && (
            <section className="space-y-6">
              <div className="bento-card p-8 bg-zinc-900/40 space-y-6">
                <h3 className="text-xl font-black uppercase italic italic text-brand-primary flex items-center gap-2">
                  <Calendar size={20} /> განრიგის დამატება
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <input 
                    placeholder="გუნდი 1" 
                    value={newSchedule.team1}
                    onChange={(e) => setNewSchedule({ ...newSchedule, team1: e.target.value })}
                    className="bg-black border border-brand-border p-3 rounded-xl outline-none focus:border-brand-primary" 
                  />
                  <input 
                    placeholder="გუნდი 2" 
                    value={newSchedule.team2}
                    onChange={(e) => setNewSchedule({ ...newSchedule, team2: e.target.value })}
                    className="bg-black border border-brand-border p-3 rounded-xl outline-none focus:border-brand-primary" 
                  />
                  <input 
                    placeholder="დრო (მაგ: 21:45)" 
                    value={newSchedule.time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                    className="bg-black border border-brand-border p-3 rounded-xl outline-none focus:border-brand-primary" 
                  />
                  <input 
                    placeholder="სპორტი" 
                    value={newSchedule.sport}
                    onChange={(e) => setNewSchedule({ ...newSchedule, sport: e.target.value })}
                    className="bg-black border border-brand-border p-3 rounded-xl outline-none focus:border-brand-primary" 
                  />
                </div>
                <button onClick={addSchedule} className="w-full bg-brand-primary py-4 rounded-xl font-black uppercase text-xs tracking-widest">დამატება</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {schedule.map((sc) => (
                  <div key={sc.id} className="p-4 bento-card bg-zinc-900/40 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold">{sc.team1} VS {sc.team2}</h4>
                      <p className="text-[10px] text-zinc-500 uppercase">{sc.sport} • {sc.time}</p>
                    </div>
                    <button onClick={() => deleteItem('site_schedule', sc.id)} className="text-zinc-600 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

