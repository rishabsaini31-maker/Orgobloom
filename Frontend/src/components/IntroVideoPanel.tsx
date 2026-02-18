"use client";

import { useEffect, useState, useRef } from "react";

export default function IntroVideoPanel() {
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [fade, setFade] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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
      });
    }
  }, [currentIndex, videoUrls]);

  // Scroll-locked + fade effect
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowH = window.innerHeight;
      // Fade out as the section scrolls out of view (top 0 to -windowH)
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
    >
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: 1 - fade }}
      >
        {currentVideo ? (
          <video
            ref={videoRef}
            src={currentVideo}
            className="h-full w-full object-cover"
            muted
            autoPlay
            playsInline
            preload="auto"
            loop={videoUrls.length === 1}
            onEnded={handleVideoEnded}
            onLoadedData={() => console.log("🎬 Video loaded successfully")}
            onError={(e) => console.error("🎬 Video error:", e)}
            controls={false}
            webkit-playsinline="true"
            x5-video-player-type="h5"
            x5-video-player-fullscreen="true"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-900 text-gray-400">
            {isLoading ? "Loading intro video..." : "No intro video yet"}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80 pointer-events-none" />

        {/* Video indicators */}
        {videoUrls.length > 1 && (
          <div className="absolute bottom-24 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {videoUrls.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 w-8 rounded-full transition-all ${
                  idx === currentIndex
                    ? "bg-white"
                    : "bg-white/30 hover:bg-white/50"
                }`}
                aria-label={`Go to video ${idx + 1}`}
              />
            ))}
          </div>
        )}

        <div className="relative z-10 flex h-full items-center">
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
              {!isLoading && videoUrls.length === 0 && (
                <p className="mt-4 text-sm text-gray-300">
                  Intro video not uploaded yet. Add one in the Admin Settings.
                </p>
              )}
            </div>
          </div>
        </div>
        <a
          href="#home-content"
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-sm uppercase tracking-[0.4em] text-white/80 hover:text-white"
        >
          Scroll
        </a>
      </div>
    </section>
  );
}
