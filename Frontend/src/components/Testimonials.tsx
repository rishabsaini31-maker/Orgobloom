"use client";

interface Testimonial {
  id: number;
  text: string;
  author: string;
  location: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    text: "Orgobloom's fertilizers have completely transformed my garden! My plants are healthier and more vibrant than ever before. Highly recommend!",
    author: "Rajesh Kumar",
    location: "Delhi, India",
  },
  {
    id: 2,
    text: "Best organic fertilizer I've used! The quality is consistent and the customer service is exceptional. My crops have never been better.",
    author: "Priya Sharma",
    location: "Bangalore, India",
  },
  {
    id: 3,
    text: "Switched to Orgobloom and couldn't be happier! The pricing is competitive and the delivery is fast. This is my go-to brand now.",
    author: "Amit Patel",
    location: "Mumbai, India",
  },
];

export default function Testimonials() {
  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-gray-800">
            What Our Customers Say
          </h2>
          <p className="text-lg text-gray-600">
            Join thousands of satisfied customers who have transformed their
            gardens
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
            >
              {/* Star Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-gray-600 mb-6 italic">"{testimonial.text}"</p>

              {/* Author Info */}
              <div className="border-t pt-4">
                <p className="font-semibold text-gray-800">
                  {testimonial.author}
                </p>
                <p className="text-sm text-gray-500">{testimonial.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
