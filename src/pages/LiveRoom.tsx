import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  LiveKitRoom, 
  VideoConference,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  VideoTrack,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { cn } from '../lib/utils';
import '@livekit/components-styles';
import { Loader2, ArrowLeft, Play, Pause, Maximize } from 'lucide-react';

function ViewerStream() {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const activeTrack = tracks.find(t => t.source === Track.Source.ScreenShare) || tracks.find(t => t.source === Track.Source.Camera);

  return (
    <div ref={containerRef} className="relative h-full w-full group overflow-hidden bg-black">
      {activeTrack ? (
        <VideoTrack 
          trackRef={activeTrack} 
          className={cn(
            "h-full w-full object-contain transition-all duration-300",
            isPaused ? 'opacity-40 grayscale blur-sm' : ''
          )} 
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center text-zinc-500 font-black uppercase tracking-widest bg-zinc-950">
          Waiting for stream...
        </div>
      )}

      {/* Audio is rendered globally, we can't easily mute individual tracks here without more complex logic, 
          but as a viewer with only one stream, it works well enough to just use RoomAudioRenderer.
          Actually, for a real pause, we'd want to stop track subscription or mute the element. */}
      
      {isPaused && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center animate-pulse border border-white/20">
            <Pause size={40} className="text-white ml-1" fill="white" />
          </div>
        </div>
      )}

      {/* Control Overlay */}
      <div className={cn(
        "absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center justify-between transition-opacity z-30",
        isPaused ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="w-12 h-12 rounded-2xl bg-brand-primary/20 border border-brand-primary/30 backdrop-blur-md flex items-center justify-center hover:bg-brand-primary/40 transition-all shadow-lg"
          >
            {isPaused ? <Play size={24} fill="white" className="ml-1" /> : <Pause size={24} fill="white" />}
          </button>
          
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">
              {isPaused ? 'PAUSED' : 'LIVE'}
            </span>
            <span className="text-xs font-bold text-white uppercase tracking-tighter">
              {activeTrack?.source === Track.Source.ScreenShare ? 'Screen Share' : 'Camera Feed'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleFullscreen}
            className="w-12 h-12 rounded-2xl bg-zinc-800/40 border border-white/10 backdrop-blur-md flex items-center justify-center hover:bg-zinc-800 transition-all"
          >
            <Maximize size={20} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LiveRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [token, setToken] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!roomId) return;

    const fetchToken = async () => {
      try {
        const participantName = `viewer-${Math.floor(Math.random() * 10000)}`;
        const resp = await fetch(`/api/get-token?roomName=${roomId}&participantName=${participantName}`);
        const data = await resp.json();
        
        if (data.error) throw new Error(data.error);
        setToken(data.token);
      } catch (e) {
        console.error(e);
        setError('Failed to load stream. Please make sure the backend is running and LiveKit is configured.');
      }
    };

    fetchToken();
  }, [roomId]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={() => navigate('/')} className="text-brand-cyan underline">Back Home</button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-cyan" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black pt-32 pb-12 px-6">
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
      `}</style>

      <div className="max-w-[1600px] mx-auto gap-6 grid grid-cols-12 overflow-hidden h-[calc(100vh-10rem)]">
        {/* Main Stream Area */}
        <div className="col-span-12 lg:col-span-9 flex flex-col gap-6 h-full overflow-hidden">
          <div className="flex-1 bg-brand-surface rounded-[2.5rem] overflow-hidden border border-brand-border relative group shadow-2xl">
            <LiveKitRoom
              video={false}
              audio={false}
              token={token}
              serverUrl={import.meta.env.VITE_LIVEKIT_URL}
              onDisconnected={() => navigate('/')}
              adaptiveStream={true}
              data-lk-theme="default"
              className="h-full w-full viewer-mode"
            >
              <ViewerStream />
              <RoomAudioRenderer />
            </LiveKitRoom>
            
            {/* Custom Overlay */}
            <div className="absolute top-6 left-6 z-20 flex gap-3 pointer-events-none">
              <div className="bg-red-600 text-white px-3 py-1 rounded-md text-[10px] font-black flex items-center gap-2 uppercase">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> 
                LIVE BROADCAST
              </div>
              <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                4K • 60 FPS
              </div>
            </div>
            
            <div className="absolute bottom-8 right-8 z-20 flex items-center gap-4 text-xs font-black bg-black/40 backdrop-blur-md p-2 px-4 rounded-xl border border-white/10 pointer-events-none">
              <div className="text-zinc-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-primary" />
                124.5K WATCHING
              </div>
              <div className="h-4 w-[1px] bg-white/20" />
              <div className="text-brand-primary uppercase tracking-widest">LOW LATENCY</div>
            </div>
          </div>
          
          <div className="bento-card p-8 bg-zinc-900/40">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-4xl font-black mb-2 uppercase tracking-tighter italic">
                  WATCHING: <span className="text-brand-primary">{roomId?.replace(/-/g, ' ')}</span>
                </h1>
                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em]">Broadcast Session: {roomId}-prod-01</p>
              </div>
              <button 
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-brand-surface border border-brand-border rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-surface-light transition-all flex items-center gap-2"
              >
                <ArrowLeft size={14} /> Exit Stream
              </button>
            </div>
          </div>
        </div>

        {/* Chat Side Panel */}
        <aside className="hidden lg:flex col-span-3 bento-card flex-col overflow-hidden h-full bg-zinc-900/40">
          <div className="p-6 border-b border-brand-border flex justify-between items-center bg-zinc-950/40">
            <h3 className="font-black uppercase text-[10px] tracking-widest text-zinc-400">Live Reaction Chat</h3>
            <span className="text-[10px] text-brand-primary font-black animate-pulse">● SYNCING</span>
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
              Type your message...
              <Play size={12} className="rotate-[-45deg] text-brand-primary" fill="currentColor" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
