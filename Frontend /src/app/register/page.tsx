"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GoogleLoginButton from "@/components/GoogleLoginButton";

interface PasswordRequirements {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(false);
  const [showPasswordReqs, setShowPasswordReqs] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const checkPasswordRequirements = (
    password: string,
  ): PasswordRequirements => {
    return {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    };
  };

  const passwordReqs = checkPasswordRequirements(formData.password);
  const isPasswordValid = Object.values(passwordReqs).every((v) => v);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate name
    if (formData.name.length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Validate password requirements
    if (!isPasswordValid) {
      toast.error(
        "Password must be at least 8 characters with uppercase, lowercase, and number",
      );
      return;
    }

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Prevent double submission
      if (loading) return;

      console.log("Attempting registration with:", {
        name: formData.name,
        email: formData.email,
      });
      const response = await authApi.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      console.log("Registration response:", response.data);
      const { user, token } = response.data;

      if (!user || !token) {
        throw new Error("Invalid response: missing user or token");
      }

      setAuth(user, token);
      toast.success("Account created successfully!");

      // Give state time to update before redirecting
      setTimeout(() => {
        router.push("/");
      }, 500);
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Registration failed";
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
            Create Account
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Join Orgobloom and start your gardening journey
          </p>

          {/* Google Login */}
          <GoogleLoginButton onSuccess={() => router.push("/")} />

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-3 text-gray-500 text-sm">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="John Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setShowPasswordReqs(true)}
                onBlur={() => setShowPasswordReqs(false)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent transition"
              />

              {/* Password Requirements */}
              {(formData.password || showPasswordReqs) && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    Password must contain:
                  </p>
                  <div className="space-y-1">
                    <div
                      className={`flex items-center text-xs ${passwordReqs.minLength ? "text-green-600" : "text-gray-500"}`}
                    >
                      <span className="mr-2">
                        {passwordReqs.minLength ? "✓" : "○"}
                      </span>
                      At least 8 characters
                    </div>
                    <div
                      className={`flex items-center text-xs ${passwordReqs.hasUpperCase ? "text-green-600" : "text-gray-500"}`}
                    >
                      <span className="mr-2">
                        {passwordReqs.hasUpperCase ? "✓" : "○"}
                      </span>
                      Uppercase letter (A-Z)
                    </div>
                    <div
                      className={`flex items-center text-xs ${passwordReqs.hasLowerCase ? "text-green-600" : "text-gray-500"}`}
                    >
                      <span className="mr-2">
                        {passwordReqs.hasLowerCase ? "✓" : "○"}
                      </span>
                      Lowercase letter (a-z)
                    </div>
                    <div
                      className={`flex items-center text-xs ${passwordReqs.hasNumber ? "text-green-600" : "text-gray-500"}`}
                    >
                      <span className="mr-2">
                        {passwordReqs.hasNumber ? "✓" : "○"}
                      </span>
                      Number (0-9)
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent transition"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="terms"
                required
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
                I agree to the{" "}
                <Link
                  href="#"
                  className="text-primary-600 hover:text-primary-700 font-semibold"
                >
                  Terms & Conditions
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-gray-600 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              Sign In
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
