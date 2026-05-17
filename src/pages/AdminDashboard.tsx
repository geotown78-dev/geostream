import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Play, StopCircle, Settings, TrendingUp, Monitor, Trash2, Plus, Calendar, Image as ImageIcon, LayoutDashboard, Upload, Loader2, Copy, Check, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import HLSPlayer from '../components/HLSPlayer';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [sessionSport, setSessionSport] = useState('Football');
  const [sessionIsExclusive, setSessionIsExclusive] = useState(false);
  const [sessionThumbnail, setSessionThumbnail] = useState('');
  const [vdsIp, setVdsIp] = useState(localStorage.getItem('vds_ip') || '5.83.153.142');
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [streamUrl, setStreamUrl] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [uploading, setUploading] = useState(false);

  const startSession = async () => {
    if (!team1) return;
    
    localStorage.setItem('vds_ip', vdsIp);
    const slug = `${team1.toLowerCase().trim().replace(/\s+/g, '-')}${team2 ? `-vs-${team2.toLowerCase().trim().replace(/\s+/g, '-')}` : ''}`;
    const key = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    const url = `http://${vdsIp}/hls/${key}.m3u8`;
    
    setStreamKey(key);
    setStreamUrl(url);

    try {
      const { error } = await supabase.from('events').insert([{
        title: team2 ? `${team1} VS ${team2}` : team1,
        sport: sessionSport,
        is_live: true,
        is_exclusive: sessionIsExclusive,
        thumbnail: sessionThumbnail || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000',
        stream_url: url,
        stream_key: key,
        room_name: slug,
        start_time: new Date().toISOString()
      }]);

      if (error) throw error;
      setShowSessionDetails(true);
    } catch (err) {
      console.error('Error starting session:', err);
      alert('სესიის დაწყება ვერ მოხერხდა');
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
      alert('ატვირთვა ვერ მოხერხდა: ' + (error.message || 'Error'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 bg-black">
      <div className="max-w-[1000px] mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">
            სტრიმის <span className="text-brand-primary">მართვა</span>
          </h1>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em]">GeoStream Admin Core</p>
        </header>

        {!showSessionDetails ? (
          <div className="bento-card p-12 bg-zinc-900/30 space-y-10 border-white/5">
            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">სახელი</label>
                    <input 
                      type="text" value={team1} onChange={(e) => setTeam1(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl p-4 focus:border-brand-primary outline-none transition-all font-bold text-white uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">გუნდი 2 (სურვილისამებრ)</label>
                    <input 
                      type="text" value={team2} onChange={(e) => setTeam2(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl p-4 focus:border-brand-primary outline-none transition-all font-bold text-white uppercase"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">სპორტი</label>
                  <select 
                    value={sessionSport} onChange={(e) => setSessionSport(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl p-4 focus:border-brand-primary outline-none transition-all font-black text-xs uppercase tracking-widest text-white cursor-pointer"
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
                      className="flex-1 bg-zinc-950 border border-white/10 rounded-xl p-4 focus:border-brand-primary outline-none transition-all font-bold text-xs"
                    />
                    <label className="cursor-pointer bg-brand-primary/10 border border-brand-primary/20 rounded-xl px-4 flex items-center justify-center hover:bg-brand-primary/20 transition-all group">
                      {uploading ? <Loader2 className="animate-spin text-brand-primary" size={20} /> : <Upload size={20} className="text-brand-primary" />}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                    </label>
                  </div>
                </div>
                <label className="flex items-center gap-4 p-5 bg-zinc-950 border border-white/10 rounded-2xl cursor-pointer hover:border-brand-primary/30 transition-all group">
                  <input type="checkbox" className="w-6 h-6 rounded accent-brand-primary" checked={sessionIsExclusive} onChange={(e) => setSessionIsExclusive(e.target.checked)} />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase text-white tracking-widest">ექსკლუზივი</span>
                    <span className="text-[9px] font-bold text-zinc-600 uppercase">მთავარ გვერდზე</span>
                  </div>
                </label>
              </div>
              <div className="flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="p-6 bg-brand-primary/5 border border-brand-primary/10 rounded-2xl">
                    <p className="text-[11px] font-bold text-zinc-400 uppercase leading-relaxed italic">შედი OBS-ში და გამოიყენე URL და KEY</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">VDS IP <Settings size={12} /></label>
                    <input type="text" value={vdsIp} onChange={(e) => setVdsIp(e.target.value)} className="w-full bg-zinc-950 border border-white/5 rounded-xl px-5 py-3 text-xs font-mono text-zinc-500 focus:border-brand-primary/30 outline-none" />
                  </div>
                </div>
                <button 
                  onClick={startSession}
                  className="w-full py-7 bg-brand-primary text-white font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 shadow-[0_20px_40px_-15px_rgba(255,0,51,0.4)] mt-10"
                >
                  <Monitor size={24} /> 
                  <span className="text-sm uppercase tracking-widest">სესიის დაწყება</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="bento-card p-10 bg-zinc-900/30 border-white/10 space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black uppercase text-white tracking-tighter">OBS მონაცემები</h3>
                <button onClick={() => setShowSessionDetails(false)} className="text-[10px] font-black uppercase text-brand-primary hover:underline px-3 py-1 bg-brand-primary/5 rounded-full">შეცვლა</button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">SERVER URL</label>
                  <div className="flex bg-black border border-white/5 rounded-xl overflow-hidden group">
                    <code className="flex-1 p-5 font-mono text-xs text-brand-primary truncate">rtmp://{vdsIp}/live</code>
                    <button onClick={() => { navigator.clipboard.writeText(`rtmp://${vdsIp}/live`); setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2000); }} className="px-6 border-l border-white/5 hover:bg-zinc-900 transition-colors">
                      {copiedUrl ? <Check size={18} className="text-green-500" /> : <Copy size={18} className="text-zinc-500" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">STREAM KEY</label>
                  <div className="flex bg-black border border-white/5 rounded-xl overflow-hidden group">
                    <code className="flex-1 p-5 font-mono text-xs text-brand-primary truncate">{streamKey}</code>
                    <button onClick={() => { navigator.clipboard.writeText(streamKey); setCopiedKey(true); setTimeout(() => setCopiedKey(false), 2000); }} className="px-6 border-l border-white/5 hover:bg-zinc-900 transition-colors">
                      {copiedKey ? <Check size={18} className="text-green-500" /> : <Copy size={18} className="text-zinc-500" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-zinc-950 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                  <span className="text-[10px] font-black uppercase text-zinc-400">ველოდებით OBS-ს...</span>
                </div>
              </div>
            </div>
            <div className="bento-card bg-black border-white/5 overflow-hidden flex flex-col min-h-[450px]">
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-zinc-900/20">
                <div className="flex items-center gap-3">
                   <div className="p-1.5 bg-brand-primary/10 rounded"><Monitor size={14} className="text-brand-primary" /></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Preview</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-full">
                   <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                   <span className="text-[9px] font-black uppercase text-red-500">Live</span>
                </div>
              </div>
              <div className="flex-1 relative bg-zinc-950 flex items-center justify-center">
                <HLSPlayer url={streamUrl} className="w-full h-full object-contain" autoPlay={true} controls={true} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

