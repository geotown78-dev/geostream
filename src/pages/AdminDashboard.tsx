import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Play, StopCircle, Settings, TrendingUp, Monitor, Trash2, Plus, Calendar, Image as ImageIcon, LayoutDashboard, Upload, Loader2, Copy, Check, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import HLSPlayer from '../components/HLSPlayer';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [roomId, setRoomId] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [vdsIp, setVdsIp] = useState(localStorage.getItem('vds_ip') || '');
  const [sessionSport, setSessionSport] = useState('Football');
  const [sessionIsExclusive, setSessionIsExclusive] = useState(false);
  const [sessionThumbnail, setSessionThumbnail] = useState('');
  const [activeTab, setActiveTab ] = useState<'sessions' | 'streams' | 'highlights' | 'schedule'>('sessions');
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const slugify = (text: string) => text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\u10D0-\u10FA\w-]+/g, '');

  useEffect(() => {
    if (team1 && team2) {
      const slug = `${slugify(team1)}-vs-${slugify(team2)}`;
      setRoomId(slug);
      // Generate a shorter, random stream key based on the slug
      if (!streamKey) {
        setStreamKey(`${slug}-${Math.random().toString(36).substring(2, 7)}`);
      }
    } else if (team1 || team2) {
      const slug = slugify(team1 || team2);
      setRoomId(slug);
      if (!streamKey) {
        setStreamKey(`${slug}-${Math.random().toString(36).substring(2, 7)}`);
      }
    }
  }, [team1, team2]);

  // CMS States
  const [streams, setStreams] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [schedule, setSchedule ] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading ] = useState<string | null>(null);

  useEffect(() => {
    fetchCMSData();
  }, [activeTab]);

  const handleFileUpload = async (file: File, folder: string = 'private') => {
    const bucketName = 'SITE-ASSETS';
    try {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('ფაილის ზომა არ უნდა აღემატებოდეს 5MB-ს');
        return null;
      }

      setUploading(folder);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading image to Supabase:', error);
      let errorMsg = 'ფოტოს ატვირთვა ვერ მოხერხდა';
      
      if (error.message === 'Bucket not found' || error.error === 'Bucket not found') {
        errorMsg = `შეცდომა: საცავი "${bucketName}" ვერ მოიძებნა.\n\nგთხოვთ Supabase Dashboard-ზე:\n1. გადადით Storage განყოფილებაში\n2. დარწმუნდით რომ გაქვთ ბუკეტი სახელით "${bucketName}"\n3. გახადეთ ის "Public"`;
      } else if (error.error === 'Payload too large') {
        errorMsg = 'შეცდომა: ფაილი ზედმეტად დიდია.';
      } else if (error.message?.includes('policy')) {
        errorMsg = 'შეცდომა: წვდომა უარყოფილია (RLS Policy).\n\nგთხოვთ Supabase Storage-ში პოლიტიკებში დაამატეთ "INSERT" და "SELECT" უფლებები ანონიმური მომხმარებლებისთვის.';
      } else {
        errorMsg += `: ${error.message || 'უცნობი შეცდომა'}`;
      }
      
      alert(errorMsg);
      return null;
    } finally {
      setUploading(null);
    }
  };

  const fetchCMSData = async () => {
    if (!supabase || !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      return;
    }
    setLoading(true);
    try {
      // Use actual table names from the schema hint
      const { data: sData, error: sErr } = await supabase.from('events').select('*').order('created_at', { ascending: false });
      const { data: hData, error: hErr } = await supabase.from('highlights').select('*').order('created_at', { ascending: false });
      const { data: scData, error: scErr } = await supabase.from('schedule').select('*').order('created_at', { ascending: false });
      
      if (sErr && sErr.code !== 'PGRST205') console.error('Error fetching events:', sErr);
      if (hErr && hErr.code !== 'PGRST205') console.error('Error fetching highlights:', hErr);
      if (scErr && scErr.code !== 'PGRST205') console.error('Error fetching schedule:', scErr);

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
    // Save VDS IP for next time
    if (vdsIp) localStorage.setItem('vds_ip', vdsIp);

    try {
      // 1. Update global stream status
      const { error: activeErr } = await supabase.from('active_streams').upsert({ 
        id: 'global-stream', 
        room_id: id, 
        is_active: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      
      if (activeErr) console.warn('Active stream update failed:', activeErr);

      // 2. Sync with events table
      const formattedTitle = (team1 && team2) 
        ? `${team1.toUpperCase()} VS ${team2.toUpperCase()}`
        : id.replace(/-/g, ' ').toUpperCase();
      
      const { data: existingEvent } = await supabase
        .from('events')
        .select('id')
        .eq('room_name', id)
        .maybeSingle();

      // Auto-generate stream URL if not provided manually
      let finalStreamUrl = streamUrl;
      const keyToUse = streamKey || id; // Fallback to id if key not set
      
      if (!finalStreamUrl && vdsIp) {
        finalStreamUrl = `http://${vdsIp}/hls/${keyToUse}.m3u8`;
      } else if (finalStreamUrl && finalStreamUrl.includes('/hls/') && !finalStreamUrl.endsWith('.m3u8')) {
        // Even if provided manually, if it's our HLS path, ensure extension
        finalStreamUrl += '.m3u8';
      }

      setStreamUrl(finalStreamUrl);

      const eventData = {
        room_name: id,
        title: formattedTitle,
        sport: sessionSport,
        is_live: true,
        is_exclusive: sessionIsExclusive,
        thumbnail: sessionThumbnail,
        stream_url: finalStreamUrl,
        stream_key: keyToUse,
        start_time: new Date().toISOString()
      };

      if (existingEvent) {
        const { error: updateErr } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', existingEvent.id);
        
        if (updateErr) handleSupabaseError(updateErr, 'Events Update');
      } else {
        const { error: insertErr } = await supabase
          .from('events')
          .insert([eventData]);
        
        if (insertErr) handleSupabaseError(insertErr, 'Events Insert');
      }

      setShowSessionDetails(true);
    } catch (e) {
      console.warn('Supabase sync process encountered an error:', e);
    }
  };

  const handleSupabaseError = (error: any, context: string) => {
    console.error(`Supabase Error (${context}):`, error);
    if (error.code === '42P10' || error.message?.includes('column')) {
      alert(`მონაცემთა ბაზის შეცდომა: გთხოვთ SQL Editor-ში დაამატოთ "is_exclusive" და "room_name" სვეტები "events" ცხრილში.`);
    } else if (error.status === 403 || error.message?.includes('policy')) {
      alert(`წვდომა უარყოფილია (403): გთხოვთ Supabase-ში "events" ცხრილისთვის დაამატოთ INSERT და UPDATE პოლიტიკა ადმინისტრატორებისთვის.`);
    }
  };

  const stopBroadcast = async () => {
    try {
      // Stop the global stream
      const { error: activeErr } = await supabase.from('active_streams').update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      }).eq('id', 'global-stream');
      
      if (activeErr) {
        handleSupabaseError(activeErr, 'Stop Broadcast');
      } else {
        alert('ლაივი წარმატებით შეჩერდა');
      }

      // Optionally set all events to is_live = false
      await supabase.from('events').update({ is_live: false }).eq('is_live', true);
      
      fetchCMSData();
    } catch (e) {
      console.error('Stop broadcast error:', e);
    }
  };

  const deleteItem = async (table: string, id: string) => {
    if (!window.confirm('ნამდვილად გსურთ წაშლა?')) return;
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) {
        handleSupabaseError(error, `Delete from ${table}`);
      } else {
        fetchCMSData();
      }
    } catch (e) {
      alert('წაშლა ვერ მოხერხდა');
    }
  };

  const [newStream, setNewStream] = useState({ title: '', sport: '', thumbnail: '', room_name: '', stream_url: '', is_exclusive: false });
  const [newHighlight, setNewHighlight] = useState({ title: '', thumbnail: '' });
  const [newSchedule, setNewSchedule] = useState({ team1: '', team2: '', time: '', sport: '', thumbnail: '', is_exclusive: false });

  const addStream = async () => {
    if (!newStream.title || !newStream.room_name) return;
    const { error } = await supabase.from('events').insert([{ ...newStream, is_live: true, start_time: new Date().toISOString() }]);
    if (error) {
      if (error.message.includes('column')) {
        alert('შეცდომა: მონაცემთა ბაზაში აკლია "is_exclusive" სვეტი. გთხოვთ დაამატოთ ის SQL Editor-ში.');
      } else {
        alert('დამატება ვერ მოხერხდა: ' + error.message);
      }
      return;
    }
    setNewStream({ title: '', sport: '', thumbnail: '', room_name: '', is_exclusive: false });
    fetchCMSData();
  };

  const addHighlight = async () => {
    if (!newHighlight.title) return;
    const { error } = await supabase.from('highlights').insert([newHighlight]);
    if (error) {
      alert('დამატება ვერ მოხერხდა: ' + error.message);
      return;
    }
    setNewHighlight({ title: '', thumbnail: '' });
    fetchCMSData();
  };

  const addSchedule = async () => {
    if (!newSchedule.team1 || !newSchedule.team2 || !newSchedule.time) return;
    const { error } = await supabase.from('schedule').insert([newSchedule]);
    if (error) {
      if (error.message.includes('column')) {
        alert('შეცდომა: მონაცემთა ბაზაში აკლია "is_exclusive" სვეტი. გთხოვთ დაამატოთ ის SQL Editor-ში.');
      } else {
        alert('დამატება ვერ მოხერხდა: ' + error.message);
      }
      return;
    }
    setNewSchedule({ team1: '', team2: '', time: '', sport: '', thumbnail: '', is_exclusive: false });
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
                <div className="flex justify-between items-center">
                  <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-3">
                    <Radio size={14} className="text-brand-primary" /> სესიის ინიციალიზაცია
                  </h2>
                  <button 
                    onClick={stopBroadcast}
                    className="px-4 py-2 bg-zinc-900 border border-white/5 hover:bg-red-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2"
                  >
                    <StopCircle size={12} /> ყველა ლაივის გათიშვა
                  </button>
                </div>

                {!showSessionDetails ? (
                  <div className="bento-card p-10 bg-zinc-900/40 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left: Input fields */}
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">გუნდი 1</label>
                            <input 
                              type="text" 
                              value={team1}
                              onChange={(e) => setTeam1(e.target.value)}
                              placeholder="..."
                              className="w-full bg-black border border-brand-border rounded-xl p-4 focus:border-brand-primary outline-none transition-all font-bold text-lg uppercase"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">გუნდი 2</label>
                            <input 
                              type="text" 
                              value={team2}
                              onChange={(e) => setTeam2(e.target.value)}
                              placeholder="..."
                              className="w-full bg-black border border-brand-border rounded-xl p-4 focus:border-brand-primary outline-none transition-all font-bold text-lg uppercase"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">სპორტის სახეობა</label>
                          <select 
                            value={sessionSport}
                            onChange={(e) => setSessionSport(e.target.value)}
                            className="w-full bg-black border border-brand-border rounded-xl p-4 focus:border-brand-primary outline-none transition-all font-black text-xs uppercase tracking-widest text-white appearance-none cursor-pointer"
                          >
                            <option value="Football">ფეხბურთი</option>
                            <option value="UFC">UFC</option>
                            <option value="Boxing">კრივი</option>
                            <option value="NBA">NBA</option>
                            <option value="Live">ლაივი (ზოგადი)</option>
                          </select>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">თამბნეილი</label>
                          <div className="flex gap-2">
                             <input 
                              type="text" 
                              value={sessionThumbnail}
                              onChange={(e) => setSessionThumbnail(e.target.value)}
                              placeholder="სურათის URL..."
                              className="flex-1 bg-black border border-brand-border rounded-xl p-4 focus:border-brand-primary outline-none transition-all font-bold text-xs"
                            />
                            <label className="cursor-pointer bg-brand-primary/10 border border-brand-primary/20 rounded-xl px-4 flex items-center justify-center hover:bg-brand-primary/20 transition-all">
                              {uploading === 'session-thumb' ? <Loader2 className="animate-spin text-brand-primary" size={18} /> : <Upload size={18} className="text-brand-primary" />}
                              <input 
                                type="file" className="hidden" accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const url = await handleFileUpload(file, 'private');
                                    if (url) setSessionThumbnail(url);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        <label className="flex items-center gap-4 p-4 bg-black border border-brand-border rounded-xl cursor-pointer hover:border-brand-primary/30 transition-all group">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded accent-brand-primary" 
                            checked={sessionIsExclusive}
                            onChange={(e) => setSessionIsExclusive(e.target.checked)}
                          />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-white tracking-widest">ექსკლუზივი</span>
                            <span className="text-[8px] font-bold text-zinc-600 uppercase">გამოჩნდება მთავარ ბანერზე</span>
                          </div>
                        </label>
                      </div>

                      {/* Right: Action and hidden settings */}
                      <div className="space-y-6 flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="p-4 bg-brand-primary/5 border border-brand-primary/10 rounded-2xl">
                             <p className="text-[10px] font-bold text-zinc-400 uppercase leading-relaxed">ინფორმაციის შევსების შემდეგ სესიის დასაწყებად დააჭირეთ ღილაკს. თქვენ მიიღებთ OBS-ში ჩასაწერ მონაცემებს.</p>
                          </div>
                          
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">VDS IP მისამართი <Settings size={10} /></label>
                             <input 
                               type="text" 
                               value={vdsIp}
                               onChange={(e) => setVdsIp(e.target.value)}
                               placeholder="მაგ: 5.83.153.142"
                               className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 text-xs font-mono text-zinc-500 focus:border-brand-primary/30 outline-none"
                             />
                          </div>
                        </div>

                        <button 
                          onClick={() => roomId && startStream(roomId)}
                          disabled={!team1 || !team2}
                          className="w-full py-6 bg-brand-primary text-white font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 shadow-[0_20px_40px_-15px_rgba(255,0,51,0.5)] disabled:opacity-30 disabled:grayscale disabled:hover:scale-100"
                        >
                          <Monitor size={22} /> 
                          <span className="text-sm uppercase tracking-widest">სესიის დაწყება</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid lg:grid-cols-2 gap-8">
                    {/* OBS Info */}
                    <div className="bento-card p-10 bg-brand-primary/5 border-brand-primary/30 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-black uppercase text-white">OBS მონაცემები</h3>
                          <button 
                            onClick={() => setShowSessionDetails(false)}
                            className="text-[10px] font-black uppercase text-brand-primary hover:underline"
                          >
                            შეცვლა / დაბრუნება
                          </button>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase">ეს მონაცემები ჩაწერეთ OBS-ში (Settings - Stream)</p>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">SERVER URL</label>
                          <div className="flex bg-black border border-brand-border rounded-xl overflow-hidden">
                            <code className="flex-1 p-4 font-mono text-xs text-brand-primary truncate">rtmp://{vdsIp || 'VDS_IP'}/live</code>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(`rtmp://${vdsIp}/live`);
                                setCopiedUrl(true);
                                setTimeout(() => setCopiedUrl(false), 2000);
                              }}
                              className="px-4 border-l border-brand-border hover:bg-zinc-900 transition-colors"
                            >
                              {copiedUrl ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-zinc-500" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">STREAM KEY</label>
                          <div className="flex bg-black border border-brand-border rounded-xl overflow-hidden">
                            <code className="flex-1 p-4 font-mono text-xs text-brand-primary truncate">{streamKey}</code>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(streamKey);
                                setCopiedKey(true);
                                setTimeout(() => setCopiedKey(false), 2000);
                              }}
                              className="px-4 border-l border-brand-border hover:bg-zinc-900 transition-colors"
                            >
                              {copiedKey ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-zinc-500" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 p-6 bg-zinc-900/50 rounded-xl border border-white/5 space-y-4">
                        <div className="flex items-center gap-3">
                          <Settings size={14} className="text-brand-primary" />
                          <span className="text-[10px] font-black uppercase text-zinc-300">VDS-ის კონფიგურაცია (Nginx):</span>
                        </div>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase leading-relaxed">თუ OBS არ უკავშირდება, დარწმუნდით რომ Nginx-ში გაქვთ ეს კონფიგურაცია:</p>
                        <pre className="bg-black p-3 rounded-lg text-[9px] font-mono text-brand-primary/70 leading-tight border border-white/5 overflow-x-auto">
{`rtmp {
    server {
        listen 1935;
        application live {
            live on;
            hls on;
            hls_path /var/www/html/hls;
        }
    }
}`}
                        </pre>
                        <p className="text-[8px] text-zinc-600 font-bold uppercase">და დააინსტალირეთ: <code className="text-zinc-400">sudo apt install libnginx-mod-rtmp</code></p>
                      </div>
                    </div>

                    {/* Preview Player */}
                    <div className="bento-card bg-black border-zinc-800 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                      <div className="p-4 border-b border-white/5 flex items-center justify-between ">
                        <div className="flex items-center gap-3">
                           <div className="p-1.5 bg-brand-primary/10 rounded">
                              <Monitor size={12} className="text-brand-primary" />
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Live Preview</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-zinc-800" id="preview-status-dot" />
                           <span className="text-[9px] font-black uppercase text-zinc-600">Waiting for source</span>
                        </div>
                      </div>
                      <div className="flex-1 min-h-[300px] relative bg-zinc-950 flex items-center justify-center">
                        {streamUrl ? (
                          <HLSPlayer 
                            url={streamUrl} 
                            className="w-full h-full object-contain"
                            autoPlay={true}
                            controls={true}
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-4 text-center p-8">
                             <Loader2 size={32} className="text-zinc-800 animate-spin" />
                             <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em]">სტრიმის მისამართი მზადდება...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <section className="space-y-6">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">სწრაფი წვდომა სტრიმებზე</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {streams.map((event) => (
                    <div key={event.id} className="p-6 bento-card bg-zinc-900/40 flex items-center justify-between group hover:border-brand-primary/30 transition-colors">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl border border-brand-border overflow-hidden rotate-[-2deg] group-hover:rotate-0 transition-transform duration-500 bg-brand-surface">
                          {event.thumbnail ? (
                            <img src={event.thumbnail} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="text-brand-primary/20" size={24} />
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-black text-xl tracking-tight leading-tight mb-1">{event.title}</h4>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            {event.sport} • {event.is_live ? <span className="text-brand-primary animate-pulse">LIVE NOW</span> : new Date(event.start_time).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => startStream(event.room_name)}
                          className="px-6 py-3 bg-brand-surface border border-brand-border hover:bg-brand-primary hover:border-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                        >
                          ჩართვა (CONTROL)
                        </button>
                        <button 
                          onClick={() => deleteItem('events', event.id)}
                          className="p-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-500 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
                  <div className="flex gap-2">
                    <input 
                      placeholder="სურათის URL" 
                      value={newStream.thumbnail}
                      onChange={(e) => setNewStream({ ...newStream, thumbnail: e.target.value })}
                      className="flex-1 bg-black border border-brand-border p-3 rounded-xl outline-none focus:border-brand-primary" 
                    />
                    <label className="cursor-pointer bg-brand-surface border border-brand-border p-3 rounded-xl hover:bg-brand-surface-light transition-colors flex items-center justify-center min-w-[50px]">
                      {uploading === 'stream-thumbs' ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = await handleFileUpload(file, 'private'); // Match folder in policy
                            if (url) setNewStream({ ...newStream, thumbnail: url });
                          }
                        }}
                      />
                    </label>
                  </div>
                  <label className="flex items-center gap-3 px-4 py-2 bg-brand-surface border border-brand-border rounded-xl cursor-pointer hover:bg-brand-surface-light group">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded accent-brand-primary" 
                      checked={newStream.is_exclusive}
                      onChange={(e) => setNewStream({ ...newStream, is_exclusive: e.target.checked })}
                    />
                    <span className="text-[10px] font-black uppercase text-zinc-400 group-hover:text-white transition-colors">ექსკლუზივი (Hero Banner)</span>
                  </label>
                </div>
                <button onClick={addStream} className="w-full bg-brand-primary py-4 rounded-xl font-black uppercase text-xs tracking-widest">დამატება</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {streams.map((s) => (
                  <div key={s.id} className="p-4 bento-card bg-zinc-900/40 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {s.thumbnail ? (
                        <img src={s.thumbnail} className="w-12 h-12 object-cover rounded-lg" alt="" />
                      ) : (
                        <div className="w-12 h-12 bg-black border border-brand-border rounded-lg flex items-center justify-center">
                          <Play size={16} className="text-zinc-700" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold">{s.title}</h4>
                        <p className="text-[10px] text-zinc-500 uppercase">{s.sport}</p>
                      </div>
                    </div>
                    <button onClick={() => deleteItem('events', s.id)} className="text-zinc-600 hover:text-red-500">
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
                  <div className="flex gap-2">
                    <input 
                      placeholder="სურათის URL" 
                      value={newHighlight.thumbnail}
                      onChange={(e) => setNewHighlight({ ...newHighlight, thumbnail: e.target.value })}
                      className="flex-1 bg-black border border-brand-border p-3 rounded-xl outline-none focus:border-brand-primary" 
                    />
                    <label className="cursor-pointer bg-brand-surface border border-brand-border p-3 rounded-xl hover:bg-brand-surface-light transition-colors flex items-center justify-center min-w-[50px]">
                      {uploading === 'highlight-thumbs' ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = await handleFileUpload(file, 'private'); // Use private folder to match policy
                            if (url) setNewHighlight({ ...newHighlight, thumbnail: url });
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
                <button onClick={addHighlight} className="w-full bg-brand-primary py-4 rounded-xl font-black uppercase text-xs tracking-widest">დამატება</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {highlights.map((h) => (
                  <div key={h.id} className="p-4 bento-card bg-zinc-900/40 space-y-4">
                    <img src={h.thumbnail} className="w-full aspect-video object-cover rounded-lg" alt="" />
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-sm truncate pr-4">{h.title}</h4>
                      <button onClick={() => deleteItem('highlights', h.id)} className="text-zinc-600 hover:text-red-500 shrink-0">
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
                  <Calendar size={20} /> ლაივის დაგეგმვა (მატჩის განრიგი)
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">პირველი გუნდი</label>
                    <input 
                      placeholder="მაგ: რეალ მადრიდი" 
                      value={newSchedule.team1}
                      onChange={(e) => setNewSchedule({ ...newSchedule, team1: e.target.value })}
                      className="w-full bg-black border border-brand-border p-3 rounded-xl outline-none focus:border-brand-primary" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">მეორე გუნდი</label>
                    <input 
                      placeholder="მაგ: ბარსელონა" 
                      value={newSchedule.team2}
                      onChange={(e) => setNewSchedule({ ...newSchedule, team2: e.target.value })}
                      className="w-full bg-black border border-brand-border p-3 rounded-xl outline-none focus:border-brand-primary" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">დაწყების დრო</label>
                    <input 
                      type="datetime-local"
                      value={newSchedule.time}
                      onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                      className="w-full bg-black border border-brand-border p-3 rounded-xl outline-none focus:border-brand-primary text-white" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">სპორტის სახეობა</label>
                    <input 
                      placeholder="მაგ: ფეხბურთი" 
                      value={newSchedule.sport}
                      onChange={(e) => setNewSchedule({ ...newSchedule, sport: e.target.value })}
                      className="w-full bg-black border border-brand-border p-3 rounded-xl outline-none focus:border-brand-primary" 
                    />
                  </div>
                  <div className="space-y-2 lg:col-span-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">POSTER (URL ან ატვირთვა)</label>
                    <div className="flex gap-2">
                      <input 
                        placeholder="https://images.unsplash.com/..." 
                        value={newSchedule.thumbnail}
                        onChange={(e) => setNewSchedule({ ...newSchedule, thumbnail: e.target.value })}
                        className="flex-1 bg-black border border-brand-border p-3 rounded-xl outline-none focus:border-brand-primary" 
                      />
                      <label className="cursor-pointer bg-brand-surface border border-brand-border p-3 rounded-xl hover:bg-brand-surface-light transition-colors flex items-center justify-center min-w-[50px]">
                        {uploading === 'schedule-thumbs' ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = await handleFileUpload(file, 'private');
                              if (url) setNewSchedule({ ...newSchedule, thumbnail: url });
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <label className="flex items-center gap-3 px-4 py-2 bg-brand-surface border border-brand-border rounded-xl cursor-pointer hover:bg-brand-surface-light group lg:col-span-2">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded accent-brand-primary" 
                      checked={newSchedule.is_exclusive}
                      onChange={(e) => setNewSchedule({ ...newSchedule, is_exclusive: e.target.checked })}
                    />
                    <span className="text-[10px] font-black uppercase text-zinc-400 group-hover:text-white transition-colors">ექსკლუზივი (Hero Banner)</span>
                  </label>
                </div>
                <button onClick={addSchedule} className="w-full bg-brand-primary py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:scale-[1.01] transition-transform">სისტემაში დამატება</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {schedule.map((sc) => (
                  <div key={sc.id} className="p-4 bento-card bg-zinc-900/40 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      {sc.thumbnail && <img src={sc.thumbnail} className="w-16 h-10 object-cover rounded-lg border border-white/5" alt="" />}
                      <div>
                        <h4 className="font-black italic uppercase tracking-tighter">{sc.team1} <span className="text-brand-primary">VS</span> {sc.team2}</h4>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                          {sc.sport} • {new Date(sc.time).toLocaleString('ka-GE', { 
                            day: 'numeric', 
                            month: 'long', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => deleteItem('schedule', sc.id)} className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                      <Trash2 size={18} />
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

