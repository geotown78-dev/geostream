import React, { useState, useEffect } from 'react';
import { Room, RoomEvent, VideoPresets, Track } from 'livekit-client';
import { Monitor, StopCircle, Loader2 } from 'lucide-react';

interface BrowserBroadcasterProps {
  roomName: string;
  vdsIp: string;
  onStatusChange?: (status: 'idle' | 'connecting' | 'streaming' | 'error') => void;
}

export default function BrowserBroadcaster({ roomName, vdsIp, onStatusChange }: BrowserBroadcasterProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startScreenShare = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      onStatusChange?.('connecting');

      // 1. Get token from our backend
      const response = await fetch(`/api/livekit/token?room=${roomName}&username=admin_${Math.floor(Math.random() * 1000)}`);
      if (!response.ok) throw new Error('Failed to get LiveKit token');
      const { token } = await response.json();

      // 2. Connect to LiveKit server
      const isHttps = window.location.protocol === 'https:';
      const protocol = isHttps ? 'wss' : 'ws';
      // If VDS IP is provided, use it. Otherwise use current hostname.
      const url = `${protocol}://${vdsIp || window.location.hostname}:7880`;
      
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: VideoPresets.h720.resolution,
        },
      });

      await newRoom.connect(url, token);
      
      // 3. Publish Screen Share
      await newRoom.localParticipant.setScreenShareEnabled(true, {
        audio: true,
        resolution: VideoPresets.h1080.resolution,
      });

      setRoom(newRoom);
      setIsStreaming(true);
      setIsConnecting(false);
      onStatusChange?.('streaming');

      newRoom.on(RoomEvent.Disconnected, () => {
        setIsStreaming(false);
        setRoom(null);
        onStatusChange?.('idle');
      });

    } catch (err: any) {
      console.error('Screen share failed:', err);
      setError(err.message || 'Failed to start screen share');
      setIsConnecting(false);
      onStatusChange?.('error');
    }
  };

  const stopScreenShare = async () => {
    if (room) {
      await room.disconnect();
      setRoom(null);
    }
    setIsStreaming(false);
    onStatusChange?.('idle');
  };

  useEffect(() => {
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [room]);

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] text-red-500 font-bold uppercase">
          {error}
        </div>
      )}

      {isStreaming ? (
        <button
          onClick={stopScreenShare}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-black uppercase text-xs"
        >
          <StopCircle size={18} />
          გაზიარების შეწყვეტა
        </button>
      ) : (
        <button
          onClick={startScreenShare}
          disabled={isConnecting}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white rounded-xl transition-all font-black uppercase text-xs"
        >
          {isConnecting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Monitor size={18} />
          )}
          {isConnecting ? 'უკავშირდება...' : 'ეკრანის გაზიარება ბრაუზერიდან'}
        </button>
      )}
      
      <p className="text-[9px] text-zinc-500 font-bold uppercase italic text-center">
        * არ საჭიროებს OBS-ს. გაზიარება ხდება პირდაპირ ბრაუზერიდან.
      </p>
    </div>
  );
}
