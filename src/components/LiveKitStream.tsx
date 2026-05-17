import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { Loader2 } from 'lucide-react';
import Player from 'video.js/dist/video.js';

interface LiveKitStreamProps {
  vdsIp: string;
  streamKey: string;
}

export default function LiveKitStream({ vdsIp, streamKey }: LiveKitStreamProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);

  // SRS HLS URL: http://IP:8080/live/streamKey.m3u8
  // If using Nginx proxy for HTTPS: https://domain.com/live/streamKey.m3u8
  const isHttps = window.location.protocol === 'https:';
  const streamUrl = isHttps 
    ? `https://${window.location.hostname}/live/${streamKey}.m3u8`
    : `http://${vdsIp}:8080/live/${streamKey}.m3u8`;

  useEffect(() => {
    if (!videoRef.current) return;

    // Create video element
    const videoElement = document.createElement('video');
    videoElement.className = 'video-js vjs-big-play-centered vjs-theme-city';
    videoRef.current.appendChild(videoElement);

    const player = playerRef.current = videojs(videoElement, {
      autoplay: true,
      controls: true,
      responsive: true,
      fluid: true,
      liveui: true,
      sources: [{
        src: streamUrl,
        type: 'application/x-mpegURL'
      }]
    });

    player.on('error', () => {
      console.log('Stream not ready or offline');
    });

    return () => {
      if (player) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [streamUrl]);

  return (
    <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden group">
      <div ref={videoRef} className="w-full h-full" />
      
      {/* Label */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <div className="px-2 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-[8px] font-black text-white uppercase tracking-tighter">SRS LIVE</span>
        </div>
      </div>
    </div>
  );
}

