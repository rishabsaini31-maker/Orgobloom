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
        <div className="border-4 border-primary-600 rounded-b-2xl overflow-hidden">
          <IntroVideoPanel />
        </div>
        {/* All Products Section - Right after video */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-bold">All Products</h2>
              <Link
                href="/products"
                className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-2"
              >
                View All
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
            <ProductList featured={false} />
          </div>
        </section>
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-10">
              {/* Left: Heading + Info */}
              <div className="flex-1">
                <span className="text-primary-600 font-bold tracking-widest text-xs">
                  ―FEATURES―
                </span>
                <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-8">
                  Why Choose Us
                </h2>
                <div className="space-y-8">
                  <div className="flex items-start gap-4">
                    <img
                      src="/Images/Gemini_Generated_Image_25mu0525mu0525mu.png"
                      alt="Premium Organic"
                      className="w-10 h-10 rounded-full bg-primary-50 p-1 shadow object-cover"
                    />
                    <div>
                      <h3 className="text-xl font-semibold mb-2 text-primary-700">
                        Premium Organic Inputs
                      </h3>
                      <p className="text-gray-700">
                        We offer only the highest quality organic fertilizers
                        and soil enhancers, carefully sourced and tested for
                        purity and effectiveness. Your crops and garden get the
                        best nutrition, naturally.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <img
                      src="/Images/Gemini_Generated_Image_37j78g37j78g37j7.png"
                      alt="Soil Solutions"
                      className="w-10 h-10 rounded-full bg-primary-50 p-1 shadow object-cover"
                    />
                    <div>
                      <h3 className="text-xl font-semibold mb-2 text-primary-700">
                        Everything for Your Soil
                      </h3>
                      <p className="text-gray-700">
                        From compost and biofertilizers to eco-friendly pest
                        solutions, Orgobloom is your one-stop shop for all
                        things soil health and plant growth.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <img
                      src="/Images/Gemini_Generated_Image_irqmktirqmktirqm.png"
                      alt="Expert Guidance"
                      className="w-10 h-10 rounded-full bg-primary-50 p-1 shadow object-cover"
                    />
                    <div>
                      <h3 className="text-xl font-semibold mb-2 text-primary-700">
                        Expert Guidance
                      </h3>
                      <p className="text-gray-700">
                        Get personalized advice on how to use our products for
                        your specific crops or garden. We help you grow better,
                        with tips for application, timing, and sustainable
                        practices.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Right: Image */}
              <div className="flex-1 flex justify-center">
                <img
                  src="/Images/logo.jpg"
                  alt="Why Choose Orgobloom"
                  className="rounded-2xl shadow-lg w-full max-w-md object-cover"
                />
              </div>
            </div>
          </div>
        </section>
        <Testimonials />
        <CTASection />
        <Footer />
      </main>
    </>
  );
}
