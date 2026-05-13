import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  LiveKitRoom, 
  VideoConference,
  ControlBar,
  useLocalParticipant,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Loader2, ArrowLeft, Monitor, Mic, Camera, StopCircle, Share2, Terminal } from 'lucide-react';

import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

function TrackEnhancer() {
  const { localParticipant } = useLocalParticipant();

  useEffect(() => {
    const handleTrackPublished = (publication: any) => {
      if ((publication.source === 'screen_share' || publication.source === 'camera') && publication.track) {
        if (publication.track.mediaStreamTrack) {
          // @ts-ignore
          publication.track.mediaStreamTrack.contentHint = 'motion';
          console.log(`Set contentHint to motion for ${publication.source}`);
        }
      }
    };

    localParticipant.on('trackPublished', handleTrackPublished);
    
    // Check existing tracks
    localParticipant.trackPublications.forEach((p) => {
      if ((p.source === 'screen_share' || p.source === 'camera') && p.track) {
        if (p.track.mediaStreamTrack) {
          // @ts-ignore
          p.track.mediaStreamTrack.contentHint = 'motion';
        }
      }
    });

    return () => {
      localParticipant.off('trackPublished', handleTrackPublished);
    };
  }, [localParticipant]);

  return null;
}

export default function BroadcasterRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [token, setToken] = useState<string>('');
  const [obsToken, setObsToken] = useState<string>('');
  const [obsIdentity, setObsIdentity] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isObsMenuOpen, setIsObsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'whip' | 'rtmp' | 'virtual'>('virtual');
  const [ingressData, setIngressData] = useState<any>(null);
  const [isGeneratingIngress, setIsGeneratingIngress] = useState(false);
  const [ingressError, setIngressError] = useState<string>('');

  const generateIngress = async () => {
    if (ingressData || isGeneratingIngress) return;
    setIsGeneratingIngress(true);
    setIngressError('');
    try {
      const resp = await fetch('/api/create-ingress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName: roomId }),
      });
      const data = await resp.json();
      if (data.error) {
        setIngressError(data.details || data.error);
        throw new Error(data.error);
      }
      setIngressData(data);
    } catch (e: any) {
      console.error(e);
      setIngressError(e.message || 'Failed to initialize RTMP');
    } finally {
      setIsGeneratingIngress(false);
    }
  };

  const endStream = async () => {
    try {
      await supabase.from('active_streams').update({ is_active: false }).eq('id', 'global-stream');
    } catch (e) {
      console.error('Failed to end stream:', e);
    }
  };

  useEffect(() => {
    if (!roomId) return;

    const fetchTokens = async () => {
      try {
        // Browser token
        const participantName = `admin-${Math.floor(Math.random() * 1000)}`;
        const resp = await fetch(`/api/get-token?roomName=${roomId}&participantName=${participantName}`);
        const data = await resp.json();
        if (data.error) throw new Error(data.error);
        setToken(data.token);

        // OBS token (separate identity)
        const newObsIdentity = `obs-${Math.floor(Math.random() * 100000)}`;
        setObsIdentity(newObsIdentity);
        const obsResp = await fetch(`/api/get-token?roomName=${roomId}&participantName=${newObsIdentity}`);
        const obsData = await obsResp.json();
        if (obsData.error) throw new Error(obsData.error);
        setObsToken(obsData.token);
      } catch (e) {
        console.error(e);
        setError('Failed to load broadcast session.');
      }
    };

    fetchTokens();

    return () => {
      endStream();
    };
  }, [roomId]);

  const getWhipUrl = () => {
    const base = import.meta.env.VITE_LIVEKIT_URL || '';
    let protocol = base.startsWith('ws') 
      ? base.replace('wss://', 'https://').replace('ws://', 'http://') 
      : (base.includes('://') ? base : `https://${base}`);
    
    // Most LiveKit versions expect just the /whip endpoint
    // The token itself contains the room and identity info
    const cleanBase = protocol.split('?')[0].replace(/\/$/, '');
    return `${cleanBase}/whip`;
  };

  const whipUrl = getWhipUrl();

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={() => navigate('/admin')} className="text-brand-primary underline">Back to Admin</button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-brand-primary mx-auto" size={40} />
          <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Preparing Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black pt-32 pb-12 px-6">
      <style>{`
        /* Hide participant list/tiles in Broadcaster Studio */
        .broadcaster-mode .lk-participant-list,
        .broadcaster-mode .lk-sidebar {
          display: none !important;
        }
        
        .broadcaster-mode .lk-video-conference-inner {
          flex-direction: column !important;
        }
      `}</style>
      <div className="max-w-[1600px] mx-auto flex flex-col h-[calc(100vh-10rem)]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin')}
              className="p-3 bg-brand-surface border border-brand-border rounded-xl text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-black italic uppercase tracking-tighter">
                STUDIO: <span className="text-brand-primary">{roomId}</span>
              </h1>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Administrator Broadcast Mode</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
              onClick={() => setIsObsMenuOpen(!isObsMenuOpen)}
              className="bg-brand-surface border border-brand-border px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand-border transition-all"
             >
               <Terminal size={16} className="text-brand-primary" />
               OBS Setup
             </button>
             <div className="bg-red-600 text-white px-3 py-1 rounded-md text-[10px] font-black flex items-center gap-2 uppercase">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> 
                ON AIR
              </div>
          </div>
        </div>

        {isObsMenuOpen && (
          <div className="mb-6 bento-card p-6 bg-brand-primary/10 border-brand-primary/30 animate-in fade-in slide-in-from-top-4">
             <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-black uppercase text-brand-primary mb-2 italic">Stream via OBS (Recommended for 60 FPS)</h2>
                  <p className="text-xs text-zinc-400 max-w-2xl">
                    საუკეთესო ხარისხის და 60 FPS-ის მისაღებად გამოიყენეთ OBS.
                  </p>
                </div>
                <button onClick={() => setIsObsMenuOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <StopCircle size={24} className="rotate-45" />
                </button>
             </div>

             <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
               <button 
                onClick={() => setActiveTab('virtual')}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  activeTab === 'virtual' ? "bg-brand-primary text-black" : "bg-white/5 text-zinc-400 hover:bg-white/10"
                )}
               >
                 Virtual Camera (Easiest)
               </button>
               <button 
                onClick={() => setActiveTab('whip')}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px) font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  activeTab === 'whip' ? "bg-brand-primary text-black" : "bg-white/5 text-zinc-400 hover:bg-white/10"
                )}
               >
                 WHIP (Direct)
               </button>
               <button 
                onClick={() => {
                  setActiveTab('rtmp');
                  generateIngress();
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  activeTab === 'rtmp' ? "bg-brand-primary text-black" : "bg-white/5 text-zinc-400 hover:bg-white/10"
                )}
               >
                 RTMP (Legacy)
               </button>
             </div>

             {activeTab === 'virtual' && (
               <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                 <div className="bg-black/40 p-5 rounded-xl border border-white/5">
                   <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                     <Camera size={18} className="text-brand-primary" />
                     როგორ გამოვიყენოთ Virtual Camera (რეკომენდებულია)
                   </h3>
                   <ol className="text-xs text-zinc-400 space-y-3 list-decimal pl-4 leading-relaxed">
                     <li>გახსენით <b>OBS</b> და გაამზადეთ სცენა.</li>
                     <li>დააჭირეთ ღილაკს <b>"Start Virtual Camera"</b> (OBS-ის მარჯვენა ქვედა კუთხეში).</li>
                     <li>ამ გვერდზე (ბრაუზერში), დააჭირეთ ქვემოთ <b>Camera</b> ღილაკს.</li>
                     <li>აირჩიეთ <b>"OBS Virtual Camera"</b>.</li>
                     <li><b>მზად არის!</b> ბრაუზერი პირდაპირ OBS-იდან აიღებს მაღალი ხარისხის გამოსახულებას.</li>
                   </ol>
                 </div>
                 <p className="text-[10px] text-zinc-500 italic">
                   * ეს მეთოდი ყველაზე სტაბილურია და არ საჭიროებს სერვერის რთულ კონფიგურაციებს.
                 </p>
               </div>
             )}

             {activeTab === 'whip' && (
               <div className="animate-in fade-in zoom-in-95 duration-200">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-zinc-500 uppercase">Server URL (WHIP)</label>
                     <div className="bg-black/40 p-3 rounded-lg border border-white/5 font-mono text-[11px] truncate select-all">
                       {whipUrl}
                     </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-zinc-500 uppercase">Stream Key (Bearer Token)</label>
                     <div className="bg-black/40 p-3 rounded-lg border border-white/5 font-mono text-[11px] truncate select-all">
                       {obsToken}
                     </div>
                   </div>
                 </div>

                 <div className="mt-4 p-4 bg-black/40 rounded-lg border border-white/10 space-y-3">
                   <h3 className="text-[10px] font-black uppercase text-brand-primary tracking-widest">OBS Settings for WHIP:</h3>
                   <ul className="text-[10px] text-zinc-400 space-y-1.5 list-disc pl-4">
                     <li><b>Service:</b> WHIP</li>
                     <li><b>Output Mode:</b> Advanced</li>
                     <li><b>Rate Control:</b> CBR (Bitrate: 4000-6000 Kbps)</li>
                     <li><b>Keyframe Interval:</b> 1s or 2s (Mandatory)</li>
                     <li><b>Tune:</b> zerolatency</li>
                   </ul>
                   <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-[9px] text-red-200/80 leading-relaxed">
                     <b>შენიშვნა:</b> თუ WHIP კავშირი მაინც ვერ ხერხდება, გამოიყენეთ <b>Virtual Camera</b> მეთოდი (პირველი ტაბი).
                   </div>
                 </div>
               </div>
             )}

             {activeTab === 'rtmp' && (
               <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                 {isGeneratingIngress ? (
                   <div className="py-8 flex flex-col items-center justify-center gap-3">
                     <Loader2 className="animate-spin text-brand-primary" size={24} />
                     <p className="text-[10px] font-black uppercase text-zinc-500">Generating RTMP Endpoint...</p>
                   </div>
                 ) : ingressData ? (
                   <>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <label className="text-[10px] font-bold text-zinc-500 uppercase">RTMP URL</label>
                         <div className="bg-black/40 p-3 rounded-lg border border-white/5 font-mono text-[11px] truncate select-all">
                           {ingressData.url}
                         </div>
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-bold text-zinc-500 uppercase">Stream Key</label>
                         <div className="bg-black/40 p-3 rounded-lg border border-white/5 font-mono text-[11px] truncate select-all">
                           {ingressData.streamKey}
                         </div>
                       </div>
                     </div>
                     <div className="mt-4 p-4 bg-black/40 rounded-lg border border-white/10 space-y-3">
                        <h3 className="text-[10px] font-black uppercase text-brand-primary tracking-widest">OBS Settings for RTMP:</h3>
                        <p className="text-[10px] text-zinc-400">
                          Settings {'>'} Stream {'>'} Service: <b>Custom...</b> {'>'} Server: [RTMP URL] {'>'} Stream Key: [Stream Key]
                        </p>
                      </div>
                   </>
                 ) : (
                   <div className="py-8 text-center bg-red-500/5 rounded-xl border border-red-500/10">
                     <p className="text-xs text-red-400 mb-2 font-bold uppercase tracking-wider italic">RTMP ERROR</p>
                     <p className="text-[10px] text-zinc-500 mb-4 px-6">{ingressError || "RTMP Ingress not available."}</p>
                     <button 
                      onClick={generateIngress}
                      className="bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all"
                     >
                       Try Again
                     </button>
                   </div>
                 )}
               </div>
             )}
          </div>
        )}

        <div className="flex-1 bento-card relative bg-black shadow-2xl">
          <LiveKitRoom
            video={false}
            audio={false}
            token={token}
            serverUrl={import.meta.env.VITE_LIVEKIT_URL}
            videoCaptureDefaults={{
              resolution: { width: 1920, height: 1080 },
              frameRate: 60,
            }}
            screenShareCaptureDefaults={{
              resolution: { width: 1920, height: 1080 },
              frameRate: 60,
            }}
            publishDefaults={{
              videoSimulcast: true,
              screenShareSimulcast: false, // Disable simulcast for screen sharing to prioritize pure quality
              videoCodec: 'h264',
              dtlsRetransmissions: true,
              stopMicTrackOnMute: true,
              red: true,
              screenShareEncoding: {
                maxBitrate: 3_000_000, // 3 Mbps for screen sharing
                maxFramerate: 60,
              }
            }}
            onDisconnected={() => navigate('/admin')}
            data-lk-theme="default"
            className="h-full broadcaster-mode"
          >
            <TrackEnhancer />
            <VideoConference />
            {/* The default VideoConference UI includes a Screen Share button in its ControlBar */}
          </LiveKitRoom>
        </div>
        
        <div className="mt-6 bento-card p-6 bg-yellow-500/10 border-yellow-500/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500 rounded-xl text-black">
              <Monitor size={24} />
            </div>
            <div>
              <h3 className="font-black uppercase text-sm tracking-tight text-yellow-500">Broadcaster Tip</h3>
              <p className="text-xs text-zinc-400">ეკრანის გასაზიარებლად გამოიყენეთ <b>"Share Screen"</b> ღილაკი ვიდეო პანელზე. საუკეთესო ხარისხისთვის დარწმუნდით, რომ გაქვთ სტაბილური ინტერნეტ კავშირი.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
