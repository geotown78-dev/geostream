import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Play, StopCircle, Settings, TrendingUp, Monitor, Trash2, Plus, Calendar, Image as ImageIcon, LayoutDashboard, Upload, Loader2, Copy, Check, ExternalLink, Globe } from 'lucide-react';
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
    } catch (err: any) {
      console.error('Error starting session:', err);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `thumbnails/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('SITE-ASSETS')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('SITE-ASSETS')
        .getPublicUrl(filePath);

      setSessionThumbnail(publicUrl);
    } catch (error: any) {
      alert('ატვირთვა ვერ მოხერხდა');
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
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">თამბნეილი</label>
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
    </div>
  );
}
