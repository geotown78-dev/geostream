import React from 'react';
import HLSPlayer from './HLSPlayer';

interface LiveKitStreamProps {
  vdsIp: string;
  streamKey: string;
}

export default function LiveKitStream({ vdsIp, streamKey }: LiveKitStreamProps) {
  // Nginx-RTMP HLS URL: http://IP/hls/streamKey.m3u8
  const isHttps = window.location.protocol === 'https:';
  const streamUrl = isHttps 
    ? `https://${window.location.hostname}/hls/${streamKey}.m3u8`
    : `http://${vdsIp}/hls/${streamKey}.m3u8`;

  return (
    <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden group">
      <HLSPlayer url={streamUrl} />
      
      {/* Label */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
        <div className="px-2 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[8px] font-black text-white uppercase tracking-tighter">NGINX LIVE</span>
        </div>
      </div>
    </div>
  );
}

