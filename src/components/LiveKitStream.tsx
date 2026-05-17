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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const resp = await fetch(
          `/api/livekit/token?room=${roomName}&username=${userName}`
        );
        
        if (!resp.ok) {
           const errorData = await resp.json();
           throw new Error(errorData.error || `HTTP error! status: ${resp.status}`);
        }
        
        const data = await resp.json();
        setToken(data.token);
      } catch (e: any) {
        console.error('Failed to fetch token', e);
        setError(e.message || 'დაკავშირება ვერ მოხერხდა');
      }
    })();
  }, [roomName, userName]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-red-950/20 rounded-2xl border border-red-500/20 space-y-4 h-full">
        <p className="text-[11px] font-black uppercase text-red-500 tracking-widest text-center">
          {error.includes('secure contexts') || error.includes('getUserMedia') ? 'SECURE CONTEXT REQUIRED (HTTPS)' : 'CONNECTION ERROR'}
        </p>
        <p className="text-[8px] text-zinc-500 uppercase text-center max-w-[250px] leading-relaxed">
          {error.includes('secure contexts') || error.includes('getUserMedia')
            ? 'ბრაუზერი ბლოკავს კამერას/მიკროფონს HTTP-ზე. გამოიყენეთ HTTPS ან Chrome Flags ტესტირებისთვის.' 
            : error}
        </p>
        <button 
           onClick={() => window.location.reload()}
           className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[9px] font-black text-red-400 hover:bg-red-500/20 transition-all uppercase"
        >
          სცადეთ თავიდან
        </button>
      </div>
    );
  }

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
      video={false}
      audio={false}
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
