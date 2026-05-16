import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface HLSPlayerProps {
  url: string;
  autoPlay?: boolean;
  controls?: boolean;
  className?: string;
}

const HLSPlayer: React.FC<HLSPlayerProps> = ({ url, autoPlay = true, controls = true, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [errorStatus, setErrorStatus] = React.useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    setErrorStatus(null);

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
          video.play().catch(e => console.log("Autoplay blocked:", e));
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.response?.code === 404 || data.response?.code === 406) {
          setErrorStatus('სტრიმი არ მოიძებნა. გადაამოწმეთ OBS-ში STREAM KEY.');
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

  return (
    <div className="relative w-full h-full bg-black group">
      <video
        ref={videoRef}
        className={className}
        controls={controls}
        playsInline
        muted={autoPlay}
      />
      {errorStatus && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 z-50 text-center p-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <span className="text-red-500 text-2xl font-black">!</span>
          </div>
          <div className="space-y-1">
            <p className="text-white font-black uppercase tracking-widest text-xs">{errorStatus}</p>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">დარწმუნდით რომ OBS-ში სწორი გასაღები გაქვთ ჩაწერილი</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HLSPlayer;
