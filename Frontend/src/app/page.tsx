"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductList from "@/components/ProductList";
import Testimonials from "@/components/Testimonials";
import Newsletter from "@/components/Newsletter";
import CTASection from "@/components/CTASection";
import IntroVideoPanel from "@/components/IntroVideoPanel";

// Animated Counter Component
function AnimatedCounter({
  end,
  suffix = "",
  duration = 2000,
}: {
  end: number;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return (
    <div ref={ref}>
      {count}
      {suffix}
    </div>
  );
}

// Fade In Section Wrapper
function FadeInSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="smooth-scroll min-h-screen">
        {/* Video Section */}
        <div className="border-4 border-primary-600 rounded-b-2xl overflow-hidden">
          <IntroVideoPanel />
        </div>

        {/* Hero Banner - Organic Farming */}
        <section className="relative py-12 md:py-20 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 overflow-hidden">
          {/* Floating Elements - smoother animations */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-10 w-32 h-32 bg-green-400 rounded-full blur-3xl opacity-20 animate-gentle-pulse"></div>
            <div
              className="absolute bottom-10 right-10 w-40 h-40 bg-emerald-400 rounded-full blur-3xl opacity-20 animate-gentle-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
            <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-primary-300 rounded-full blur-2xl opacity-15 animate-float"></div>
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              <div className="flex-1 text-center lg:text-left">
                <FadeInSection>
                  <span className="inline-block bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-semibold mb-4 animate-pulse">
                    🌱 100% Organic Products
                  </span>
                </FadeInSection>
                <FadeInSection>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
                    Premium Organic Fertilizers for
                    <span className="bg-gradient-to-r from-primary-600 to-green-500 bg-clip-text text-transparent">
                      {" "}
                      Healthier Crops
                    </span>
                  </h1>
                </FadeInSection>
                <p className="text-lg md:text-xl text-gray-600 mb-6 max-w-2xl mx-auto lg:mx-0">
                  Transform your farm and garden with our scientifically
                  formulated organic fertilizers. Made from natural ingredients
                  for sustainable agriculture.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link
                    href="/products"
                    className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
                  >
                    Shop Now
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Link>
                  <Link
                    href="/about"
                    className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-gray-200 transition-all"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
              <div className="flex-1 flex justify-center mt-8 lg:mt-0">
                <div className="relative w-full max-w-md mx-auto lg:mx-0">
                  {/* Decorative background with shadow */}
                  <div
                    className="absolute -inset-4 md:-inset-6 bg-gradient-to-br from-primary-300 via-primary-200 to-green-300 rounded-2xl md:rounded-3xl transform rotate-3 md:rotate-6"
                    style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)' }}
                  ></div>
                  {/* Main image with prominent shadow */}
                  <div style={{ boxShadow: '0 35px 60px -15px rgba(0, 0, 0, 0.4)' }} className="relative rounded-2xl md:rounded-3xl overflow-hidden">
                    <img
                      src="/images/plant.jpg"
                      alt="Orgobloom Organic Fertilizers"
                      className="w-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section id="home-content" className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-block bg-primary-100 text-primary-700 px-4 py-1 rounded-full text-sm font-semibold mb-4">
                Our Products
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Premium Organic Fertilizers
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Handcrafted with care, our organic fertilizers are designed to
                nourish your soil and boost crop yields naturally.
              </p>
            </div>
            <ProductList featured={false} />
            <div className="text-center mt-10">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
              >
                View All Products
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <FadeInSection>
              <div className="text-center mb-12">
                <span className="inline-block bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-semibold mb-4">
                  Why Go Organic?
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Benefits of Organic Fertilizers
                </h2>
              </div>
            </FadeInSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {/* Benefit 1 */}
              <FadeInSection>
                <div className="group glass rounded-2xl p-6 shadow-lg hover:shadow-2xl border border-gray-100 text-center hover-lift">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500 ease-out">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Safe & Natural
                  </h3>
                  <p className="text-gray-600">
                    No harmful chemicals, safe for your family, pets, and the
                    environment.
                  </p>
                </div>
              </FadeInSection>
              {/* Benefit 2 */}
              <FadeInSection>
                <div
                  className="group glass rounded-2xl p-6 shadow-lg hover:shadow-2xl border border-gray-100 text-center hover-lift"
                  style={{ transitionDelay: "100ms" }}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500 ease-out">
                    <svg
                      className="w-8 h-8 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Boosts Soil Health
                  </h3>
                  <p className="text-gray-600">
                    Improves soil structure, water retention, and nutrient
                    availability.
                  </p>
                </div>
              </FadeInSection>
              {/* Benefit 3 */}
              <FadeInSection>
                <div
                  className="group glass rounded-2xl p-6 shadow-lg hover:shadow-2xl border border-gray-100 text-center hover-lift"
                  style={{ transitionDelay: "200ms" }}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500 ease-out">
                    <svg
                      className="w-8 h-8 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Better Yields
                  </h3>
                  <p className="text-gray-600">
                    Healthier plants produce more nutritious and flavorful
                    harvests.
                  </p>
                </div>
              </FadeInSection>
              {/* Benefit 4 */}
              <FadeInSection>
                <div
                  className="group glass rounded-2xl p-6 shadow-lg hover:shadow-2xl border border-gray-100 text-center hover-lift"
                  style={{ transitionDelay: "300ms" }}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500 ease-out">
                    <svg
                      className="w-8 h-8 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Eco-Friendly
                  </h3>
                  <p className="text-gray-600">
                    Sustainable farming practices that protect our planet for
                    future generations.
                  </p>
                </div>
              </FadeInSection>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-12 md:py-24 bg-white overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
              {/* Left: Features */}
              <div className="flex-1 w-full">
                <span className="text-primary-600 font-bold tracking-widest text-xs">
                  WHY CHOOSE US
                </span>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mt-2 mb-6 md:mb-8 text-gray-900">
                  The Orgobloom Difference
                </h2>
                <div className="space-y-4 md:space-y-6">
                  <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-xl hover:bg-gray-50 transition-all duration-300 ease-out hover:translate-x-1">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <img
                        src="/images/Gemini_Generated_Image_25mu0525mu0525mu.png"
                        alt="Premium Organic"
                        className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-semibold mb-1 text-gray-900">
                        Premium Organic Inputs
                      </h3>
                      <p className="text-gray-600 text-xs md:text-sm lg:text-base">
                        We offer only the highest quality organic fertilizers
                        and soil enhancers, carefully sourced and tested.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-xl hover:bg-gray-50 transition-all duration-300 ease-out hover:translate-x-1">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <img
                        src="/images/Gemini_Generated_Image_37j78g37j78g37j7.png"
                        alt="Soil Solutions"
                        className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-semibold mb-1 text-gray-900">
                        Complete Soil Solutions
                      </h3>
                      <p className="text-gray-600 text-xs md:text-sm lg:text-base">
                        From compost to eco-friendly pest solutions, your
                        one-stop shop for soil health.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-xl hover:bg-gray-50 transition-all duration-300 ease-out hover:translate-x-1">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <img
                        src="/images/Gemini_Generated_Image_irqmktirqmktirqm.png"
                        alt="Expert Guidance"
                        className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-semibold mb-1 text-gray-900">
                        Expert Guidance
                      </h3>
                      <p className="text-gray-600 text-xs md:text-sm lg:text-base">
                        Get personalized advice for your crops with tips for
                        sustainable practices.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Right: Image */}
              <div className="flex-1 flex justify-center mt-8 lg:mt-0">
                <div className="relative w-full max-w-md mx-auto lg:mx-0">
                  {/* Decorative background with shadow */}
                  <div
                    className="absolute -inset-4 md:-inset-6 bg-gradient-to-br from-green-300 via-primary-300 to-emerald-300 rounded-2xl md:rounded-3xl transform -rotate-3 md:-rotate-6"
                    style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)' }}
                  ></div>
                  {/* Main image with prominent shadow */}
                  <div style={{ boxShadow: '0 35px 60px -15px rgba(0, 0, 0, 0.4)' }} className="relative rounded-2xl md:rounded-3xl overflow-hidden">
                    <img
                      src="/images/plant2.jpg"
                      alt="Why Choose Orgobloom"
                      className="w-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section with Animated Counters */}
        <section className="py-12 md:py-16 bg-gradient-to-r from-primary-600 via-primary-700 to-green-600 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute top-0 left-0 w-full h-full"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
              }}
            ></div>
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center text-white">
              <div className="group">
                <div className="text-3xl md:text-4xl font-bold mb-2 group-hover:scale-110 transition-transform">
                  <AnimatedCounter end={500} suffix="+" />
                </div>
                <div className="text-primary-100 text-sm md:text-base">
                  Happy Farmers
                </div>
              </div>
              <div className="group">
                <div className="text-3xl md:text-4xl font-bold mb-2 group-hover:scale-110 transition-transform">
                  <AnimatedCounter end={100} suffix="%" />
                </div>
                <div className="text-primary-100 text-sm md:text-base">
                  Organic Products
                </div>
              </div>
              <div className="group">
                <div className="text-3xl md:text-4xl font-bold mb-2 group-hover:scale-110 transition-transform">
                  <AnimatedCounter end={50} suffix="+" />
                </div>
                <div className="text-primary-100 text-sm md:text-base">
                  Cities Served
                </div>
              </div>
              <div className="group">
                <div className="text-3xl md:text-4xl font-bold mb-2 group-hover:scale-110 transition-transform">
                  4.9★
                </div>
                <div className="text-primary-100 text-sm md:text-base">
                  Customer Rating
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Certification Badges Section */}
        <section className="py-8 md:py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12">
              <div className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold">
                  100% Organic Certified
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold">Quality Assured</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-yellow-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold">Eco-Friendly</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l4.59-4.58L18 11l-6 6z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold">Lab Tested</span>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <Testimonials />

        {/* CTA Section */}
        <CTASection />

        {/* Footer */}
        <Footer />
      </main>
    </>
  );
}
