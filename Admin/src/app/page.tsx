"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Show welcome screen for 4 seconds, then redirect to login
    const timer = setTimeout(() => {
      router.push("/login");
    }, 4000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 left-10 w-60 h-60 bg-white opacity-5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      {/* Content */}
      <div className="text-center relative z-10 px-4">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <img
            src="/logo.jpg"
            alt="Orgobloom Logo"
            className="w-40 h-auto object-contain"
          />
        </div>

        {/* Welcome Text */}
        <h1 className="text-5xl font-bold text-white mb-3 animate-fade-in">
          Welcome Back!
        </h1>
        <p
          className="text-xl text-white text-opacity-90 mb-8 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          Orgobloom Admin Panel
        </p>

        {/* Subtitle */}
        <p
          className="text-white text-opacity-75 mb-12 text-lg animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        >
          Get ready to manage your business
        </p>

        {/* Animated loader dots */}
        <div
          className="flex justify-center gap-3 mb-8 animate-fade-in"
          style={{ animationDelay: "0.6s" }}
        >
          <div
            className="w-3 h-3 bg-white rounded-full animate-bounce"
            style={{ animationDelay: "0s" }}
          ></div>
          <div
            className="w-3 h-3 bg-white rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-3 h-3 bg-white rounded-full animate-bounce"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>

        {/* Progress bar */}
        <div
          className="w-64 h-1 bg-white bg-opacity-20 rounded-full overflow-hidden mx-auto animate-fade-in"
          style={{ animationDelay: "0.8s" }}
        >
          <div
            className="h-full bg-white rounded-full"
            style={{
              animation: "progress 4s ease-out forwards",
            }}
          ></div>
        </div>

        {/* Bottom text */}
        <p
          className="text-white text-opacity-60 text-sm mt-8 animate-fade-in"
          style={{ animationDelay: "1s" }}
        >
          Taking you to login...
        </p>
      </div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
