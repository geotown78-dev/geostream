import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface HLSPlayerProps {
  url: string;
  autoPlay?: boolean;
  controls?: boolean;
  muted?: boolean;
  volume?: number;
  className?: string;
}

const HLSPlayer: React.FC<HLSPlayerProps> = ({ url, autoPlay = true, controls = true, muted = true, volume = 1, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [errorStatus, setErrorStatus] = React.useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    setErrorStatus(null);
    
    // Synchronize audio properties
    video.muted = muted;
    video.volume = volume;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        manifestLoadingMaxRetry: 4,
        levelLoadingMaxRetry: 4,
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setErrorStatus(null);
        if (autoPlay) {
          video.play().catch(e => {
            console.log("Autoplay blocked, attempting muted play:", e);
            // We don't force video.muted = true here globally because it would break the prop sync
            // but for the initial autoplay it might be necessary.
            // Let's just try to play. If it fails, it fails.
          });
        }
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.response?.code === 404 || data.response?.code === 406) {
          setErrorStatus('პირდაპირი ტრანსლაცია დასრულებულია');
        }

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log("Fatal network error encountered, try to recover");
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log("Fatal media error encountered, try to recover");
              hls?.recoverMediaError();
              break;
            default:
              console.log("Fatal error, cannot recover");
              setErrorStatus('სტრიმის ჩატვირთვა ვერ მოხერხდა.');
              hls?.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        if (autoPlay) {
          video.play().catch(e => console.log("Autoplay blocked:", e));
        }
      });
      video.addEventListener('error', () => {
        setErrorStatus('სტრიმის ჩატვირთვა ვერ მოხერხდა (Native Error).');
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [url, autoPlay]);

  // Audio sync effect
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
      videoRef.current.volume = volume;
    }
  }, [muted, volume]);

  return (
    <div className="relative w-full h-full bg-black group">
      <video
        ref={videoRef}
        className={className}
        controls={controls}
        playsInline
        muted={muted}
      />
      {errorStatus && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 z-50 text-center p-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <span className="text-red-500 text-2xl font-black">!</span>
          </div>
          <div className="space-y-1">
            <p className="text-white font-black uppercase tracking-widest text-xs">{errorStatus}</p>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">თუ ტრანსლაცია ჯერ არ დაწყებულა, სცადეთ მოგვიანებით</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HLSPlayer;
