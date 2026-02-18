"use client";

import { useEffect, useState, useRef } from "react";

// Default video URLs - load immediately without waiting for API
const DEFAULT_VIDEO_URLS = [
  "https://wfmmdkknrigkhdpldwhc.supabase.co/storage/v1/object/public/videos/a-seamless-animation-sequence-showing-1-a-close-up%20(1).mp4",
  "https://wfmmdkknrigkhdpldwhc.supabase.co/storage/v1/object/public/videos/close-up-of-hands-gently-mixing-organic-fertilizer.mp4",
];

// Default poster image - shows while video loads
const DEFAULT_POSTER_URL = "https://wfmmdkknrigkhdpldwhc.supabase.co/storage/v1/object/public/videos/poster.jpg";

export default function IntroVideoPanel() {
  const [videoUrls, setVideoUrls] = useState<string[]>(DEFAULT_VIDEO_URLS);
  const [posterUrl, setPosterUrl] = useState<string>(DEFAULT_POSTER_URL);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [fade, setFade] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        console.log("🎬 Loading intro videos from:", apiUrl);

        const response = await fetch(`${apiUrl}/site-media/intro-videos`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log("🎬 Loaded videos:", data?.videos);
        setVideoUrls(data?.videos || []);
        
        // Load poster/thumbnail
        if (data?.videos?.length > 0) {
          // Try to get thumbnail from API or use video URL as poster
          const posterResponse = await fetch(`${apiUrl}/site-media/intro-video-poster`);
          if (posterResponse.ok) {
            const posterData = await posterResponse.json();
            setPosterUrl(posterData?.poster || null);
          }
        }
      } catch (error) {
        console.error("Failed to load intro videos:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadVideos();
  }, []);

  // Handle video ended - play next video or restart from beginning
  const handleVideoEnded = () => {
    if (videoUrls.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % videoUrls.length);
    }
  };

  // Play video when index changes
  useEffect(() => {
    if (videoRef.current && videoUrls.length > 0) {
      console.log("🎬 Playing video:", videoUrls[currentIndex]);
      videoRef.current.load();
      videoRef.current.play().catch((err) => {
        console.warn("Autoplay blocked, user interaction required:", err);
        setIsPlaying(false);
      });
    }
  }, [currentIndex, videoUrls]);

  // Update progress
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(currentProgress);
    }
  };

  // Handle metadata loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Seek video
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * videoRef.current.duration;
    }
  };

  // Format time
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Show controls on mouse move
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  // Scroll-locked + fade effect
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowH = window.innerHeight;
      const progress = Math.min(Math.max(-rect.top / windowH, 0), 1);
      setFade(progress);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const currentVideo = videoUrls[currentIndex] || null;

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full snap-start bg-gray-950 text-white overflow-hidden"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        pointerEvents: fade === 1 ? "none" : undefined,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: 1 - fade }}
      >
        {currentVideo ? (
          <div className="relative h-full w-full">
            {/* Poster Image - shows immediately, fades out when video is ready */}
            {posterUrl && !isVideoReady && (
              <img
                src={posterUrl}
                alt="Video thumbnail"
                className="absolute inset-0 h-full w-full object-cover z-10"
              />
            )}
            
            <video
              ref={videoRef}
              src={currentVideo}
              poster={posterUrl || undefined}
              className={`h-full w-full object-cover transition-opacity duration-500 ${isVideoReady ? 'opacity-100' : 'opacity-0'}`}
              muted={isMuted}
              autoPlay
              playsInline
              preload="auto"
              loop={videoUrls.length === 1}
              onEnded={handleVideoEnded}
              onLoadedData={() => {
                console.log("🎬 Video loaded successfully");
                setIsVideoReady(true);
              }}
              onCanPlay={() => {
                setIsVideoReady(true);
              }}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onError={(e) => console.error("🎬 Video error:", e)}
              onClick={togglePlay}
              webkit-playsinline="true"
              x5-video-player-type="h5"
              x5-video-player-fullscreen="true"
            />
            
            {/* Video Controls Overlay */}
            <div 
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 sm:p-6 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
            >
              {/* Progress Bar */}
              <div 
                className="w-full h-1 sm:h-1.5 bg-white/30 rounded-full cursor-pointer mb-4 group"
                onClick={handleSeek}
              >
                <div 
                  className="h-full bg-primary-500 rounded-full relative group-hover:bg-primary-400 transition-colors"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                {/* Left Controls */}
                <div className="flex items-center gap-2 sm:gap-4">
                  {/* Play/Pause Button */}
                  <button 
                    onClick={togglePlay}
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    {isPlaying ? (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  {/* Volume Button */}
                  <button 
                    onClick={toggleMute}
                    className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                  >
                    {isMuted ? (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                      </svg>
                    )}
                  </button>

                  {/* Time Display */}
                  <div className="text-xs sm:text-sm text-white/80">
                    {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
                  </div>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-2 sm:gap-4">
                  {/* Video Indicators */}
                  {videoUrls.length > 1 && (
                    <div className="flex gap-1.5 sm:gap-2">
                      {videoUrls.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentIndex(idx)}
                          className={`h-2 w-2 sm:w-2.5 rounded-full transition-all ${
                            idx === currentIndex
                              ? "bg-primary-500 scale-110"
                              : "bg-white/40 hover:bg-white/60"
                          }`}
                          aria-label={`Go to video ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Fullscreen Button */}
                  <button 
                    onClick={() => {
                      if (videoRef.current) {
                        if (document.fullscreenElement) {
                          document.exitFullscreen();
                        } else {
                          videoRef.current.requestFullscreen();
                        }
                      }
                    }}
                    className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Play Button Overlay (when paused) */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <button 
                  onClick={togglePlay}
                  className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all transform hover:scale-105"
                >
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="text-center px-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-800 flex items-center justify-center mb-6 mx-auto">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm sm:text-base">
                {isLoading ? "Loading video..." : "No intro video uploaded yet"}
              </p>
              {!isLoading && (
                <p className="text-gray-500 text-xs sm:text-sm mt-2">
                  Add one in Admin Settings
                </p>
              )}
            </div>
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80 pointer-events-none" />

        <div className="relative z-10 flex h-full items-center pointer-events-none">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-primary-200 mb-2 sm:mb-4">
                Welcome to Orgobloom
              </p>
              <h2 className="text-2xl sm:text-4xl md:text-6xl font-bold leading-tight mb-4 sm:mb-6">
                Watch how we craft premium organic fertilizers
              </h2>
              <p className="text-base sm:text-lg md:text-2xl text-gray-200">
                Scroll down to explore the full catalog and see what makes our
                products different.
              </p>
            </div>
          </div>
        </div>
        
        <a
          href="#home-content"
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-sm uppercase tracking-[0.4em] text-white/80 hover:text-white pointer-events-auto"
        >
          Scroll
        </a>
      </div>
    </section>
  );
}
