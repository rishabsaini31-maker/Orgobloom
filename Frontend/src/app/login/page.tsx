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

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (loading) return;

    setLoading(true);

    try {
      console.log("Attempting login with:", formData);
      const response = await authApi.login(formData);
      console.log("Login response:", response.data);

      const { user, token } = response.data;

      if (!user || !token) {
        throw new Error("Invalid response: missing user or token");
      }

      setAuth(user, token);
      toast.success("Logged in successfully!");

      // Give state time to update before redirecting
      setTimeout(() => {
        router.push("/");
      }, 500);
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Login failed";
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
            Welcome Back
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Sign in to your Orgobloom account
          </p>

          {/* Google Login */}
          <GoogleLoginButton onSuccess={() => router.push("/")} />

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-3 text-gray-500 text-sm">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Email/Password Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                required
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="text-center text-gray-600 mt-6">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              Sign Up
            </Link>
          </p>

          {/* Forgot Password Link */}
          <p className="text-center text-gray-600 mt-2">
            <Link
              href="/forgot-password"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Forgot Password?
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
