import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Loader2, ArrowLeft, Play, Pause, Maximize, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '../lib/supabase';
import HLSPlayer from '../components/HLSPlayer';

function ViewerStream({ 
  streamUrl, 
  isGlobalPaused,
  volume,
  isMuted,
  setVolume,
  setIsMuted,
  viewerCount = 1,
}: { 
  streamUrl: string;
  isGlobalPaused: boolean;
  volume: number;
  isMuted: boolean;
  setVolume: (v: number) => void;
  setIsMuted: (m: boolean) => void;
  roomId?: string;
  vdsIp?: string;
  viewerCount?: number;
}) {
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const activityTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const formatViewerCount = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toLocaleString();
  };

  const resetActivityTimer = () => {
    setOverlayVisible(true);
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    if (isFullscreen) {
      activityTimeoutRef.current = setTimeout(() => {
        setOverlayVisible(false);
      }, 3000); // 3 seconds timeout
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!isFullscreen) {
      setOverlayVisible(true);
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    } else {
      resetActivityTimer();
    }
    return () => {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [isFullscreen]);

  const effectivePaused = isPaused || isGlobalPaused;

  return (
    <div 
      ref={containerRef} 
      onClick={resetActivityTimer}
      onMouseMove={resetActivityTimer}
      onTouchStart={resetActivityTimer}
      className="relative h-full w-full group overflow-hidden bg-black"
    >
      {streamUrl && streamUrl.endsWith('.m3u8') ? (
        <HLSPlayer 
          url={streamUrl}
          autoPlay={!effectivePaused}
          controls={false}
          muted={isMuted}
          volume={volume}
          className={cn(
            "h-full w-full object-contain transition-all duration-300",
            effectivePaused ? 'opacity-40 grayscale blur-sm' : ''
          )}
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center text-zinc-500 font-black uppercase tracking-widest bg-zinc-950 px-8 text-center leading-relaxed">
          სტრიმი არ არის აქტიური ან URL არასწორია...
        </div>
      )}
      
      {effectivePaused && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center animate-pulse border border-white/20">
              <Pause size={40} className="text-white ml-1" fill="white" />
            </div>
            {isGlobalPaused && (
              <span className="text-[10px] font-black uppercase text-brand-primary tracking-[0.3em] bg-black/40 px-4 py-1 rounded-full border border-brand-primary/20 backdrop-blur-md">
                სტრიმერმა დააპაუზა
              </span>
            )}
          </div>
        </div>
      )}

      {/* Top Left: Custom Badge Overlay */}
      <div className={cn(
        "absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex gap-2 sm:gap-3 pointer-events-none transition-opacity duration-300",
        overlayVisible ? "opacity-100" : "opacity-0"
      )}>
        <div className="bg-red-600 text-white px-2 sm:px-3 py-1 rounded-md text-[8px] sm:text-[10px] font-black flex items-center gap-1.5 sm:gap-2 uppercase">
          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full animate-pulse"></span> 
          პირდაპირი
        </div>
        <div className="bg-black/60 backdrop-blur-md px-2 sm:px-3 py-1 rounded-md text-[8px] sm:text-[10px] font-black uppercase tracking-widest hidden xs:block text-zinc-300">
          4K • 60 FPS
        </div>
      </div>

      {/* Top Right: Real-time Viewer Count Overlay */}
      <div className={cn(
        "absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center gap-3 sm:gap-4 text-[9px] sm:text-xs font-black bg-black/40 backdrop-blur-md p-1.5 sm:p-2 px-3 sm:px-4 rounded-lg sm:rounded-xl border border-white/10 pointer-events-none transition-opacity duration-300",
        overlayVisible ? "opacity-100" : "opacity-0"
      )}>
        <div className="text-zinc-100 flex items-center gap-2">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-brand-primary animate-pulse" />
          {formatViewerCount(viewerCount)}
        </div>
        <div className="h-3 sm:h-4 w-[1px] bg-white/20" />
        <div className="text-brand-primary uppercase tracking-widest">LIVE</div>
      </div>

      <div className={cn(
        "absolute inset-x-0 bottom-0 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center justify-between transition-opacity z-30",
        effectivePaused 
          ? "opacity-100" 
          : isFullscreen 
            ? (overlayVisible ? "opacity-100" : "opacity-0 pointer-events-none") 
            : "opacity-0 group-hover:opacity-100"
      )}>
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={() => setIsPaused(!isPaused)}
            disabled={isGlobalPaused}
            className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border backdrop-blur-md flex items-center justify-center transition-all shadow-lg",
              isGlobalPaused 
                ? "bg-zinc-800/50 border-white/5 cursor-not-allowed opacity-50" 
                : "bg-brand-primary/20 border-brand-primary/30 hover:bg-brand-primary/40"
            )}
          >
            {effectivePaused ? <Play size={20} fill="white" className="ml-0.5 sm:ml-1" /> : <Pause size={20} fill="white" />}
          </button>
          
          <div className="flex flex-col">
            <span className="text-[8px] sm:text-[10px] font-black text-brand-primary uppercase tracking-widest">
              {effectivePaused ? (isGlobalPaused ? 'დაპაუზებულია ადმინის მიერ' : 'დაპაუზებულია') : 'ლაივი'}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-tighter">
              პირდაპირი სტრიმი VDS-იდან
            </span>
          </div>

          {isMuted && !effectivePaused && (
            <button 
              onClick={() => setIsMuted(false)}
              className="ml-2 sm:ml-4 px-3 py-1 bg-brand-primary text-black text-[8px] sm:text-[9px] font-black uppercase rounded animate-pulse hover:scale-105 transition-all"
            >
              ჩართეთ ხმა
            </button>
          )}
          
          <div className="flex items-center gap-2 sm:gap-3 ml-1 sm:ml-6 bg-black/40 p-2 px-2 sm:px-4 rounded-lg sm:rounded-xl border border-white/5 backdrop-blur-md">
             <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className={cn(
                "text-white hover:text-brand-primary transition-all p-1",
                isMuted ? "animate-bounce text-brand-primary" : ""
              )}
             >
               {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
             </button>
             <input 
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-12 sm:w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-primary"
             />
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={toggleFullscreen}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-zinc-800/40 border border-white/10 backdrop-blur-md flex items-center justify-center hover:bg-zinc-800 transition-all"
          >
            <Maximize size={18} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LiveRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [vdsIp, setVdsIp] = useState<string>('5.83.153.142');
  const [showSettings, setShowSettings] = useState(false);
  const [tempIp, setTempIp] = useState(vdsIp);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isGlobalPaused, setIsGlobalPaused] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(true);
  const [viewerCount, setViewerCount] = useState<number>(1);

  const formatViewerCount = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toLocaleString();
  };

  useEffect(() => {
    // Try to auto-detect domain
    if (window.location.hostname !== 'localhost' && !window.location.hostname.match(/^[0-9.]+$/)) {
      setVdsIp(window.location.hostname);
    }
  }, []);

  useEffect(() => {
    if (!roomId) return;

    const syncPauseState = async () => {
      try {
        const { data, error } = await supabase.from('active_streams').select('is_paused').eq('id', 'global-stream').maybeSingle();
        if (data) setIsGlobalPaused(!!data.is_paused);
      } catch (err: any) {
        console.error('Error syncing pause state:', err.message || err);
      }
    };

    const fetchStreamInfo = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('events')
          .select('stream_url, room_name')
          .eq('room_name', roomId)
          .maybeSingle();
        
        if (error) throw error;
        if (data) {
          let url = data.stream_url;
          if (url) {
            // Fix URL format if needed
            if (url.includes('/hls/') && !url.endsWith('.m3u8')) {
              url += '.m3u8';
            }
            
            // Smart URL translation: if we are on HTTPS and the URL is HTTP/IP, 
            // try to use the current domain or the saved VDS IP/Domain.
            const isPageHttps = window.location.protocol === 'https:';
            const savedVDS = localStorage.getItem('vds_ip') || vdsIp;
            
            if (isPageHttps && !url.startsWith('https://')) {
               const urlPath = url.split('/hls/')[1];
               if (urlPath) {
                 // Priority: 1. Current hostname (if not IP) 2. Saved VDS IP/Domain
                 const currentHost = window.location.hostname;
                 const bestHost = (currentHost && !currentHost.match(/^[0-9.]+$/)) ? currentHost : savedVDS;
                 url = `https://${bestHost}/hls/${urlPath}`;
               }
            }
            
            console.log("Final Stream URL:", url);
            setStreamUrl(url);
          }
          
          // Defaults or derived info
          if (!data.stream_url || !data.stream_url.endsWith('.m3u8')) {
            // Check for IP config
            const savedIp = localStorage.getItem('vds_ip') || '5.83.153.142';
            setVdsIp(savedIp);
          }
        }
      } catch (e: any) {
        console.error('Failed to fetch stream url:', e.message || e);
        // Default to a placeholder if needed, or error out
         setError('სტრიმის ინფორმაცია ვერ მოიძებნა ბაზაში.');
      } finally {
        setLoading(false);
      }
    };

    syncPauseState();
    fetchStreamInfo();

    const channel = supabase
      .channel('pause-sync')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'active_streams',
        filter: `id=eq.global-stream`
      }, (payload) => {
        setIsGlobalPaused(!!payload.new.is_paused);
      })
      .subscribe();

    const presenceChannel = supabase
      .channel(`room-presence-${roomId}`, {
        config: {
          presence: {
            key: 'viewer',
          },
        },
      })
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        let total = 0;
        Object.values(state).forEach((presences: any) => {
          total += presences.length;
        });
        setViewerCount(Math.max(1, total));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            online_at: new Date().toISOString(),
            session_id: Math.random().toString(36).substring(7),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(presenceChannel);
    };
  }, [roomId]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={() => navigate('/')} className="text-brand-cyan underline">მთავარზე დაბრუნება</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-brand-primary mx-auto" size={40} />
          <p className="text-xs font-black uppercase tracking-widest text-zinc-500">მზადდება...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black pt-20 sm:pt-32 pb-12 px-4 sm:px-6">
      <style>{`
        /* Hide participant list, control bar and sidebar for viewers */
        .viewer-mode .lk-control-bar,
        .viewer-mode .lk-participant-list,
        .viewer-mode .lk-sidebar,
        .viewer-mode .lk-settings-menu-modal,
        .viewer-mode .lk-participant-name,
        .viewer-mode .lk-participant-metadata,
        .viewer-mode .lk-audio-visualizer,
        .viewer-mode .lk-connection-quality,
        .viewer-mode .lk-participant-placeholder {
          display: none !important;
        }
        
        /* Make the main video area fill the space properly when parts are hidden */
        .viewer-mode .lk-video-conference-inner {
          flex-direction: column !important;
          background: transparent !important;
        }

        .viewer-mode .lk-grid-layout {
          padding: 0 !important;
          background: transparent !important;
        }

        .viewer-mode .lk-focus-layout {
          padding: 0 !important;
        }

        /* Ensure the video tile itself doesn't have a background or border that shows placeholders */
        .viewer-mode .lk-participant-tile {
          background: transparent !important;
          border: none !important;
        }
        
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="max-w-[1600px] mx-auto gap-6 flex flex-col lg:grid lg:grid-cols-12 overflow-visible lg:overflow-hidden h-auto lg:h-[calc(100vh-10rem)] pb-12 lg:pb-0">
        {/* Main Stream Area */}
        <div className="col-span-12 lg:col-span-9 flex flex-col gap-4 sm:gap-6 lg:h-full lg:overflow-y-auto no-scrollbar">
          <div className="aspect-video sm:flex-1 bg-brand-surface rounded-2xl sm:rounded-[2.5rem] overflow-hidden border border-brand-border relative group shadow-2xl">
            <ViewerStream 
              streamUrl={streamUrl} 
              isGlobalPaused={isGlobalPaused} 
              roomId={roomId} 
              vdsIp={vdsIp}
              volume={volume}
              isMuted={isMuted}
              setVolume={setVolume}
              setIsMuted={setIsMuted}
              viewerCount={viewerCount}
            />
          </div>
          
          <div className="bento-card p-6 sm:p-8 bg-zinc-900/40">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 sm:gap-0">
              <div>
                <h1 className="text-xl sm:text-4xl font-black mb-2 uppercase tracking-tighter italic">
                  უყურებთ: <span className="text-brand-primary">{roomId?.replace(/-/g, ' ')}</span>
                </h1>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => navigate('/')}
                  className="w-full sm:w-auto px-6 py-3 bg-brand-surface border border-brand-border rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-brand-surface-light transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={14} /> სტრიმიდან გამოსვლა
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-brand-surface border border-brand-border rounded-[2rem] p-8 max-w-md w-full shadow-2xl space-y-8">
              <div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">VDS სერვერის კონფიგურაცია</h3>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">მიუთითეთ თქვენი Nginx-RTMP სერვერის IP მისამართი</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-brand-primary">სერვერის IP (Nginx)</label>
                <input 
                  type="text" 
                  value={tempIp}
                  onChange={(e) => setTempIp(e.target.value)}
                  placeholder="მაგ: 5.83.153.142"
                  className="w-full bg-black/50 border border-brand-border rounded-xl px-4 py-3 text-sm font-bold focus:border-brand-primary outline-none transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-zinc-900 hover:bg-zinc-800 transition-colors"
                >
                  გაუქმება
                </button>
                <button 
                  onClick={() => {
                    setVdsIp(tempIp);
                    localStorage.setItem('vds_ip', tempIp);
                    setShowSettings(false);
                  }}
                  className="flex-1 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-brand-primary text-black hover:opacity-90 transition-opacity"
                >
                  შენახვა
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Side Panel */}
        <aside className="col-span-12 lg:col-span-3 bento-card flex flex-col overflow-hidden h-[380px] lg:h-full bg-zinc-900/40">
          <div className="p-6 border-b border-brand-border flex justify-between items-center bg-zinc-950/40">
            <h3 className="font-black uppercase text-[10px] tracking-widest text-zinc-400">ლაივ ჩატი</h3>
            <span className="text-[10px] text-brand-primary font-black animate-pulse">● სინქრონიზაცია</span>
          </div>
          
          <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
            {[
              { user: 'GEORGI', msg: 'What a golazo! 🔥', color: 'text-brand-primary' },
              { user: 'NINO', msg: 'Apex is carrying the stream tonight', color: 'text-brand-secondary' },
              { user: 'SANDRO', msg: 'Lakers looking strong in the warmup', color: 'text-orange-400' },
              { user: 'DAVID', msg: 'Is the 4K feed working for everyone?', color: 'text-blue-400' },
            ].map((chat, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 shrink-0" />
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${chat.color}`}>{chat.user}</p>
                  <p className="text-xs text-zinc-300 leading-relaxed font-medium">{chat.msg}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-zinc-950/40 border-t border-brand-border">
            <div className="bg-brand-surface p-4 rounded-2xl text-[10px] text-zinc-500 flex justify-between items-center font-bold uppercase tracking-widest border border-brand-border cursor-text hover:border-brand-primary/50 transition-colors">
              დაწერეთ შეტყობინება...
              <Play size={12} className="rotate-[-45deg] text-brand-primary" fill="currentColor" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
