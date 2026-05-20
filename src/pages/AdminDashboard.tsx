import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Play, StopCircle, Settings, TrendingUp, Monitor, Trash2, Plus, Calendar, Image as ImageIcon, LayoutDashboard, Upload, Loader2, Copy, Check, ExternalLink, Globe, Edit, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import HLSPlayer from '../components/HLSPlayer';
import { Volume2, VolumeX, Pause, Play as PlayIcon } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [sessionSport, setSessionSport] = useState('Football');
  const [sessionIsExclusive, setSessionIsExclusive] = useState(false);
  const [sessionThumbnail, setSessionThumbnail] = useState('');
  const [vdsIp, setVdsIp] = useState(localStorage.getItem('vds_ip') || '5.83.153.142');
  const [srsPort, setSrsPort] = useState('1935');
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [streamUrl, setStreamUrl] = useState(localStorage.getItem('current_stream_url') || '');
  const [isMonitorMuted, setIsMonitorMuted] = useState(true);
  const [isMonitorPaused, setIsMonitorPaused] = useState(false);
  const [streamKey, setStreamKey] = useState(localStorage.getItem('current_stream_key') || `stream_${Math.random().toString(36).substring(7)}`);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [uploading, setUploading] = useState(false);

  // States for event manager and editing
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSport, setEditSport] = useState('Football');
  const [editIsLive, setEditIsLive] = useState(false);
  const [editIsExclusive, setEditIsExclusive] = useState(false);
  const [editThumbnail, setEditThumbnail] = useState('');
  const [editStreamUrl, setEditStreamUrl] = useState('');
  const [editStreamKey, setEditStreamKey] = useState('');
  const [editRoomName, setEditRoomName] = useState('');
  const [uploadingEdit, setUploadingEdit] = useState(false);

  // States for scheduled events management
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);
  const [editSchedTeam1, setEditSchedTeam1] = useState('');
  const [editSchedTeam2, setEditSchedTeam2] = useState('');
  const [editSchedSport, setEditSchedSport] = useState('Football');
  const [editSchedTime, setEditSchedTime] = useState('');
  const [editSchedThumbnail, setEditSchedThumbnail] = useState('');
  const [editSchedIsExclusive, setEditSchedIsExclusive] = useState(false);
  const [uploadingSchedEdit, setUploadingSchedEdit] = useState(false);

  // Creation form states for schedule
  const [schedTeam1, setSchedTeam1] = useState('');
  const [schedTeam2, setSchedTeam2] = useState('');
  const [schedSport, setSchedSport] = useState('Football');
  const [schedTime, setSchedTime] = useState('');
  const [schedThumbnail, setSchedThumbnail] = useState('');
  const [schedIsExclusive, setSchedIsExclusive] = useState(true);
  const [uploadingSched, setUploadingSched] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('id', { ascending: false });
      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      setLoadingSchedules(true);
      const { data, error } = await supabase
        .from('schedule')
        .select('*')
        .order('time', { ascending: true });
      if (error) throw error;
      setSchedules(data || []);
    } catch (err) {
      console.error('Error fetching schedules:', err);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const startEditing = (event: any) => {
    setEditingEvent(event);
    setEditTitle(event.title || '');
    setEditSport(event.sport || 'Football');
    setEditIsLive(event.is_live ?? false);
    setEditIsExclusive(event.is_exclusive ?? false);
    setEditThumbnail(event.thumbnail || '');
    setEditStreamUrl(event.stream_url || '');
    setEditStreamKey(event.stream_key || '');
    setEditRoomName(event.room_name || '');
  };

  const startEditingSchedule = (sched: any) => {
    setEditingSchedule(sched);
    setEditSchedTeam1(sched.team1 || '');
    setEditSchedTeam2(sched.team2 || '');
    setEditSchedSport(sched.sport || 'Football');
    if (sched.time) {
      const d = new Date(sched.time);
      setIsMonitorPaused(false);
      try {
        const iso = d.toISOString();
        setEditSchedTime(iso.substring(0, 16));
      } catch (e) {
        setEditSchedTime('');
      }
    } else {
      setEditSchedTime('');
    }
    setEditSchedThumbnail(sched.thumbnail || '');
    setEditSchedIsExclusive(sched.is_exclusive ?? false);
  };

  const saveEvent = async () => {
    if (!editingEvent) return;
    try {
      const { error } = await supabase
        .from('events')
        .update({
          title: editTitle,
          sport: editSport,
          is_live: editIsLive,
          is_exclusive: editIsExclusive,
          thumbnail: editThumbnail,
          stream_url: editStreamUrl,
          stream_key: editStreamKey,
          room_name: editRoomName,
        })
        .eq('id', editingEvent.id);

      if (error) throw error;
      setEditingEvent(null);
      fetchEvents();
    } catch (err: any) {
      alert('განახლება ვერ მოხერხდა: ' + err.message);
    }
  };

  const saveSchedule = async () => {
    if (!editingSchedule) return;
    try {
      const { error } = await supabase
        .from('schedule')
        .update({
          team1: editSchedTeam1,
          team2: editSchedTeam2,
          sport: editSchedSport,
          time: editSchedTime ? new Date(editSchedTime).toISOString() : null,
          thumbnail: editSchedThumbnail,
          is_exclusive: editSchedIsExclusive,
        })
        .eq('id', editingSchedule.id);

      if (error) throw error;
      setEditingSchedule(null);
      fetchSchedules();
    } catch (err: any) {
      alert('განახლება ვერ მოხერხდა: ' + err.message);
    }
  };

  const uploadThumbnailFile = async (file: File): Promise<string> => {
    if (file.size > 4 * 1024 * 1024) {
      throw new Error('ფაილის ზომა აღემატება 4 MB-ს. გთხოვთ აირჩიოთ უფრო მცირე ზომის ფოტო.');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `thumbnails/${fileName}`;

    // Auto-create bucket if missing
    try {
      await supabase.storage.createBucket('SITE-ASSETS', { public: true });
    } catch (e) {}
    try {
      await supabase.storage.createBucket('site-assets', { public: true });
    } catch (e) {}

    const buckets = ['SITE-ASSETS', 'site-assets'];
    let lastError: any = null;

    for (const b of buckets) {
      try {
        const { error } = await supabase.storage
          .from(b)
          .upload(filePath, file, { cacheControl: '3600', upsert: false });
        if (!error) {
          const { data } = supabase.storage.from(b).getPublicUrl(filePath);
          if (data?.publicUrl) return data.publicUrl;
        } else {
          lastError = error;
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    const errMsg = lastError?.message || lastError?.error_description || JSON.stringify(lastError) || 'უცნობი შეცდომა';
    throw new Error(errMsg);
  };

  const handleEditFileUpload = async (file: File) => {
    try {
      setUploadingEdit(true);
      const url = await uploadThumbnailFile(file);
      setEditThumbnail(url);
    } catch (error: any) {
      alert(error.message || 'ატვირთვა ვერ მოხერხდა');
    } finally {
      setUploadingEdit(false);
    }
  };

  const handleSchedFileUpload = async (file: File) => {
    try {
      setUploadingSched(true);
      const url = await uploadThumbnailFile(file);
      setSchedThumbnail(url);
    } catch (error: any) {
      alert(error.message || 'ატვირთვა ვერ მოხერხდა');
    } finally {
      setUploadingSched(false);
    }
  };

  const handleEditSchedFileUpload = async (file: File) => {
    try {
      setUploadingSchedEdit(true);
      const url = await uploadThumbnailFile(file);
      setEditSchedThumbnail(url);
    } catch (error: any) {
      alert(error.message || 'ატვირთვა ვერ მოხერხდა');
    } finally {
      setUploadingSchedEdit(false);
    }
  };

  const deleteEvent = async (id: any) => {
    if (!window.confirm('ნამდვილად გსურთ ამ სტრიმის წაშლა?')) return;
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchEvents();
    } catch (err: any) {
      alert('წაშლა ვერ მოხერხდა: ' + err.message);
    }
  };

  const deleteSchedule = async (id: any) => {
    if (!window.confirm('ნამდვილად გსურთ ამ დაგეგმილი ღონისძიების წაშლა?')) return;
    try {
      const { error } = await supabase
        .from('schedule')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchSchedules();
    } catch (err: any) {
      alert('წაშლა ვერ მოხერხდა: ' + err.message);
    }
  };

  const createSchedule = async () => {
    if (!schedTeam1) {
      alert('გთხოვთ შეიყვანოთ დასახელება / პირველი გუნდი');
      return;
    }
    try {
      const { error } = await supabase
        .from('schedule')
        .insert([{
          team1: schedTeam1,
          team2: schedTeam2,
          sport: schedSport,
          time: schedTime ? new Date(schedTime).toISOString() : new Date().toISOString(),
          thumbnail: schedThumbnail || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000',
          is_exclusive: schedIsExclusive,
        }]);

      if (error) throw error;
      setSchedTeam1('');
      setSchedTeam2('');
      setSchedTime('');
      setSchedThumbnail('');
      fetchSchedules();
    } catch (err: any) {
      alert('შექმნა ვერ მოხერხდა: ' + err.message);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchSchedules();
  }, []);

  useEffect(() => {
    const savedBroadcasting = localStorage.getItem('is_broadcasting') === 'true';
    if (savedBroadcasting) {
      setShowSessionDetails(true);
      const t1 = localStorage.getItem('current_team1') || '';
      const t2 = localStorage.getItem('current_team2') || '';
      const sport = localStorage.getItem('current_sport') || 'Football';
      setTeam1(t1);
      setTeam2(t2);
      setSessionSport(sport);
    }
  }, []);

  const copyToClipboard = async (text: string, type: 'url' | 'key') => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      
      if (type === 'url') {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      } else {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      }
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const startSession = async () => {
    if (!team1) {
      alert('გთხოვთ შეიყვანოთ დასახელება');
      return;
    }
    
    localStorage.setItem('vds_ip', vdsIp);
    const slug = `${team1.toLowerCase().trim().replace(/\s+/g, '-')}${team2 ? `-vs-${team2.toLowerCase().trim().replace(/\s+/g, '-')}` : ''}`;
    const key = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    
    const isHttps = window.location.protocol === 'https:';
    const protocol = isHttps ? 'https' : 'http';
    const hostname = vdsIp || window.location.hostname;
    const url = `${protocol}://${hostname}/hls/${key}.m3u8`;
    
    setStreamKey(key);
    setStreamUrl(url);

    localStorage.setItem('is_broadcasting', 'true');
    localStorage.setItem('current_stream_key', key);
    localStorage.setItem('current_stream_url', url);
    localStorage.setItem('current_team1', team1);
    localStorage.setItem('current_team2', team2);
    localStorage.setItem('current_sport', sessionSport);

    try {
      await supabase.from('events').insert([{
        title: team2 ? `${team1} VS ${team2}` : team1,
        sport: sessionSport,
        is_live: true,
        is_exclusive: sessionIsExclusive,
        thumbnail: sessionThumbnail || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000',
        stream_url: url,
        stream_key: key,
        room_name: key,
        start_time: new Date().toISOString()
      }]);
      setShowSessionDetails(true);
      fetchEvents();
    } catch (err: any) {
      console.error('Error starting session:', err);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      const url = await uploadThumbnailFile(file);
      setSessionThumbnail(url);
    } catch (error: any) {
      alert(error.message || 'ატვირთვა ვერ მოხერხდა');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-black">
      <div className="max-w-[1200px] mx-auto">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">
              NGINX <span className="text-brand-primary">LIVE</span>
            </h1>
            <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em]">Bento Streaming Dashboard</p>
          </div>
          <div className="flex gap-4">
             <div className="text-right">
                <p className="text-[10px] font-black text-zinc-500 uppercase">SERVER STATUS</p>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[11px] font-bold text-white">SRS ONLINE</span>
                </div>
             </div>
          </div>
        </header>

        {!showSessionDetails ? (
          <>
            <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bento-card p-10 bg-zinc-900/30 border-white/5 space-y-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg"><Monitor size={20} className="text-blue-500" /></div>
                  <h2 className="text-xl font-black uppercase text-white tracking-tight">ახალი სესია</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">მთავარი გუნდი / სათაური</label>
                      <input 
                        type="text" placeholder="მაგ: Real Madrid" value={team1} onChange={(e) => setTeam1(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl p-4 focus:border-blue-500 outline-none transition-all font-bold text-white uppercase"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">მოწინააღმდეგე (სურვილისამებრ)</label>
                      <input 
                        type="text" placeholder="მაგ: Barcelona" value={team2} onChange={(e) => team2 === '' ? setTeam2(e.target.value) : setTeam2(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl p-4 focus:border-blue-500 outline-none transition-all font-bold text-white uppercase"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">კატეგორია</label>
                      <select 
                        value={sessionSport} onChange={(e) => setSessionSport(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl p-4 focus:border-blue-500 outline-none transition-all font-black text-xs uppercase tracking-widest text-white cursor-pointer"
                      >
                        <option value="Football">ფეხბურთი</option>
                        <option value="UFC">UFC</option>
                        <option value="Boxing">კრივი</option>
                        <option value="NBA">NBA</option>
                        <option value="Live">ლაივი (სხვა)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">თამბნეილი (მაქს. 4 MB)</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" value={sessionThumbnail} onChange={(e) => setSessionThumbnail(e.target.value)}
                          className="flex-1 bg-black border border-white/10 rounded-xl p-4 focus:border-blue-500 outline-none transition-all font-bold text-[10px] text-zinc-400"
                        />
                        <label className="cursor-pointer bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 flex items-center justify-center hover:bg-blue-500/20 transition-all group">
                          {uploading ? <Loader2 className="animate-spin text-blue-500" size={18} /> : <Upload size={18} className="text-blue-500" />}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-4 p-5 bg-black border border-white/10 rounded-2xl cursor-pointer hover:border-blue-500/30 transition-all group shadow-inner">
                    <input type="checkbox" className="w-6 h-6 rounded accent-blue-600" checked={sessionIsExclusive} onChange={(e) => setSessionIsExclusive(e.target.checked)} />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black uppercase text-white tracking-widest">ექსკლუზივი</span>
                      <span className="text-[9px] font-bold text-zinc-600 uppercase italic">გამოჩნდება მთავარ სლაიდერში</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bento-card p-8 bg-blue-600 shadow-xl border-none flex flex-col justify-between min-h-[300px]">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Settings size={16} className="text-white/60" />
                    <label className="text-[10px] font-black text-white/60 uppercase tracking-widest">Server Config</label>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-white/50 uppercase">VDS IP / DOMAIN NAME</span>
                    <input 
                      type="text" value={vdsIp} onChange={(e) => setVdsIp(e.target.value)} 
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-[11px] font-mono text-white outline-none focus:bg-white/20 transition-all"
                    />
                  </div>
                </div>
                
                <button 
                  onClick={startSession}
                  className="w-full py-6 bg-white text-blue-600 font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  <Play size={20} fill="currentColor" /> 
                  <span className="text-xs uppercase tracking-widest">სტრიმის დაწყება</span>
                </button>
              </div>
            </div>
          </div>

          {/* Existing Streams / Events Manager Section */}
          <div className="mt-16 space-y-8">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div>
                <h2 className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-3">
                  <span className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
                    <Radio size={20} className="animate-pulse" />
                  </span>
                  სტრიმების მართვა
                </h2>
                <p className="text-zinc-500 font-bold uppercase text-[9px] tracking-[0.2em] mt-1">
                  აქტიური და დასრულებული პირდაპირი ეთერების რედაქტირება და წაშლა
                </p>
              </div>
              <button 
                onClick={fetchEvents}
                className="text-[9px] font-black uppercase tracking-wider text-zinc-400 hover:text-white px-4 py-2 bg-zinc-900 border border-white/10 rounded-xl transition-all hover:border-white/20"
              >
                განახლება
              </button>
            </div>

            {loadingEvents ? (
              <div className="flex flex-col items-center justify-center py-20 bg-zinc-950/40 rounded-3xl border border-white/5 space-y-4">
                <Loader2 className="animate-spin text-brand-primary" size={40} />
                <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">სტრიმები იტვირთება...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-20 bg-zinc-950/40 rounded-3xl border border-white/5 space-y-2">
                <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">სტრიმები ვერ მოიძებნა</p>
                <p className="text-zinc-600 text-[10px] font-bold uppercase">დაიწყეთ ახალი სესია ზემოთ მოცემული ფორმით</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <div key={event.id} className="bento-card bg-zinc-900/40 border border-white/5 overflow-hidden flex flex-col justify-between group hover:border-blue-500/20 transition-all duration-300">
                    <div>
                      {/* Image / Stats Overlay */}
                      <div className="relative aspect-video bg-zinc-950 overflow-hidden">
                        <img 
                          src={event.thumbnail || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000'} 
                          alt={event.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
                        
                        {/* Status Badges */}
                        <div className="absolute top-3 left-3 flex gap-2">
                          {event.is_live ? (
                            <span className="bg-red-600 text-white text-[8px] font-black uppercase px-2 py-1 rounded flex items-center gap-1.5 shadow-lg">
                              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                              ლაივი
                            </span>
                          ) : (
                            <span className="bg-zinc-800 text-zinc-400 text-[8px] font-black uppercase px-2 py-1 rounded">
                              გათიშული
                            </span>
                          )}

                          {event.is_exclusive && (
                            <span className="bg-brand-primary/20 border border-brand-primary/30 text-brand-primary text-[8px] font-black uppercase px-2 py-1 rounded shadow-lg">
                              ექსკლუზივი
                            </span>
                          )}
                        </div>

                        <div className="absolute bottom-3 left-3 text-[9px] font-mono text-zinc-400">
                          {event.sport?.toUpperCase()}
                        </div>
                      </div>

                      {/* Info Area */}
                      <div className="p-5 space-y-3">
                        <h3 className="text-sm font-black uppercase text-white tracking-tight leading-snug line-clamp-2">
                          {event.title}
                        </h3>
                        <div className="space-y-1.5 text-[10px] text-zinc-500 font-bold uppercase">
                          <p className="truncate"><span className="text-zinc-600">URL:</span> <code className="text-blue-400/80 font-mono text-[9px]">{event.stream_url || 'არ არის'}</code></p>
                          <p className="truncate"><span className="text-zinc-600">ოთახი / KEY:</span> <code className="text-zinc-400 font-mono text-[9px]">{event.room_name || event.stream_key || 'არ არის'}</code></p>
                        </div>
                      </div>
                    </div>

                    {/* Actions bar */}
                    <div className="p-4 bg-zinc-950/40 border-t border-white/5 flex gap-2">
                      <button 
                        onClick={() => startEditing(event)}
                        className="flex-1 py-2.5 px-3 bg-zinc-900 hover:bg-zinc-850 border border-white/5 rounded-xl text-white font-black uppercase text-[10px] tracking-wider transition-all flex items-center justify-center gap-1.5 hover:border-zinc-700"
                      >
                        <Edit size={12} className="text-zinc-400" />
                        რედაქტირება
                      </button>
                      <button 
                        onClick={() => deleteEvent(event.id)}
                        className="py-2.5 px-3 bg-red-600/10 hover:bg-red-600 border border-red-500/10 hover:border-red-600 rounded-xl text-red-500 hover:text-white transition-all flex items-center justify-center gap-1.5"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schedule / Upcoming Exclusives Manager Section */}
          <div className="mt-16 pt-16 border-t border-white/5 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <h2 className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-3">
                  <span className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                    <Calendar size={20} />
                  </span>
                  დაგეგმილი ექსკლუზივების / ღონისძიებების მართვა
                </h2>
                <p className="text-zinc-500 font-bold uppercase text-[9px] tracking-[0.2em] mt-1">
                  უახლოესი თამაშების ან ექსკლუზივების დამატება, რედაქტირება და წაშლა
                </p>
              </div>
              <button 
                onClick={fetchSchedules}
                className="self-start md:self-auto text-[9px] font-black uppercase tracking-wider text-zinc-400 hover:text-white px-4 py-2 bg-zinc-900 border border-white/10 rounded-xl transition-all hover:border-white/20"
              >
                განახლება
              </button>
            </div>

            {/* Creation Form for Scheduled Items */}
            <div className="bento-card p-8 bg-zinc-900/10 border border-white/5 space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Plus size={14} className="text-blue-500" /> ახალი დაგეგმილი ღონისძიება
              </h3>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">გუნდი ან დასახელება 1</label>
                  <input 
                    type="text" placeholder="მაგ: Real Madrid" value={schedTeam1} onChange={(e) => setSchedTeam1(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl p-3.5 focus:border-blue-500 outline-none transition-all font-bold text-white uppercase text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">ოპონენტი ან დასახელება 2</label>
                  <input 
                    type="text" placeholder="მაგ: Barcelona" value={schedTeam2} onChange={(e) => setSchedTeam2(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl p-3.5 focus:border-blue-500 outline-none transition-all font-bold text-white uppercase text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">მოვლენის დრო</label>
                  <input 
                    type="datetime-local" value={schedTime} onChange={(e) => setSchedTime(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl p-3.5 focus:border-blue-500 outline-none transition-all font-bold text-white text-xs cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 items-end">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">კატეგორია</label>
                  <select 
                    value={schedSport} onChange={(e) => setSchedSport(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl p-3.5 focus:border-blue-500 outline-none transition-all font-black text-xs uppercase tracking-widest text-white cursor-pointer"
                  >
                    <option value="Football">ფეხბურთი</option>
                    <option value="UFC">UFC</option>
                    <option value="Boxing">კრივი</option>
                    <option value="NBA">NBA</option>
                    <option value="Live">ლაივი (სხვა)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">თამბნეილის ლინკი (მაქს. 4 MB)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" value={schedThumbnail} onChange={(e) => setSchedThumbnail(e.target.value)}
                      className="flex-1 bg-black border border-white/10 rounded-xl p-3.5 focus:border-blue-500 outline-none transition-all font-bold text-[10px] text-zinc-400"
                      placeholder="https://..."
                    />
                    <label className="cursor-pointer bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 flex items-center justify-center hover:bg-blue-500/20 transition-all group shrink-0">
                      {uploadingSched ? <Loader2 className="animate-spin text-blue-500" size={16} /> : <Upload size={16} className="text-blue-500" />}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleSchedFileUpload(e.target.files[0])} />
                    </label>
                  </div>
                </div>

                <div className="flex gap-4">
                  <label className="flex-1 flex items-center gap-3 p-3.5 bg-black border border-white/10 rounded-xl cursor-pointer hover:border-blue-500/30 transition-all shadow-inner">
                    <input type="checkbox" className="w-5 h-5 rounded accent-blue-600 cursor-pointer" checked={schedIsExclusive} onChange={(e) => setSchedIsExclusive(e.target.checked)} />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-white tracking-widest">ექსკლუზივი</span>
                      <span className="text-[8px] font-bold text-zinc-600 uppercase">სლაიდერში გამოჩენა</span>
                    </div>
                  </label>

                  <button 
                    onClick={createSchedule}
                    className="py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-wider rounded-xl transition-all flex items-center gap-2 justify-center"
                  >
                    <Plus size={14} /> დამატება
                  </button>
                </div>
              </div>
            </div>

            {/* List of Schedules */}
            {loadingSchedules ? (
              <div className="flex flex-col items-center justify-center py-20 bg-zinc-950/40 rounded-3xl border border-white/5 space-y-4">
                <Loader2 className="animate-spin text-blue-500" size={40} />
                <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">დაგეგმილი მატჩები იტვირთება...</p>
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-16 bg-zinc-950/40 rounded-3xl border border-white/5 space-y-2">
                <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest font-black">დაგეგმილი მატჩები არ არის</p>
                <p className="text-zinc-600 text-[10px] font-bold uppercase">დაამატეთ ახალი თამაში ზემოთ მოცემული ფორმით</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schedules.map((sched) => (
                  <div key={sched.id} className="bento-card bg-zinc-900/40 border border-white/5 overflow-hidden flex flex-col justify-between group hover:border-blue-500/20 transition-all duration-300">
                    <div>
                      {/* Image Preview / Exclusive tag */}
                      <div className="relative aspect-video bg-zinc-950 overflow-hidden">
                        <img 
                          src={sched.thumbnail || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000'} 
                          alt={sched.team1}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
                        
                        {/* Exclusiveness Badge */}
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className="bg-zinc-850 border border-white/10 text-zinc-300 text-[8px] font-black uppercase px-2 py-1 rounded">
                            დაგეგმილი
                          </span>
                          {sched.is_exclusive && (
                            <span className="bg-brand-primary/20 border border-brand-primary/30 text-brand-primary text-[8px] font-black uppercase px-2 py-1 rounded shadow-lg">
                              ექსკლუზივი
                            </span>
                          )}
                        </div>

                        <div className="absolute bottom-3 left-3 text-[9px] font-mono text-zinc-400">
                          {sched.sport?.toUpperCase()}
                        </div>
                      </div>

                      {/* Detail text */}
                      <div className="p-5 space-y-3">
                        <h3 className="text-sm font-black uppercase text-white tracking-tight leading-snug line-clamp-2">
                          {sched.team2 ? `${sched.team1} VS ${sched.team2}` : sched.team1}
                        </h3>
                        <div className="space-y-1 text-[10px] text-zinc-500 font-bold uppercase">
                          <p><span className="text-zinc-600">დრო:</span> <span className="text-blue-400 font-mono text-[9px]">{sched.time ? new Date(sched.time).toLocaleString('ka-GE') : 'არ არის'}</span></p>
                        </div>
                      </div>
                    </div>

                    {/* Actions bar */}
                    <div className="p-4 bg-zinc-950/40 border-t border-white/5 flex gap-2">
                      <button 
                        onClick={() => startEditingSchedule(sched)}
                        className="flex-1 py-2.5 px-3 bg-zinc-900 hover:bg-zinc-850 border border-white/5 rounded-xl text-white font-black uppercase text-[10px] tracking-wider transition-all flex items-center justify-center gap-1.5 hover:border-zinc-700"
                      >
                        <Edit size={12} className="text-zinc-400" />
                        რედაქტირება
                      </button>
                      <button 
                        onClick={() => deleteSchedule(sched.id)}
                        className="py-2.5 px-3 bg-red-600/10 hover:bg-red-600 border border-red-500/10 hover:border-red-600 rounded-xl text-red-500 hover:text-white transition-all flex items-center justify-center gap-1.5"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </>
        ) : (
          <div className="grid lg:grid-cols-2 gap-10">
            <div className="space-y-8">
              <div className="bento-card p-10 bg-zinc-900/30 border-white/5 space-y-8">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-primary/10 rounded-lg"><Radio size={20} className="text-brand-primary" /></div>
                    <h3 className="text-xl font-black uppercase text-white tracking-tight">NGINX CONFIG</h3>
                  </div>
                  <button 
                    onClick={() => {
                      setShowSessionDetails(false);
                      localStorage.setItem('is_broadcasting', 'false');
                    }}
                    className="text-[9px] font-black uppercase text-brand-primary hover:bg-brand-primary/5 px-4 py-2 border border-brand-primary/20 rounded-full transition-all"
                  >
                    შეწყვეტა
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">OBS RTMP URL</label>
                    <div className="flex bg-black border border-white/5 rounded-xl overflow-hidden">
                      <code className="flex-1 p-5 font-mono text-xs text-brand-primary truncate">rtmp://{vdsIp}/live</code>
                      <button onClick={() => copyToClipboard(`rtmp://${vdsIp}/live`, 'url')} className="px-6 border-l border-white/5 hover:bg-zinc-900 transition-all text-zinc-500 hover:text-white">
                        {copiedUrl ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">ROOM NAME / KEY</label>
                    <div className="flex bg-black border border-white/5 rounded-xl overflow-hidden">
                      <code className="flex-1 p-5 font-mono text-xs text-blue-400 truncate">{streamKey}</code>
                      <button onClick={() => copyToClipboard(streamKey, 'key')} className="px-6 border-l border-white/5 hover:bg-zinc-900 transition-all text-zinc-500 hover:text-white">
                        {copiedKey ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-2">
                   <p className="text-[9px] font-bold text-blue-400 uppercase">💡 მნიშვნელოვანი რჩევა</p>
                   <p className="text-[8px] text-zinc-400 leading-relaxed uppercase">
                      OBS-ში Output Mode დააყენეთ Advanced-ზე. <br/>
                      Keyframe Interval აუცილებლად უნდა იყოს 2s.
                   </p>
                </div>
              </div>
            </div>

            <div className="bento-card bg-black border-white/5 overflow-hidden flex flex-col h-[500px] sm:h-[600px] shadow-2xl relative group">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/40 z-10">
                <div className="flex items-center gap-3">
                   <div className="p-1.5 bg-blue-500/10 rounded-lg"><Monitor size={14} className="text-blue-500" /></div>
                   <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Live Monitor</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-red-600 rounded-lg shadow-lg">
                   <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                   <span className="text-[8px] font-black uppercase text-white tracking-widest">Broadcasting</span>
                </div>
              </div>
              
              <div className="flex-1 relative bg-zinc-950">
                <HLSPlayer 
                  url={streamUrl} 
                  autoPlay={!isMonitorPaused} 
                  muted={isMonitorMuted}
                  controls={false} 
                  className="w-full h-full object-contain" 
                />
                
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                   <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md p-1.5 rounded-xl border border-white/5">
                     <button onClick={() => setIsMonitorPaused(!isMonitorPaused)} className="p-2 hover:bg-white/10 rounded-lg text-white">
                       {isMonitorPaused ? <PlayIcon size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
                     </button>
                     <div className="w-px h-3 bg-white/10" />
                     <button onClick={() => setIsMonitorMuted(!isMonitorMuted)} className={cn("p-2 hover:bg-white/10 rounded-lg transition-all", isMonitorMuted ? "text-brand-primary" : "text-white")}>
                       {isMonitorMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                     </button>
                   </div>
                   
                   <button 
                     onClick={() => { const u = streamUrl; setStreamUrl(''); setTimeout(() => setStreamUrl(u), 50); }}
                     className="p-2 px-3 bg-white/5 hover:bg-white/10 rounded-lg text-[8px] font-black uppercase text-zinc-400 border border-white/5"
                   >
                     Refresh
                   </button>
                </div>

                {isMonitorPaused && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] pointer-events-none">
                     <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                        <PlayIcon size={24} className="text-white fill-white ml-1" />
                     </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-white/5 bg-zinc-900/20 backdrop-blur-md">
                 <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                       <span className="text-[10px] font-black text-white uppercase tracking-tight">{team2 ? `${team1} VS ${team2}` : team1}</span>
                       <div className="flex items-center gap-1.5">
                         <span className="text-[7px] text-zinc-500 uppercase font-black tracking-widest">{sessionSport}</span>
                         <div className="w-1 h-1 rounded-full bg-zinc-700" />
                         <span className="text-[7px] text-brand-primary uppercase font-black tracking-widest">HLS</span>
                       </div>
                    </div>
                    <button 
                      onClick={() => {
                        setShowSessionDetails(false);
                        localStorage.setItem('is_broadcasting', 'false');
                        localStorage.removeItem('current_stream_url');
                        localStorage.removeItem('current_stream_key');
                      }}
                      className="px-4 py-2 bg-red-600 text-white text-[9px] font-black uppercase rounded-lg hover:bg-red-700 transition-all"
                    >
                      გათიშვა
                    </button>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Event Modal */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in my-8">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                  <Edit size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase text-white tracking-tight">სტრიმის რედაქტირება</h3>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">სტრიმის პარამეტრების განახლება</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingEvent(null)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Event Title */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">ლაივ სტრიმის დასახელება / სათაური</label>
                <input 
                  type="text" 
                  value={editTitle} 
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl p-4 focus:border-blue-500 outline-none transition-all font-bold text-white uppercase text-sm"
                  placeholder="მაგ: Real Madrid VS Barcelona"
                />
              </div>

              {/* Category, Status Flags */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">კატეგორია</label>
                  <select 
                    value={editSport} 
                    onChange={(e) => setEditSport(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl p-4 focus:border-blue-500 outline-none transition-all font-black text-xs uppercase tracking-widest text-white cursor-pointer"
                  >
                    <option value="Football">ფეხბურთი</option>
                    <option value="UFC">UFC</option>
                    <option value="Boxing">კრივი</option>
                    <option value="NBA">NBA</option>
                    <option value="Live">ლაივი (სხვა)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">თამბნეილის ლინკი (მაქს. 4 MB)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={editThumbnail} 
                      onChange={(e) => setEditThumbnail(e.target.value)}
                      className="flex-1 bg-black border border-white/10 rounded-xl p-4 focus:border-blue-500 outline-none transition-all font-bold text-[10px] text-zinc-400 truncate"
                      placeholder="https://..."
                    />
                    <label className="cursor-pointer bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 flex items-center justify-center hover:bg-blue-500/20 transition-all group">
                      {uploadingEdit ? <Loader2 className="animate-spin text-blue-500" size={18} /> : <Upload size={18} className="text-blue-500" />}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleEditFileUpload(e.target.files[0])} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Streaming URLs & Keys */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">სტრიმინგის (HLS) ლინკი</label>
                  <input 
                    type="text" 
                    value={editStreamUrl} 
                    onChange={(e) => setEditStreamUrl(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl p-4 focus:border-blue-500 outline-none transition-all font-bold text-[11px] font-mono text-zinc-300"
                    placeholder="http://vds-ip/hls/stream.m3u8"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">ოთახი / KEY / Room Name</label>
                  <input 
                    type="text" 
                    value={editRoomName} 
                    onChange={(e) => setEditRoomName(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl p-4 focus:border-blue-500 outline-none transition-all font-bold text-[11px] font-mono text-zinc-300"
                    placeholder="დასახელება-vs-opponent..."
                  />
                </div>
              </div>

              {/* Status Toggles */}
              <div className="grid sm:grid-cols-2 gap-6 pt-2">
                <label className="flex items-center gap-4 p-4 bg-black border border-white/10 rounded-xl cursor-pointer hover:border-blue-500/30 transition-all">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded accent-blue-600" 
                    checked={editIsLive} 
                    onChange={(e) => setEditIsLive(e.target.checked)} 
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase text-white tracking-widest">ლაივის სტატუსი</span>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase italic">პირდაპირ ეთერში გასვლა</span>
                  </div>
                </label>

                <label className="flex items-center gap-4 p-4 bg-black border border-white/10 rounded-xl cursor-pointer hover:border-blue-500/30 transition-all">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded accent-blue-600" 
                    checked={editIsExclusive} 
                    onChange={(e) => setEditIsExclusive(e.target.checked)} 
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase text-white tracking-widest">ექსკლუზივი</span>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase italic">გამოჩნდება სალაიდერში</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/5 bg-zinc-900/30 flex justify-end gap-3">
              <button 
                onClick={() => setEditingEvent(null)}
                className="py-3 px-6 bg-zinc-900 hover:bg-zinc-850 border border-white/10 text-zinc-400 hover:text-white font-black uppercase text-[10px] tracking-wider rounded-xl transition-all"
              >
                გაუქმება
              </button>
              <button 
                onClick={saveEvent}
                className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-wider rounded-xl transition-all"
              >
                შენახვა
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {editingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in my-8">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                  <Edit size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase text-white tracking-tight">დაგეგმილი ღონისძიების რედაქტირება</h3>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">პარამეტრების განახლება</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingSchedule(null)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">პირველი გუნდი / სათაური</label>
                  <input 
                    type="text" 
                    value={editSchedTeam1} 
                    onChange={(e) => setEditSchedTeam1(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl p-4 focus:border-blue-500 outline-none transition-all font-bold text-white uppercase text-sm"
                    placeholder="მაგ: Real Madrid"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">მოწინააღმდეგე გუნდი</label>
                  <input 
                    type="text" 
                    value={editSchedTeam2} 
                    onChange={(e) => setEditSchedTeam2(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl p-4 focus:border-blue-500 outline-none transition-all font-bold text-white uppercase text-sm"
                    placeholder="მაგ: Barcelona"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">კატეგორია</label>
                  <select 
                    value={editSchedSport} 
                    onChange={(e) => setEditSchedSport(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl p-4 focus:border-blue-500 outline-none transition-all font-black text-xs uppercase tracking-widest text-white cursor-pointer"
                  >
                    <option value="Football">ფეხბურთი</option>
                    <option value="UFC">UFC</option>
                    <option value="Boxing">კრივი</option>
                    <option value="NBA">NBA</option>
                    <option value="Live">ლაივი (სხვა)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">მოვლენის დრო</label>
                  <input 
                    type="datetime-local" 
                    value={editSchedTime} 
                    onChange={(e) => setEditSchedTime(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl p-4 focus:border-blue-500 outline-none transition-all font-bold text-white text-sm cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-1">თამბნეილის ლინკი (მაქს. 4 MB)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={editSchedThumbnail} 
                      onChange={(e) => setEditSchedThumbnail(e.target.value)}
                      className="flex-1 bg-black border border-white/10 rounded-xl p-4 focus:border-blue-500 outline-none transition-all font-bold text-[10px] text-zinc-400 truncate"
                      placeholder="https://..."
                    />
                    <label className="cursor-pointer bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 flex items-center justify-center hover:bg-blue-500/20 transition-all group">
                      {uploadingSchedEdit ? <Loader2 className="animate-spin text-blue-500" size={18} /> : <Upload size={18} className="text-blue-500" />}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleEditSchedFileUpload(e.target.files[0])} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Status Toggles */}
              <div className="grid sm:grid-cols-2 gap-6 pt-2">
                <label className="flex items-center gap-4 p-4 bg-black border border-white/10 rounded-xl cursor-pointer hover:border-blue-500/30 transition-all">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded accent-blue-600 cursor-pointer" 
                    checked={editSchedIsExclusive} 
                    onChange={(e) => setEditSchedIsExclusive(e.target.checked)} 
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase text-white tracking-widest">ექსკლუზივი</span>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase italic">გამოჩნდება მთავარ სლაიდერში</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/5 bg-zinc-900/30 flex justify-end gap-3">
              <button 
                onClick={() => setEditingSchedule(null)}
                className="py-3 px-6 bg-zinc-900 hover:bg-zinc-850 border border-white/10 text-zinc-400 hover:text-white font-black uppercase text-[10px] tracking-wider rounded-xl transition-all"
              >
                გაუქმება
              </button>
              <button 
                onClick={saveSchedule}
                className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-wider rounded-xl transition-all"
              >
                შენახვა
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
