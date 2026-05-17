import React, { useState, useEffect } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  useToken,
  ControlBar,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Loader2 } from 'lucide-react';

interface LiveKitStreamProps {
  roomName: string;
  userName: string;
  serverUrl: string;
}

export default function LiveKitStream({ roomName, userName, serverUrl }: LiveKitStreamProps) {
  const [token, setToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(
          `/api/livekit/token?room=${roomName}&username=${userName}`
        );
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error('Failed to fetch token', e);
      }
    })();
  }, [roomName, userName]);

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-zinc-900/50 rounded-2xl border border-white/5 space-y-4">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">LiveKit-თან დაკავშირება...</p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={serverUrl}
      data-lk-theme="default"
      style={{ height: '100%', width: '100%' }}
      onDisconnected={() => setToken(undefined)}
    >
      <VideoConference />
    </LiveKitRoom>
  );
}
