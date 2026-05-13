import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  LiveKitRoom, 
  VideoConference,
  ControlBar,
  useLocalParticipant,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Loader2, ArrowLeft, Monitor, Mic, Camera, StopCircle } from 'lucide-react';

import { supabase } from '../lib/supabase';

export default function BroadcasterRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [token, setToken] = useState<string>('');
  const [error, setError] = useState<string>('');

  const endStream = async () => {
    try {
      await supabase.from('active_streams').update({ is_active: false }).eq('id', 'global-stream');
    } catch (e) {
      console.error('Failed to end stream:', e);
    }
  };

  useEffect(() => {
    if (!roomId) return;

    const fetchToken = async () => {
      try {
        const participantName = `admin-${Math.floor(Math.random() * 1000)}`;
        const resp = await fetch(`/api/get-token?roomName=${roomId}&participantName=${participantName}`);
        const data = await resp.json();
        
        if (data.error) throw new Error(data.error);
        setToken(data.token);
      } catch (e) {
        console.error(e);
        setError('Failed to load broadcast session.');
      }
    };

    fetchToken();

    return () => {
      endStream();
    };
  }, [roomId]);

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
             <div className="bg-red-600 text-white px-3 py-1 rounded-md text-[10px] font-black flex items-center gap-2 uppercase">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> 
                ON AIR
              </div>
          </div>
        </div>

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
            onDisconnected={() => navigate('/admin')}
            data-lk-theme="default"
            className="h-full broadcaster-mode"
          >
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
