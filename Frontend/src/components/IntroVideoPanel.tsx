"use client";

import { useEffect, useState, useRef, useCallback } from "react";

// Default video URLs - load immediately without waiting for API
const DEFAULT_VIDEO_URLS = [
  "https://wfmmdkknrigkhdpldwhc.supabase.co/storage/v1/object/public/videos/a-seamless-animation-sequence-showing-1-a-close-up%20(1).mp4",
  "https://wfmmdkknrigkhdpldwhc.supabase.co/storage/v1/object/public/videos/close-up-of-hands-gently-mixing-organic-fertilizer.mp4",
];

// Default poster image - shows while video loads
const DEFAULT_POSTER_URL =
  "https://wfmmdkknrigkhdpldwhc.supabase.co/storage/v1/object/public/videos/poster.jpg";

export default function IntroVideoPanel() {
  const [videoUrls, setVideoUrls] = useState<string[]>(DEFAULT_VIDEO_URLS);
  const [posterUrl] = useState<string>(DEFAULT_POSTER_URL);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextVideoReady, setNextVideoReady] = useState(false);
  const [fade, setFade] = useState(0);

  const sectionRef = useRef<HTMLDivElement>(null);
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);

  // Load videos from API
  useEffect(() => {
    const loadVideos = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/site-media/intro-videos`);
        if (response.ok) {
          const data = await response.json();
          if (data?.videos?.length > 0) {
            setVideoUrls(data.videos);
          }
        }
      } catch (error) {
        console.error("Failed to load intro videos:", error);
      }
    };
    loadVideos();
  }, []);

  // Preload next video in background
  useEffect(() => {
    if (videoUrls.length > 1 && nextVideoRef.current) {
      const nextIndex = (currentIndex + 1) % videoUrls.length;
      nextVideoRef.current.src = videoUrls[nextIndex];
      nextVideoRef.current.load();
      setNextVideoReady(false);
    }
  }, [currentIndex, videoUrls]);

  // Play main video when index changes
  useEffect(() => {
    if (mainVideoRef.current && videoUrls.length > 0) {
      mainVideoRef.current.src = videoUrls[currentIndex];
      mainVideoRef.current.load();
      mainVideoRef.current.play().catch(() => {});
    }
  }, [currentIndex, videoUrls]);

  // Handle video ended - smooth transition to next video
  const handleVideoEnded = useCallback(() => {
    if (videoUrls.length > 1 && nextVideoRef.current) {
      const nextIndex = (currentIndex + 1) % videoUrls.length;

      // Start playing next video (already preloaded)
      nextVideoRef.current.play().catch(() => {});

      // Wait a brief moment for next video to start, then switch
      setTimeout(() => {
        setCurrentIndex(nextIndex);
        setNextVideoReady(false);
      }, 50);
    }
  }, [videoUrls.length, currentIndex]);

  // Handle next video loaded
  const handleNextVideoCanPlay = useCallback(() => {
    setNextVideoReady(true);
  }, []);

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
  const nextVideoIndex = (currentIndex + 1) % videoUrls.length;
  const nextVideo = videoUrls[nextVideoIndex] || null;

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
        {currentVideo ? (
          <div className="relative h-full w-full">
            {/* Poster Image - always present as fallback background */}
            {posterUrl && (
              <img
                src={posterUrl}
                alt="Video thumbnail"
                className="absolute inset-0 h-full w-full object-cover z-0"
              />
            )}

            {/* Main video - always visible */}
            <video
              ref={mainVideoRef}
              src={currentVideo}
              poster={posterUrl || undefined}
              className="absolute inset-0 h-full w-full object-cover z-10"
              muted
              autoPlay
              playsInline
              preload="auto"
              loop={videoUrls.length === 1}
              onEnded={handleVideoEnded}
            />

            {/* Hidden preloader for next video - keeps it ready */}
            {nextVideo && (
              <video
                ref={nextVideoRef}
                src={nextVideo}
                className="absolute inset-0 h-full w-full object-cover z-5 opacity-0 pointer-events-none"
                muted
                playsInline
                preload="auto"
                onCanPlay={handleNextVideoCanPlay}
              />
            )}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <p className="text-gray-400">Loading video...</p>
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
          Scroll
        </a>
      </div>
    </section>
  );
}
