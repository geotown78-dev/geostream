import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Monitor, StopCircle, Share2, Terminal, Pause, Info, ExternalLink, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import HLSPlayer from '../components/HLSPlayer';

export default function BroadcasterRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isPausedGlobal, setIsPausedGlobal] = useState(false);
  const [activeTab, setActiveTab ] = useState<'preview' | 'setup'>('preview');
  const vdsIp = localStorage.getItem('vds_ip') || '';

  const toggleGlobalPause = async () => {
    const nextState = !isPausedGlobal;
    setIsPausedGlobal(nextState);
    if (!supabase || !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) return;
    try {
      const { error } = await supabase.from('active_streams').update({ is_paused: nextState }).eq('id', 'global-stream');
      if (error && error.code === 'PGRST205') {
        console.warn('active_streams table not found.');
      }
    } catch (e) {
      console.error('Failed to sync pause state:', e);
    }
  };

  const endStream = async () => {
    if (!supabase || !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) return;
    try {
      const { error } = await supabase.from('active_streams').update({ is_active: false }).eq('id', 'global-stream');
      // Also mark the specific event as not live
      await supabase.from('events').update({ is_live: false }).eq('room_name', roomId);
    } catch (e) {
      console.error('Failed to end stream:', e);
    }
  };

  useEffect(() => {
    if (!roomId) return;

    const fetchStreamInfo = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('events')
          .select('stream_url')
          .eq('room_name', roomId)
          .maybeSingle();
        
        if (error) throw error;
        if (data?.stream_url) {
          let url = data.stream_url;
          // Fix: Ensure URL ends with .m3u8 if it's our HLS path
          if (url && url.includes('/hls/') && !url.endsWith('.m3u8')) {
            url += '.m3u8';
          }
          setStreamUrl(url);
        }
      } catch (e: any) {
        console.error('Failed to fetch stream url:', e.message || e);
         // setError('სტრიმის ინფორმაცია ვერ მოიძებნა ბაზაში.');
      } finally {
        setLoading(false);
      }
    };

    fetchStreamInfo();

    return () => {
      endStream();
    };
  }, [roomId]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <p className="text-red-400 mb-6 font-bold text-lg">{error}</p>
        <button onClick={() => navigate('/admin')} className="bg-brand-primary text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform">ადმინზე დაბრუნება</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-brand-primary mx-auto" size={40} />
          <p className="text-xs font-black uppercase tracking-widest text-zinc-500">სტუდია მზადდება...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black pt-32 pb-12 px-6">
      <div className="max-w-[1600px] mx-auto flex flex-col h-[calc(100vh-10rem)]">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin')}
              className="p-3 bg-brand-surface border border-brand-border rounded-xl text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-black italic uppercase tracking-tighter">
                VDS სტუდია: <span className="text-brand-primary">{roomId}</span>
              </h1>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">ადმინისტრატორის მართვის პანელი</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="bg-red-600 text-white px-3 py-1.5 rounded-md text-[10px] font-black flex items-center gap-2 uppercase">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> 
                VDS სტრიმი
              </div>
              <button 
                onClick={toggleGlobalPause}
                className={cn(
                  "px-4 py-1.5 rounded-md text-[10px] font-black flex items-center gap-2 uppercase transition-all border",
                  isPausedGlobal 
                    ? "bg-yellow-500 text-black border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.2)]" 
                    : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                )}
              >
                {isPausedGlobal ? <Play size={12} fill="black" /> : <Pause size={12} fill="currentColor" />}
                {isPausedGlobal ? 'გაგრძელება' : 'გლობალური პაუზა'}
              </button>
              <button 
                onClick={endStream}
                className="px-4 py-1.5 bg-red-600/10 border border-red-600/20 text-red-500 rounded-md text-[10px] font-black flex items-center gap-2 uppercase hover:bg-red-600 hover:text-white transition-all"
              >
                <StopCircle size={12} />
                დასრულება
              </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8 flex-1 overflow-hidden">
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            <div className="flex-1 bento-card relative bg-black shadow-2xl overflow-hidden group">
              <div className="absolute top-4 left-4 z-20 flex gap-2 pointer-events-none">
                 <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest text-brand-primary border border-brand-primary/20">
                   Preview
                 </div>
              </div>
              
              {streamUrl ? (
                <HLSPlayer 
                  url={streamUrl}
                  autoPlay={true}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-zinc-950 p-12 text-center">
                  <Terminal size={48} className="text-zinc-800" />
                  <div className="space-y-2">
                    <p className="text-zinc-600 font-black uppercase tracking-widest text-sm">სტრიმის URL არ არის მითითებული</p>
                    <p className="text-xs text-zinc-700 max-w-md">გთხოვთ Admin Dashboard-ზე მიუთითოთ თქვენი VDS სტრიმის HLS (.m3u8) მისამართი.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bento-card p-6 bg-brand-primary/5 border-brand-primary/10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-primary rounded-xl text-white">
                  <Monitor size={24} />
                </div>
                <div>
                  <h3 className="font-black uppercase text-sm tracking-tight text-white mb-1">თქვენი VDS სტატუსი</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                    თუ preview-ში გამოსახულება არ ჩანს, დარწმუნდით რომ <b>OBS</b>-დან სტრიმი გაშვებულია თქვენს სერვერზე და URL სწორია.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            <div className="flex-1 bento-card flex flex-col bg-zinc-900/40">
              <div className="p-6 border-b border-brand-border flex items-center justify-between">
                <div className="flex bg-brand-surface p-1 rounded-xl border border-brand-border">
                  <button 
                    onClick={() => setActiveTab('preview')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                      activeTab === 'preview' ? "bg-brand-primary text-black" : "text-zinc-500 hover:text-white"
                    )}
                  >
                    ინფორმაცია
                  </button>
                  <button 
                    onClick={() => setActiveTab('setup')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                      activeTab === 'setup' ? "bg-brand-primary text-black" : "text-zinc-500 hover:text-white"
                    )}
                  >
                    Setup Guide
                  </button>
                </div>
              </div>

              <div className="flex-1 p-8 space-y-8 overflow-y-auto custom-scrollbar">
                {activeTab === 'preview' ? (
                  <div className="space-y-6">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-brand-primary uppercase tracking-[0.2em]">OBS Server URL</label>
                        <div className="p-3 bg-black rounded-lg border border-white/5 font-mono text-[10px] text-zinc-300 break-all select-all">
                          rtmp://{vdsIp || 'YOUR_VDS_IP'}/live
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-brand-primary uppercase tracking-[0.2em]">OBS Stream Key</label>
                        <div className="p-3 bg-black rounded-lg border border-white/5 font-mono text-[10px] text-brand-primary break-all select-all">
                          {roomId}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <Terminal size={12} className="text-zinc-500" /> PUBLIC HLS URL
                      </label>
                      <div className="p-4 bg-black/40 rounded-xl border border-white/5 font-mono text-[10px] text-zinc-500 break-all leading-relaxed select-all">
                        {streamUrl || 'N/A'}
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                      <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                        <Info size={14} className="text-brand-primary" /> Quick Stats
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[8px] text-zinc-500 uppercase font-black">Room ID</p>
                          <p className="text-xs font-bold text-zinc-300">{roomId}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] text-zinc-500 uppercase font-black">Status</p>
                          <p className="text-xs font-bold text-green-500 uppercase tracking-widest">Active</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                       <a 
                        href={`/live/${roomId}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full py-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:bg-white/10 hover:text-white transition-all group"
                       >
                         View as audience
                         <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                       </a>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-white italic uppercase">How to stream to VDS?</h4>
                      <div className="space-y-4 text-[11px] text-zinc-400 leading-relaxed font-medium">
                        <div className="flex gap-4">
                          <div className="w-6 h-6 rounded-lg bg-brand-primary text-black flex items-center justify-center shrink-0 font-black">1</div>
                          <p>დააინსტალირეთ <b>MediaMTX</b> ან <b>Nginx RTMP</b> თქვენს სერვერზე.</p>
                        </div>
                        <div className="flex gap-4">
                          <div className="w-6 h-6 rounded-lg bg-brand-primary text-black flex items-center justify-center shrink-0 font-black">2</div>
                          <p>OBS Settings {'>'} Stream {'>'} სერვისი: <b>Custom</b>. სერვერი: <code>rtmp://{vdsIp || 'VDS_IP'}/live</code></p>
                        </div>
                        <div className="flex gap-4">
                          <div className="w-6 h-6 rounded-lg bg-brand-primary text-black flex items-center justify-center shrink-0 font-black">3</div>
                          <p>სტრიმის გასაღები (Key) დააყენეთ: <code>{roomId}</code></p>
                        </div>
                        <div className="flex gap-4">
                          <div className="w-6 h-6 rounded-lg bg-brand-primary text-black flex items-center justify-center shrink-0 font-black">4</div>
                          <p>VDS სტრიმის მისამართი (HLS) იქნება: <code>http://{vdsIp || 'VDS_IP'}:8888/live/{roomId}/index.m3u8</code></p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
