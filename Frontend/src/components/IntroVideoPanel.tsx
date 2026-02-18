"use client";

import { useEffect, useState, useRef } from "react";

export default function IntroVideoPanel() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fade, setFade] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadVideo = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/site-media/intro-video`,
        );
        const data = await response.json();
        setVideoUrl(data?.url || null);
      } catch (error) {
        console.error("Failed to load intro video:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadVideo();
  }, []);

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
        {videoUrl ? (
          <video
            src={videoUrl}
            className="h-full w-full object-cover"
            muted
            autoPlay
            loop
            playsInline
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-900 text-gray-400">
            {isLoading ? "Loading intro video..." : "No intro video yet"}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80 pointer-events-none" />
        <div className="relative z-10 flex h-full items-center">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.3em] text-primary-200 mb-4">
                Welcome to Orgobloom
              </p>
              <h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                Watch how we craft premium organic fertilizers
              </h2>
              <p className="text-lg md:text-2xl text-gray-200">
                Scroll down to explore the full catalog and see what makes our
                products different.
              </p>
              {!isLoading && !videoUrl && (
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
