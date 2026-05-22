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
      try {
        const cleanUrl = url?.trim();
        if (!cleanUrl) {
          setErrorStatus('სტრიმის მისამართი ცარიელია');
          return;
        }

        console.log("Initializing HLS for:", cleanUrl);

        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          manifestLoadingMaxRetry: 6,
          levelLoadingMaxRetry: 6,
          backBufferLength: 30,
          maxBufferLength: 15,
          maxMaxBufferLength: 25,
          liveSyncDurationCount: 4,
          liveMaxLatencyDurationCount: 6,
          liveDurationInfinity: true,
          xhrSetup: (xhr) => {
            xhr.withCredentials = false;
          }
        });

        hls.attachMedia(video);

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          console.log("HLS Media Attached, loading source:", cleanUrl);
          hls?.loadSource(cleanUrl);
        });
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setErrorStatus(null);
          if (autoPlay) {
            video.play().catch(e => {
              console.log("Autoplay blocked, attempting muted play:", e);
              video.muted = true;
              video.play().catch(err => console.error("Muted play also failed:", err));
            });
          }
        });
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.response?.code === 404 || data.response?.code === 406) {
            setErrorStatus('სტრიმი მზადდება... (404)');
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
      } catch (err) {
        console.error("HLS init error:", err);
        setErrorStatus('ფლეიერის ინიციალიზაცია ვერ მოხერხდა.');
      }
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      const cleanUrl = url?.trim();
      if (!cleanUrl) {
        setErrorStatus('სტრიმის მისამართი ცარიელია');
        return;
      }
      video.src = cleanUrl;
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

  // Playback sync effect
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (autoPlay) {
      video.play().catch(e => console.log("Play failed or blocked:", e));
    } else {
      video.pause();
    }
  }, [autoPlay]);

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
        <div className="absolute top-4 left-4 right-4 flex items-center gap-3 p-3 bg-zinc-950/80 backdrop-blur-md border border-white/5 rounded-xl z-50 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
            <span className="text-red-500 text-sm font-black">!</span>
          </div>
          <div className="flex flex-col">
            <p className="text-white font-black uppercase tracking-widest text-[8px] leading-tight">{errorStatus}</p>
            <p className="text-[7px] text-zinc-500 font-bold uppercase tracking-tight">დაელოდეთ სტრიმერს...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HLSPlayer;
