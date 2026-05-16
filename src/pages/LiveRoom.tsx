import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Loader2, ArrowLeft, Play, Pause, Maximize, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '../lib/supabase';
import HLSPlayer from '../components/HLSPlayer';

function ViewerStream({ 
  streamUrl, 
  isGlobalPaused 
}: { 
  streamUrl: string;
  isGlobalPaused: boolean;
}) {
  const [isPaused, setIsPaused] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const effectivePaused = isPaused || isGlobalPaused;

  return (
    <div ref={containerRef} className="relative h-full w-full group overflow-hidden bg-black">
      {streamUrl ? (
        <HLSPlayer 
          url={streamUrl}
          autoPlay={!effectivePaused}
          className={cn(
            "h-full w-full object-contain transition-all duration-300",
            effectivePaused ? 'opacity-40 grayscale blur-sm' : ''
          )}
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center text-zinc-500 font-black uppercase tracking-widest bg-zinc-950 px-8 text-center leading-relaxed">
          საკუთარი VDS სტრიმის URL არ არის მითითებული ან სტრიმი არ არის აქტიური...
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

      <div className={cn(
        "absolute inset-x-0 bottom-0 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center justify-between transition-opacity z-30",
        effectivePaused ? "opacity-100" : "opacity-0 group-hover:opacity-100"
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
          
          <div className="hidden xs:flex items-center gap-3 ml-2 sm:ml-6 bg-black/40 p-2 px-3 sm:px-4 rounded-lg sm:rounded-xl border border-white/5 backdrop-blur-md">
             <button 
              onClick={() => setIsMuted(!isMuted)}
              className="text-white hover:text-brand-primary transition-colors"
             >
               {isMuted || volume === 0 ? <VolumeX size={16} sm:size={18} /> : <Volume2 size={16} sm:size={18} />}
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
              className="w-16 sm:w-24 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-primary"
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isGlobalPaused, setIsGlobalPaused] = useState(false);

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
          .select('stream_url')
          .eq('room_name', roomId)
          .maybeSingle();
        
        if (error) throw error;
        if (data?.stream_url) {
          setStreamUrl(data.stream_url);
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

    return () => {
      supabase.removeChannel(channel);
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

      <div className="max-w-[1600px] mx-auto gap-6 sm:grid sm:grid-cols-12 overflow-hidden h-auto sm:h-[calc(100vh-10rem)]">
        {/* Main Stream Area */}
        <div className="col-span-12 lg:col-span-9 flex flex-col gap-4 sm:gap-6 h-full overflow-hidden">
          <div className="aspect-video sm:flex-1 bg-brand-surface rounded-2xl sm:rounded-[2.5rem] overflow-hidden border border-brand-border relative group shadow-2xl">
            <ViewerStream streamUrl={streamUrl} isGlobalPaused={isGlobalPaused} />
            
            {/* Custom Overlay */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex gap-2 sm:gap-3 pointer-events-none">
              <div className="bg-red-600 text-white px-2 sm:px-3 py-1 rounded-md text-[8px] sm:text-[10px] font-black flex items-center gap-1.5 sm:gap-2 uppercase">
                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full animate-pulse"></span> 
                პირდაპირი
              </div>
              <div className="bg-black/60 backdrop-blur-md px-2 sm:px-3 py-1 rounded-md text-[8px] sm:text-[10px] font-black uppercase tracking-widest hidden xs:block text-zinc-300">
                4K • 60 FPS
              </div>
            </div>
            
            <div className="absolute bottom-16 sm:bottom-8 right-4 sm:right-8 z-20 flex items-center gap-3 sm:gap-4 text-[9px] sm:text-xs font-black bg-black/40 backdrop-blur-md p-1.5 sm:p-2 px-3 sm:px-4 rounded-lg sm:rounded-xl border border-white/10 pointer-events-none">
              <div className="text-zinc-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-brand-primary" />
                124.5K
              </div>
              <div className="h-3 sm:h-4 w-[1px] bg-white/20" />
              <div className="text-brand-primary uppercase tracking-widest">LIVE</div>
            </div>
          </div>
          
          <div className="bento-card p-6 sm:p-8 bg-zinc-900/40">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 sm:gap-0">
              <div>
                <h1 className="text-xl sm:text-4xl font-black mb-2 uppercase tracking-tighter italic">
                  უყურებთ: <span className="text-brand-primary">{roomId?.replace(/-/g, ' ')}</span>
                </h1>
                <p className="text-zinc-500 font-bold uppercase text-[9px] sm:text-[10px] tracking-[0.2em]">სესიის ID: {roomId}-prod-01</p>
              </div>
              <button 
                onClick={() => navigate('/')}
                className="w-full sm:w-auto px-6 py-3 bg-brand-surface border border-brand-border rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-brand-surface-light transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft size={14} /> სტრიმიდან გამოსვლა
              </button>
            </div>
          </div>
        </div>

        {/* Chat Side Panel */}
        <aside className="hidden lg:flex col-span-3 bento-card flex-col overflow-hidden h-full bg-zinc-900/40">
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
