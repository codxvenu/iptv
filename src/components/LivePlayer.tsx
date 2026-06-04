import React from "react";
import Hls from "hls.js";
import { IPTVChannel } from "../types";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RefreshCw,
  Share2,
  Star,
  Activity,
  CheckCircle,
  AlertTriangle,
  Sun,
  Tv
} from "lucide-react";

interface LivePlayerProps {
  channel: IPTVChannel;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
  onClose?: () => void;
}

export const LivePlayer: React.FC<LivePlayerProps> = ({
  channel,
  isFavorite,
  onToggleFavorite,
  onShare,
  onClose
}) => {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const playerContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [isMuted, setIsMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(1); // 0 to 1
  const [brightness, setBrightness] = React.useState(1); // 0 to 1, simulated via black overlay opacity
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [streamError, setStreamError] = React.useState<string | null>(null);
  const [streamStatus, setStreamStatus] = React.useState<"checking" | "online" | "offline">("checking");
  const [retryCount, setRetryCount] = React.useState(0);
  const hlsInstanceRef = React.useRef<Hls | null>(null);

  // Check Stream Health
  const checkStreamHealth = React.useCallback(async () => {
    setStreamStatus("checking");
    try {
      const response = await fetch("/api/healthcheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: channel.streamUrl })
      });
      const data = await response.json();
      if (data.online) {
        setStreamStatus("online");
      } else {
        setStreamStatus("offline");
      }
    } catch {
      setStreamStatus("offline");
    }
  }, [channel.streamUrl]);

  // Load stream
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset video player state cleanly first to avoid stuck old stream instances
    video.pause();
    try {
      video.src = "";
      video.removeAttribute("src");
      video.load();
    } catch (e) {
      console.warn("Failed to reset native video sources:", e);
    }

    setIsLoading(true);
    setStreamError(null);
    checkStreamHealth();

    // Destroy old HLS instance
    if (hlsInstanceRef.current) {
      hlsInstanceRef.current.destroy();
      hlsInstanceRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        maxBufferLength: 10,
        maxMaxBufferLength: 20,
        lowLatencyMode: true,
      });
      hlsInstanceRef.current = hls;

      hls.loadSource(channel.streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        if (isPlaying) {
          video.play().catch(() => {
            // Unmute autoplay guard
            setIsPlaying(false);
          });
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.warn("HLS instance playing error:", data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setStreamError("Failed to decode standard broadcast stream. Attempting reconnection...");
              setIsLoading(false);
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native Apple HLS support
      video.src = channel.streamUrl;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
        if (isPlaying) {
          video.play().catch(() => {
            setIsPlaying(false);
          });
        }
      });
      video.addEventListener("error", () => {
        setStreamError("Failed to decode public stream. Please check server internet connectivity.");
        setIsLoading(false);
      });
    } else {
      setStreamError("HLS streaming .m3u8 format not supported natively in this browser engine.");
      setIsLoading(false);
    }

    return () => {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
    };
  }, [channel.streamUrl, retryCount, checkStreamHealth]);

  // Auto playback controls
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.play().catch(() => setIsPlaying(false));
    } else {
      video.pause();
    }
  }, [isPlaying]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
    video.volume = volume;
  }, [isMuted, volume]);

  // Handle Fullscreen Event changes
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === playerContainerRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!isFullscreen) {
      playerContainerRef.current.requestFullscreen().catch((err) => {
        console.error("Fullscreen request failed:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBrightness(parseFloat(e.target.value));
  };

  return (
    <div className="w-full bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 shadow-2xl relative">
      {/* Player Frame Container (supports Fullscreen) */}
      <div
        ref={playerContainerRef}
        className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden group"
        id="live-ott-player-frame"
      >
        {/* Playback Target Video */}
        <video
          ref={videoRef}
          playsInline
          className="w-full h-full object-contain pointer-events-none"
          crossOrigin="anonymous"
        />

        {/* SIMULATED BRIGHTNESS FILTER OVERLAY (Based on Slider) */}
        <div
          className="absolute inset-0 pointer-events-none bg-black transition-opacity duration-150"
          style={{ opacity: 1 - brightness }}
        />

        {/* LOADING INDICATOR / SCREEN STYLING */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-20">
            <div className="relative">
              <div className="w-14 h-14 border-4 border-zinc-800 border-t-red-600 rounded-full animate-spin" />
              <Tv className="w-6 h-6 text-red-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <span className="text-zinc-200 text-sm font-semibold mt-4 tracking-wide animate-pulse">
              Buffering Live Feed...
            </span>
            <span className="text-zinc-500 text-xs font-mono mt-1 w-72 text-center truncate">
              {channel.streamUrl}
            </span>
          </div>
        )}

        {/* ERROR SCREEN */}
        {streamError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/95 z-20 p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mb-3 animate-bounce" />
            <span className="text-zinc-100 text-sm font-bold block max-w-md">
              {streamError}
            </span>
            <span className="text-zinc-500 text-xs max-w-sm mt-1.5 leading-relaxed">
              Standard public broadcasts frequently cycle security keys or experience temporary downtime in some geographical locations.
            </span>
            <button
              onClick={handleRetry}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase rounded-md tracking-wider flex items-center gap-2 shadow-lg hover:shadow-red-900/30 active:scale-95 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reconnect Live Stream
            </button>
          </div>
        )}

        {/* OTT VIDEO HUD BUTTONS CONTROL PANELS (Fades out when not hovering) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/85 flex flex-col justify-between p-4 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 z-10 select-none">
          
          {/* Top HUD Row */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 p-1 bg-zinc-950/80 rounded border border-zinc-800 flex items-center justify-center">
                <img
                  src={channel.logo || ""}
                  alt={channel.name}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                  className="w-full h-full object-contain filter drop-shadow"
                />
              </div>
              <div>
                <h4 className="text-zinc-100 font-bold text-sm tracking-tight flex items-center gap-2">
                  {channel.name}
                  {streamStatus === "online" && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" title="Feed Online" />
                  )}
                </h4>
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium mt-0.5">
                  <span className="text-cyan-400 font-bold uppercase text-[10px] tracking-wider">
                    {channel.category}
                  </span>
                  <span>•</span>
                  <span>{channel.quality || "720p"} Stream</span>
                </div>
              </div>
            </div>

            {/* Top Right Buttons */}
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 text-[9px] font-bold rounded tracking-wider flex items-center gap-1 ${
                  streamStatus === "online"
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                    : streamStatus === "offline"
                    ? "bg-red-950 text-red-400 border border-red-900"
                    : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                }`}
              >
                <Activity className="w-2.5 h-2.5" />
                {streamStatus === "checking" ? "DIAGNOSING" : streamStatus === "online" ? "HEALTHY" : "CRITICAL"}
              </span>

              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
                  title="Close screen player"
                >
                  <Minimize className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Bottom HUD HUD Panel */}
          <div className="flex flex-col gap-3">
            {/* Play controls and sliding gestures */}
            <div className="flex items-center justify-between">
              
              {/* Play / Pause / Mute Layout */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg active:scale-95 transition-all"
                  id="hud-play-btn"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                </button>

                <div className="flex items-center gap-2 bg-zinc-900/75 p-1.5 rounded-lg border border-zinc-800/80">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-zinc-400 hover:text-zinc-100 transition-colors"
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-16 accent-red-600 h-1 rounded bg-zinc-700 cursor-pointer"
                    title={`Volume: ${Math.round(volume * 100)}%`}
                  />
                </div>

                <div className="flex items-center gap-2 bg-zinc-900/75 p-1.5 rounded-lg border border-zinc-800/80">
                  <Sun className="w-4 h-4 text-zinc-400" />
                  <input
                    type="range"
                    min="0.2"
                    max="1"
                    step="0.05"
                    value={brightness}
                    onChange={handleBrightnessChange}
                    className="w-16 accent-amber-500 h-1 bg-zinc-700 rounded cursor-pointer"
                    title={`Brightness: ${Math.round(brightness * 100)}%`}
                  />
                </div>
              </div>

              {/* Utility shortcuts Right column */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleFavorite}
                  className="p-2.5 rounded-lg bg-zinc-900/75 border border-zinc-800 text-zinc-400 hover:text-red-500 transition-colors"
                  title="Toggle favorite"
                >
                  <Star className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                </button>
                <button
                  onClick={onShare}
                  className="p-2.5 rounded-lg bg-zinc-900/75 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
                  title="Share channel stream"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-2.5 rounded-lg bg-zinc-900/75 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>

            </div>
          </div>

        </div>

        {/* AUDIO VISUALIZER GRAPHICS (Renders only when live playback is playing) */}
        {!isLoading && !streamError && isPlaying && (
          <div className="absolute bottom-2 left-4 right-4 h-2 pointer-events-none flex items-end gap-0.5 justify-center opacity-85">
            {[...Array(30)].map((_, i) => {
              const animDuration = 0.5 + Math.random() * 0.8;
              return (
                <div
                  key={i}
                  className="w-1 bg-gradient-to-t from-red-600 via-rose-500 to-red-400 rounded-t"
                  style={{
                    height: "100%",
                    animationDelay: `${Math.random() * 0.5}s`,
                    animation: `equalizerBar ${animDuration}s ease-in-out infinite alternate`
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Embedded CSS for custom keyframe audio bar loops */}
      <style>{`
        @keyframes equalizerBar {
          0% { height: 10%; }
          100% { height: 85%; }
        }
      `}</style>
    </div>
  );
};
