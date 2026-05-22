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

        console.log("Initializing HLS with optimized latency parameters for:", cleanUrl);

        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          
          // Enhanced loading recovery configurations
          manifestLoadingMaxRetry: 10,
          manifestLoadingRetryDelay: 500,
          manifestLoadingMaxRetryTimeout: 2000,
          levelLoadingMaxRetry: 10,
          levelLoadingRetryDelay: 500,
          levelLoadingMaxRetryTimeout: 2000,
          fragLoadingMaxRetry: 10,
          fragLoadingRetryDelay: 500,
          fragLoadingMaxRetryTimeout: 2000,

          // Buffer sizes tuned specifically for 3-second fragments and 30-second playlist
          maxBufferLength: 8,          // Maintain maximum of 8 seconds of buffer ahead (approx. 2.6 targets)
          maxMaxBufferLength: 12,      // Absolute ceiling for buffer allocation
          backBufferLength: 6,         // Evict old/past fragments aggressively from memory
          highBufferWatchdogPeriod: 2, // Check for stalled decoder pipeline every 2 seconds

          // Live edge tracking settings to avoid freezing and minimize latency
          liveSyncDuration: 9,         // Anchor position exactly 9 seconds (3 fragments) behind live edge - prevents freezing on network jitters
          liveMaxLatencyDuration: 18,  // Maximum allowable drift before catch-up triggers (6 fragments)
          maxLiveSyncPlaybackRate: 1.15, // Let player play up to 1.15x speed to smoothly recover drift
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
          console.warn(`HLS Player Error [${data.type} / ${data.details}]:`, data);

          if (data.response?.code === 404 || data.response?.code === 406) {
            setErrorStatus('სტრიმი მზადდება... (404)');
          }

          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log("Fatal network error encountered, scheduling reload/recovery...");
                hls?.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log("Fatal media error encountered, recovering media stream...");
                hls?.recoverMediaError();
                break;
              default:
                console.log("Fatal player error, recreating HLS engine in 3 seconds...");
                setErrorStatus('სტრიმი გადაიტვირთება 3 წამში...');
                setTimeout(() => {
                  if (hls) {
                    hls.destroy();
                    hls.loadSource(cleanUrl);
                    hls.attachMedia(video);
                  }
                }, 3000);
                break;
            }
          } else {
            // Recover from non-fatal pipeline stalls (e.g. BUFFER_STALLED_ERROR)
            if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
              console.log("Buffer stall detected. Nudging the video pipeline...");
              if (video.paused) {
                video.play().catch(e => console.log("Failed to resume playback on stall:", e));
              } else {
                // If rendering is active but stalled, nudge current timeline forward slightly to force-trigger decode block
                video.currentTime = video.currentTime + 0.15;
              }
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
