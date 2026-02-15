"use client";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            About Orgobloom
          </h1>
          <p className="text-xl text-gray-100">
            Your trusted partner for premium organic products
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Mission Section */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Our Mission
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              At Orgobloom, our mission is to make premium organic products
              accessible to everyone. We believe that quality, sustainability,
              and health-conscious living should not be expensive luxuries but
              rather the foundation of how we all should live.
            </p>
            <p className="text-gray-600 leading-relaxed">
              We partner with certified organic farmers and producers to bring
              you the freshest, most nutritious products directly from farm to
              table.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-600 text-white">
                    ✓
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    100% Organic
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    All our products are certified organic
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-600 text-white">
                    ✓
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Farm Fresh
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Directly sourced from ethical producers
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-600 text-white">
                    ✓
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Sustainable
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Eco-friendly practices at every step
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vision Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Vision</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            We envision a world where organic, sustainable, and health-conscious
            living is the norm, not the exception. Through Orgobloom, we're
            building a community of conscious consumers who care about their
            health, their families, and our planet.
          </p>
          <p className="text-gray-600 leading-relaxed">
            By supporting local farmers, reducing carbon footprints, and
            promoting biodiversity, we're committed to creating a better future
            for generations to come.
          </p>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Our Core Values
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Quality",
                description:
                  "We never compromise on quality. Every product is rigorously tested and certified.",
              },
              {
                title: "Integrity",
                description:
                  "We are transparent about our sourcing and committed to honest business practices.",
              },
              {
                title: "Sustainability",
                description:
                  "We protect our environment by promoting sustainable farming and eco-friendly practices.",
              },
            ].map((value, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow p-6 text-center"
              >
                <h3 className="text-xl font-bold text-primary-600 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Story Section */}
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Story</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Orgobloom was founded by a group of passionate individuals who
            believed that organic living should be accessible to everyone. What
            started as a small farmers market stand has grown into a thriving
            e-commerce platform serving thousands of customers across the
            country.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            Today, we work with over 500 certified organic farmers and producers
            to bring you the finest selection of organic products. Our
            commitment to quality and sustainability remains as strong as ever.
          </p>
          <p className="text-gray-600 leading-relaxed">
            We're proud to be part of your journey towards a healthier, more
            sustainable lifestyle.
          </p>
        </div>
      </div>
    </div>
  );
}
