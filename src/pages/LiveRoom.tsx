import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Loader2, ArrowLeft, Play, Pause, Maximize, Volume2, VolumeX, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
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
        (effectivePaused || !isFullscreen)
          ? "opacity-100" 
          : (overlayVisible ? "opacity-100" : "opacity-0 pointer-events-none")
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

function ScheduleWaitingScreen({ schedItem }: { schedItem: any }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (!schedItem?.time) return;

    const calculateTimeLeft = () => {
      const difference = +new Date(schedItem.time) - +new Date();
      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [schedItem]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 relative overflow-hidden bg-zinc-950">
      {/* Background Graphic Accent */}
      {schedItem?.thumbnail && (
        <div className="absolute inset-0 opacity-10">
          <img src={schedItem.thumbnail} className="w-full h-full object-cover blur-sm" alt="" referrerPolicy="no-referrer" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col items-center max-w-lg w-full text-center space-y-6 sm:space-y-8 px-4">
        {/* Preparing label */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary/10 border border-brand-primary/20 rounded-full">
          <span className="w-2 h-2 bg-brand-primary rounded-full animate-ping" />
          <span className="text-[9px] sm:text-[10px] font-black uppercase text-brand-primary tracking-widest leading-none">
            მოლოდინის რეჟიმი • ავტომატური ჩართვა
          </span>
        </div>

        {/* Headings / Matchup */}
        <div className="space-y-3">
          <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-zinc-500">
            {schedItem?.sport || 'Event'}
          </div>
          <h2 className="text-xl sm:text-3xl font-black uppercase italic tracking-tight text-white flex items-center justify-center gap-4">
            <span>{schedItem?.team1}</span>
            <span className="text-brand-primary not-italic text-sm sm:text-base font-extrabold px-2 py-0.5 bg-white/5 rounded">VS</span>
            <span>{schedItem?.team2 || 'TBA'}</span>
          </h2>
        </div>

        {/* Countdown display */}
        {timeLeft ? (
          <div className="flex justify-center items-center gap-1.5 sm:gap-3">
            {[
              { label: 'დღე', value: timeLeft.days },
              { label: 'სთ', value: timeLeft.hours },
              { label: 'წთ', value: timeLeft.minutes },
              { label: 'წმ', value: timeLeft.seconds }
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-3 sm:p-5 min-w-[55px] sm:min-w-[80px] rounded-2xl backdrop-blur-sm">
                <div className="text-lg sm:text-3xl font-black text-white leading-none font-mono">
                  {String(item.value).padStart(2, '0')}
                </div>
                <div className="text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1 sm:mt-2">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs sm:text-sm font-black text-brand-primary animate-pulse tracking-widest uppercase">
            ტრანსლაცია მალე დაიწყება...
          </div>
        )}

        <div className="text-[10px] sm:text-xs text-zinc-400 max-w-sm leading-relaxed font-semibold">
          დაელოდეთ ეთერში გასვლას. როდესაც ადმინისტრატორი დაიწყებს ტრანსლაციას, გამოსახულება მომენტალურად გამოჩნდება ამ გვერდზე.
        </div>
      </div>
    </div>
  );
}

export default function LiveRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Real-time Chat states
  const [messages, setMessages] = useState<{ id: string; user: string; msg: string; color: string; timestamp: string }[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [isEditingNickname, setIsEditingNickname] = useState<boolean>(false);
  const [newNicknameInput, setNewNicknameInput] = useState<string>('');
  const [userChatColor, setUserChatColor] = useState<string>('text-brand-primary');
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  // New waiting-room states
  const [isStreamLive, setIsStreamLive] = useState<boolean>(true);
  const [schedItem, setSchedItem] = useState<any>(null);
  const [liveEvent, setLiveEvent] = useState<any>(null);

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

  // Initialize Nickname and Chat Color
  useEffect(() => {
    const colors = [
      'text-brand-primary', 
      'text-yellow-400', 
      'text-green-400', 
      'text-blue-400', 
      'text-purple-400', 
      'text-pink-400', 
      'text-cyan-400', 
      'text-emerald-400'
    ];
    const savedColor = localStorage.getItem('chat_color') || colors[Math.floor(Math.random() * colors.length)];
    localStorage.setItem('chat_color', savedColor);
    setUserChatColor(savedColor);

    let resolvedNick = localStorage.getItem('chat_nickname') || '';
    if (!resolvedNick) {
      if (user && user.email) {
        resolvedNick = user.email.split('@')[0].toUpperCase();
      } else {
        resolvedNick = `GUEST_${Math.floor(100 + Math.random() * 900)}`;
      }
      localStorage.setItem('chat_nickname', resolvedNick);
    }
    setNickname(resolvedNick);
  }, [user]);

  // Fetch chat history & Subscribe to live-chat
  useEffect(() => {
    if (!roomId) return;

    const fetchChat = async () => {
      try {
        const res = await fetch(`/api/chat/${roomId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error('Error fetching chat history:', err);
      }
    };
    fetchChat();

    const chatChannel = supabase.channel(`live-chat-${roomId}`, {
      config: {
        broadcast: { self: true }
      }
    });

    chatChannel.on('broadcast', { event: 'shout' }, (payload: any) => {
      if (payload && payload.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.id)) return prev;
          return [...prev, payload];
        });
      }
    });

    chatChannel.subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
    };
  }, [roomId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const chatMsg = inputText.trim();
    setInputText('');

    const msgId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const payload = {
      id: msgId,
      user: nickname || 'GUEST',
      msg: chatMsg,
      color: userChatColor,
      timestamp: new Date().toISOString()
    };

    // 1. Post to Express Memory DB (saves for refreshes and newcomers)
    try {
      fetch(`/api/chat/${roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user: payload.user,
          msg: payload.msg,
          color: payload.color
        })
      });
    } catch (err) {
      console.error('Failed to post chat message:', err);
    }

    // 2. Broadcast to other browsers in the same room
    try {
      const channel = supabase.channel(`live-chat-${roomId}`);
      await channel.send({
        type: 'broadcast',
        event: 'shout',
        payload
      });
    } catch (err) {
      console.error('Broadcast send error:', err);
    }
  };

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
        setError('');
        
        // 1. Try to find active live stream
        const { data: eventData, error: eventErr } = await supabase
          .from('events')
          .select('*')
          .eq('room_name', roomId)
          .maybeSingle();

        if (eventErr) throw eventErr;

        if (eventData) {
          setLiveEvent(eventData);
          setIsStreamLive(true);
          let url = eventData.stream_url;
          if (url) {
            if (url.includes('/hls/') && !url.endsWith('.m3u8')) {
              url += '.m3u8';
            }
            const isPageHttps = window.location.protocol === 'https:';
            const savedVDS = localStorage.getItem('vds_ip') || vdsIp;
            if (isPageHttps && !url.startsWith('https://')) {
              const urlPath = url.split('/hls/')[1];
              if (urlPath) {
                const currentHost = window.location.hostname;
                const bestHost = (currentHost && !currentHost.match(/^[0-9.]+$/)) ? currentHost : savedVDS;
                url = `https://${bestHost}/hls/${urlPath}`;
              }
            }
            setStreamUrl(url);
          }
        } else {
          // 2. If no active live stream, check if it is a scheduled match we are waiting for
          const schedId = roomId?.startsWith('sched-') ? roomId.replace('sched-', '') : roomId;
          
          const { data: schedData, error: schedErr } = await supabase
            .from('schedule')
            .select('*')
            .eq('id', schedId)
            .maybeSingle();

          if (schedErr) throw schedErr;

          if (schedData) {
            setSchedItem(schedData);
            setIsStreamLive(false);
          } else {
            setError('სტრიმი ან დაგეგმილი მატჩი ვერ მოიძებნა ბაზაში.');
          }
        }
      } catch (e: any) {
        console.error('Failed to fetch stream details:', e.message || e);
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

    // Live Sync Channel to detect when stream goes live in real time
    const liveSyncChannel = supabase
      .channel(`live-sync-${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'events'
      }, (payload) => {
        const newEvent = payload.new as any;
        const oldEvent = payload.old as any;
        const targetRoomName = newEvent?.room_name || oldEvent?.room_name;

        if (targetRoomName === roomId) {
          console.log("Real-time stream event transition matched!", payload.eventType, payload);
          
          if (payload.eventType === 'DELETE') {
            setIsStreamLive(false);
            setLiveEvent(null);
            setStreamUrl('');
            return;
          }

          let url = newEvent.stream_url;
          if (url) {
            if (url.includes('/hls/') && !url.endsWith('.m3u8')) {
              url += '.m3u8';
            }
            const isPageHttps = window.location.protocol === 'https:';
            const savedVDS = localStorage.getItem('vds_ip') || vdsIp;
            if (isPageHttps && !url.startsWith('https://')) {
              const urlPath = url.split('/hls/')[1];
              if (urlPath) {
                const currentHost = window.location.hostname;
                const bestHost = (currentHost && !currentHost.match(/^[0-9.]+$/)) ? currentHost : savedVDS;
                url = `https://${bestHost}/hls/${urlPath}`;
              }
            }
            setStreamUrl(url);
          }
          setLiveEvent(newEvent);
          setIsStreamLive(true);
          setMessages([]);
        }
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
      supabase.removeChannel(liveSyncChannel);
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
            {isStreamLive ? (
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
            ) : (
              <ScheduleWaitingScreen schedItem={schedItem} />
            )}
          </div>
          
          <div className="bento-card p-6 sm:p-8 bg-zinc-900/40">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 sm:gap-0">
              <div>
                <h1 className="text-xl sm:text-4xl font-black mb-2 uppercase tracking-tighter italic">
                  უყურებთ: <span className="text-brand-primary">
                    {isStreamLive 
                      ? (liveEvent?.title || roomId?.replace(/^(sched-)/, '').replace(/-/g, ' ')) 
                      : (schedItem ? (schedItem.team2 ? `${schedItem.team1} VS ${schedItem.team2}` : schedItem.team1) : roomId?.replace(/^(sched-)/, '').replace(/-/g, ' '))}
                  </span>
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
        <aside className="col-span-12 lg:col-span-3 bento-card flex flex-col overflow-hidden h-[450px] lg:h-full bg-zinc-900/40">
          <div className="p-6 border-b border-brand-border flex justify-between items-center bg-zinc-950/40">
            <h3 className="font-black uppercase text-[10px] tracking-widest text-zinc-400">ლაივ ჩატი</h3>
            <span className="text-[10px] text-brand-primary font-black animate-pulse">● სინქრონიზაცია</span>
          </div>
          
          <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-wider mb-1">ჩატი ცარიელია</p>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">დაწერეთ პირველი შეტყობინება!</p>
              </div>
            ) : (
              messages.map((chat) => (
                <div key={chat.id} className="flex gap-3 items-start animate-in fade-in duration-200">
                  <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 shrink-0 flex items-center justify-center font-black text-[10px] text-zinc-400 uppercase">
                    {(chat.user || 'G').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 truncate ${chat.color}`}>
                      {chat.user}
                    </p>
                    <p className="text-xs text-zinc-300 leading-normal font-medium break-words">
                      {chat.msg}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="flex flex-col gap-3 p-4 bg-zinc-950/40 border-t border-brand-border">
            {/* Nickname Editor */}
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
              {isEditingNickname ? (
                <div className="flex items-center gap-2 w-full">
                  <input 
                    type="text"
                    value={newNicknameInput}
                    onChange={(e) => setNewNicknameInput(e.target.value.substring(0, 15))}
                    placeholder="შეიყვანეთ სახელი..."
                    className="bg-black/60 border border-brand-border rounded px-2 py-1 text-[10px] text-white focus:border-brand-primary outline-none flex-1 font-bold uppercase"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = newNicknameInput.trim();
                        if (val) {
                          setNickname(val);
                          localStorage.setItem('chat_nickname', val);
                        }
                        setIsEditingNickname(false);
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      const val = newNicknameInput.trim();
                      if (val) {
                        setNickname(val);
                        localStorage.setItem('chat_nickname', val);
                      }
                      setIsEditingNickname(false);
                    }}
                    className="text-brand-primary font-black hover:text-white"
                  >
                    শენახვა
                  </button>
                  <button 
                    onClick={() => setIsEditingNickname(false)}
                    className="text-zinc-500 hover:text-white"
                  >
                    X
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-1.5">
                    <span>სახელი:</span>
                    <span className={`font-black ${userChatColor}`}>{nickname || 'GUEST'}</span>
                  </div>
                  <button 
                    onClick={() => {
                      setNewNicknameInput(nickname);
                      setIsEditingNickname(true);
                    }}
                    className="text-[9px] text-brand-primary font-black hover:text-white transition-colors"
                  >
                    (შეცვლა)
                  </button>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={sendMessage} className="relative flex items-center bg-brand-surface border border-brand-border rounded-xl focus-within:border-brand-primary/50 transition-colors">
              <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="დაწერეთ შეტყობინება..."
                className="flex-1 bg-transparent px-4 py-3 text-xs text-white outline-none placeholder-zinc-600 font-medium"
              />
              <button type="submit" className="p-3 pr-4 text-brand-primary hover:text-white transition-colors">
                <Play size={12} className="rotate-[-45deg]" fill="currentColor" />
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
