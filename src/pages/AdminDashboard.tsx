import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Play, StopCircle, Settings, TrendingUp, Monitor, Trash2, Plus, Calendar, Image as ImageIcon, LayoutDashboard, Upload, Loader2, Copy, Check, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import HLSPlayer from '../components/HLSPlayer';
import LiveKitStream from '../components/LiveKitStream';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [sessionSport, setSessionSport] = useState('Football');
  const [sessionIsExclusive, setSessionIsExclusive] = useState(false);
  const [sessionThumbnail, setSessionThumbnail] = useState('');
  const [vdsIp, setVdsIp] = useState(localStorage.getItem('vds_ip') || '5.83.153.142');
  const [streamType, setStreamType] = useState<'hls' | 'livekit'>('hls');
  const [livekitUrl, setLivekitUrl] = useState(localStorage.getItem('livekit_url') || 'ws://5.83.153.142:7880');
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [streamUrl, setStreamUrl] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [uploading, setUploading] = useState(false);

  const copyToClipboard = async (text: string, type: 'url' | 'key') => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-secure contexts (HTTP)
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
      alert('ვერ დაკოპირდა: ' + text);
    }
  };

  const startSession = async () => {
    if (!team1) {
      alert('გთხოვთ შეიყვანოთ დასახელება');
      return;
    }
    
    localStorage.setItem('vds_ip', vdsIp);
    localStorage.setItem('livekit_url', livekitUrl);
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
    } catch (err: any) {
      console.error('Error starting session:', err);
      alert('შეცდომა: ' + (err.message || 'სესიის დაწყება ვერ მოხერხდა'));
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
      <div className="max-w-[1200px] mx-auto">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">
              LIVEKIT <span className="text-blue-500">CONTROL</span>
            </h1>
            <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em]">Ultra-Low Latency Management</p>
          </div>
          <div className="flex gap-4">
             <div className="text-right">
                <p className="text-[10px] font-black text-zinc-500 uppercase">SERVER STATUS</p>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[11px] font-bold text-white">LIVEKIT ONLINE</span>
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
                        type="text" placeholder="მაგ: Barcelona" value={team2} onChange={(e) => setTeam2(e.target.value)}
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
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">თამბნეილი (URL)</label>
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
              <div className="bento-card p-8 bg-blue-600 shadow-[0_30px_60px_-15px_rgba(37,99,235,0.3)] border-none flex flex-col justify-between min-h-[300px]">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Settings size={16} className="text-white/60" />
                    <label className="text-[10px] font-black text-white/60 uppercase tracking-widest">Server Config</label>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-white/50 uppercase">LiveKit Server URL</span>
                    <input 
                      type="text" value={livekitUrl} onChange={(e) => setLivekitUrl(e.target.value)} 
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-[11px] font-mono text-white placeholder:text-white/20 outline-none focus:bg-white/20 transition-all"
                      placeholder="ws://your-ip:7880"
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

                  <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-zinc-400">
                  <TrendingUp size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Info</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed font-bold italic">
                  LiveKit უზრუნველყოფს 1 წამზე ნაკლებ დაყოვნებას. დარწმუნდით, რომ სერვერზე <span className="text-white">port 7880</span> გახსნილია.
                </p>
                <div className="pt-2 border-t border-white/5 space-y-2">
                   <p className="text-[9px] text-red-400 font-bold uppercase">🚨 თუ არ ირთვება:</p>
                   <p className="text-[8px] text-zinc-600 leading-relaxed uppercase">
                      1. .env ფაილში ჩაწერეთ LIVEKIT_API_KEY <br/>
                      2. გახსენით პორტი: <code className="text-zinc-400">sudo ufw allow 1935,7880,7885/tcp</code> <br/>
                      3. PM2-ის რესტარტი: <code className="text-zinc-400">pm2 restart all</code>
                   </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-10">
            <div className="space-y-8">
              <div className="bento-card p-10 bg-zinc-900/30 border-white/5 space-y-8">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg"><Radio size={20} className="text-blue-500" /></div>
                    <h3 className="text-xl font-black uppercase text-white tracking-tight">INGRESS CONFIG</h3>
                  </div>
                  <button onClick={() => setShowSessionDetails(false)} className="text-[9px] font-black uppercase text-blue-500 hover:bg-blue-500/5 px-4 py-2 border border-blue-500/20 rounded-full transition-all">დახურვა</button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">LIVEKIT URL</label>
                    <div className="flex bg-black border border-white/5 rounded-xl overflow-hidden">
                      <code className="flex-1 p-5 font-mono text-xs text-blue-400 truncate">{livekitUrl}</code>
                      <button onClick={() => copyToClipboard(livekitUrl, 'url')} className="px-6 border-l border-white/5 hover:bg-zinc-900 transition-all text-zinc-500 hover:text-white">
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

                <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl space-y-4">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                     🚀 როგორ დავიწყოთ სტრიმი?
                  </p>
                  <div className="space-y-3">
                    <div className="p-3 bg-black/40 rounded-xl space-y-2">
                       <p className="text-[9px] font-bold text-white uppercase">1. OBS - WHIP (პირდაპირი LiveKit)</p>
                       <p className="text-[8px] text-zinc-500 leading-relaxed font-mono">
                          Settings {"->"} Stream {"->"} Service: <span className="text-white font-bold">WHIP</span> <br/>
                          Server: <span className="text-blue-400 italic">http://{vdsIp}:7885/whip</span><br/>
                          <span className="text-zinc-600">ან RTMP (Ingress-ით):</span> <br/>
                          <span className="text-blue-400 italic">rtmp://{vdsIp}/live</span>
                       </p>
                    </div>
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-2">
                       <p className="text-[9px] font-bold text-blue-400 uppercase">🚨 HTTPS / Mixed Content Warning</p>
                       <p className="text-[8px] text-zinc-400 leading-relaxed uppercase">
                          თუ საიტს იყენებთ <span className="text-white font-bold">HTTPS</span>-ზე, ბრაუზერი დაბლოკავს <span className="text-red-400">ws://</span> კავშირს. <br/>
                          გამოსავალი: <br/>
                          1. გამოიყენეთ <span className="text-blue-400 font-bold">wss://</span> (მოითხოვს SSL-ს) <br/>
                          2. ან შედით საიტზე <span className="text-blue-400 font-bold">http://</span> მისამართით.
                       </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-red-950/20 border border-red-500/30 rounded-2xl space-y-4 shadow-xl">
                  <p className="text-[11px] text-red-400 font-black uppercase flex items-center gap-2 italic">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    ❌ OBS ვერ უკავშირდება? (Failed to connect)
                  </p>
                  <div className="space-y-4">
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                      <p className="text-[10px] text-orange-400 font-bold mb-1">1. პორტი 1935 დაკეტილია</p>
                      <pre className="text-[9px] font-mono text-zinc-400 bg-zinc-900/40 p-2 rounded">
{`sudo ufw allow 1935/tcp
sudo ufw reload`}
                      </pre>
                    </div>
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                      <p className="text-[10px] text-yellow-400 font-bold mb-1">2. Nginx კონფიგი აკლია</p>
                      <p className="text-[8px] text-zinc-500 leading-relaxed mb-2">
                        შეამოწმეთ გიწერიათ თუ არა <code className="text-white">rtmp {"{"} ... application live {"{"} ... hls on; ... {"}"} {"}"}</code> ფაილში <code className="text-white">/etc/nginx/nginx.conf</code>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bento-card bg-black border-white/5 overflow-hidden flex flex-col h-[600px] shadow-2xl">
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-zinc-900/40">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-500/10 rounded"><Monitor size={16} className="text-blue-500" /></div>
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Live Monitor</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-1.5 bg-red-600 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                   <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                   <span className="text-[9px] font-black uppercase text-white tracking-widest">Broadcasting</span>
                </div>
              </div>
              <div className="flex-1 relative bg-zinc-950">
                <LiveKitStream roomName={streamKey || 'preview'} userName="Admin" serverUrl={livekitUrl} />
              </div>
              <div className="p-4 border-t border-white/5 bg-zinc-900/20">
                 <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-white uppercase">{team2 ? `${team1} VS ${team2}` : team1}</span>
                       <span className="text-[8px] text-zinc-500 uppercase font-bold">{sessionSport} • Low Latency Mode</span>
                    </div>
                    <button className="px-4 py-2 bg-red-600/10 border border-red-600/20 text-red-500 text-[10px] font-black uppercase rounded-lg hover:bg-red-600/20 transition-all">სტრიმის გათიშვა</button>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

