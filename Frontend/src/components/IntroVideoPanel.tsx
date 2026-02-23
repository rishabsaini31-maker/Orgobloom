"use client";

import { useEffect, useState, useRef, useCallback } from "react";

// Default video URLs - using reliable CDN sources
const DEFAULT_VIDEO_URLS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
];

// Default poster image - shows while video loads
const DEFAULT_POSTER_URL =
  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1920&q=80";

export default function IntroVideoPanel() {
  const [videoUrls, setVideoUrls] = useState<string[]>(DEFAULT_VIDEO_URLS);
  const [posterUrl] = useState<string>(DEFAULT_POSTER_URL);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [fade, setFade] = useState(0);

  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load videos from API
  useEffect(() => {
    const loadVideos = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
          console.log("API URL not configured, using default videos");
          return;
        }

        const response = await fetch(`${apiUrl}/site-media/intro-videos`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data?.videos?.length > 0) {
            setVideoUrls(data.videos);
          }
        }
      } catch (error) {
        console.error(
          "Failed to load intro videos from API, using defaults:",
          error,
        );
      }
    };
    loadVideos();
  }, []);

  // Handle video load
  const handleVideoLoad = useCallback(() => {
    console.log("Video loaded successfully");
    setIsVideoLoaded(true);
    setHasError(false);
  }, []);

  // Handle video error
  const handleVideoError = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
      console.error("Video failed to load:", e);
      setHasError(true);
      setIsVideoLoaded(false);
    },
    [],
  );

  // Handle video ended
  const handleVideoEnded = useCallback(() => {
    if (videoUrls.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % videoUrls.length);
    }
  }, [videoUrls.length]);

  // Try to play video when it's ready
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrls[currentIndex]) return;

    const playVideo = async () => {
      try {
        video.load();
        // Try to play, but don't throw if autoplay is blocked
        await video.play().catch(() => {
          console.log("Autoplay blocked - user interaction required");
        });
      } catch (error) {
        console.error("Video play error:", error);
      }
    };

    playVideo();
  }, [currentIndex, videoUrls]);

  // Scroll fade effect
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
      className="relative h-screen w-full bg-gray-950 text-white overflow-hidden"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        pointerEvents: fade === 1 ? "none" : undefined,
      }}
    >
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: 1 - fade }}
      >
        {/* Background Image - always visible as fallback */}
        <img
          src={posterUrl}
          alt="Organic fertilizer background"
          className="absolute inset-0 h-full w-full object-cover z-0"
        />

        {/* Video element */}
        {currentVideo && !hasError && (
          <video
            ref={videoRef}
            src={currentVideo}
            poster={posterUrl}
            className={`absolute inset-0 h-full w-full object-cover z-10 transition-opacity duration-700 ${
              isVideoLoaded ? "opacity-100" : "opacity-0"
            }`}
            muted
            playsInline
            loop={videoUrls.length === 1}
            preload="metadata"
            onLoadedData={handleVideoLoad}
            onCanPlay={handleVideoLoad}
            onError={handleVideoError}
            onEnded={handleVideoEnded}
          />
        )}

        {/* Loading indicator */}
        {!isVideoLoaded && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center z-15 bg-black/30">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-white/80">Loading video...</p>
            </div>
          </div>
        )}

        {/* Error fallback */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center z-15 bg-black/50">
            <p className="text-sm text-white/80">Video unavailable</p>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80 pointer-events-none z-20" />

        <div className="relative z-30 flex h-full items-center pointer-events-none">
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
          className="absolute bottom-8 left-1/2 z-30 -translate-x-1/2 text-sm uppercase tracking-[0.4em] text-white/80 hover:text-white pointer-events-auto"
        >
          Scroll Down
        </a>
      </div>
    </section>
  );
}
