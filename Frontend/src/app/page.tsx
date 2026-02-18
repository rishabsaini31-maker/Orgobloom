import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductList from "@/components/ProductList";
import Testimonials from "@/components/Testimonials";
import Newsletter from "@/components/Newsletter";
import CTASection from "@/components/CTASection";
import IntroVideoPanel from "@/components/IntroVideoPanel";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="snap-y snap-mandatory scroll-smooth min-h-screen overflow-auto">
        {/* Video Section */}
        <div className="border-4 border-primary-600 rounded-b-2xl overflow-hidden">
          <IntroVideoPanel />
        </div>

        {/* Hero Banner - Organic Farming */}
        <section className="relative py-12 md:py-20 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 bg-green-400 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-emerald-400 rounded-full blur-3xl"></div>
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              <div className="flex-1 text-center lg:text-left">
                <span className="inline-block bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-semibold mb-4">
                  🌱 100% Organic Products
                </span>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
                  Premium Organic Fertilizers for
                  <span className="text-primary-600"> Healthier Crops</span>
                </h1>
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
              <div className="flex-1 flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-6 bg-gradient-to-br from-primary-300 via-primary-200 to-green-300 rounded-3xl transform rotate-6 shadow-xl"></div>
                  <img
                    src="/images/plant.jpg"
                    alt="Orgobloom Organic Fertilizers"
                    className="relative rounded-3xl shadow-2xl w-full max-w-lg md:max-w-xl lg:max-w-2xl object-cover"
                  />
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
            <div className="text-center mb-12">
              <span className="inline-block bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-semibold mb-4">
                Why Go Organic?
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Benefits of Organic Fertilizers
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {/* Benefit 1 */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
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
              {/* Benefit 2 */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
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
              {/* Benefit 3 */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
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
              {/* Benefit 4 */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
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
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
              {/* Left: Features */}
              <div className="flex-1 w-full">
                <span className="text-primary-600 font-bold tracking-widest text-xs">
                  ―WHY CHOOSE US―
                </span>
                <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-8 text-gray-900">
                  The Orgobloom Difference
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <img
                        src="/images/Gemini_Generated_Image_25mu0525mu0525mu.png"
                        alt="Premium Organic"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1 text-gray-900">
                        Premium Organic Inputs
                      </h3>
                      <p className="text-gray-600 text-sm md:text-base">
                        We offer only the highest quality organic fertilizers
                        and soil enhancers, carefully sourced and tested for
                        purity and effectiveness.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <img
                        src="/images/Gemini_Generated_Image_37j78g37j78g37j7.png"
                        alt="Soil Solutions"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1 text-gray-900">
                        Complete Soil Solutions
                      </h3>
                      <p className="text-gray-600 text-sm md:text-base">
                        From compost and biofertilizers to eco-friendly pest
                        solutions, Orgobloom is your one-stop shop for all
                        things soil health.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <img
                        src="/images/Gemini_Generated_Image_irqmktirqmktirqm.png"
                        alt="Expert Guidance"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1 text-gray-900">
                        Expert Guidance
                      </h3>
                      <p className="text-gray-600 text-sm md:text-base">
                        Get personalized advice on how to use our products for
                        your specific crops or garden with tips for sustainable
                        practices.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Right: Image */}
              <div className="flex-1 flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-8 bg-gradient-to-br from-green-300 via-primary-300 to-emerald-300 rounded-3xl transform -rotate-6 shadow-2xl"></div>
                  <img
                    src="/images/plant2.jpg"
                    alt="Why Choose Orgobloom"
                    className="relative rounded-3xl shadow-2xl w-full max-w-lg md:max-w-xl lg:max-w-2xl object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 md:py-16 bg-primary-600">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center text-white">
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-2">500+</div>
                <div className="text-primary-100 text-sm md:text-base">
                  Happy Farmers
                </div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-2">100%</div>
                <div className="text-primary-100 text-sm md:text-base">
                  Organic Products
                </div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-2">50+</div>
                <div className="text-primary-100 text-sm md:text-base">
                  Cities Served
                </div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold mb-2">4.9★</div>
                <div className="text-primary-100 text-sm md:text-base">
                  Customer Rating
                </div>
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
