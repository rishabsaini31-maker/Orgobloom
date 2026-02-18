"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setIsLoading(true);
      console.log(
        "🔍 Google token received:",
        credentialResponse.credential?.substring(0, 20) + "...",
      );

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/google`,
        { token: credentialResponse.credential },
      );

      const { user, token } = response.data;
      console.log("✅ Google login successful");

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setAuth(user, token);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("❌ Google login error:", error);
      toast.error(error.response?.data?.error || "Google login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("❌ Login error:", error);
      console.error("❌ Error response:", error.response);
      toast.error(
        error.response?.data?.error || error.message || "Login failed",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admin Login
            </h1>
            <p className="text-gray-600">
              Sign in to access the admin dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Google OAuth Button */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  console.error("❌ Google login failed");
                  toast.error("Google login failed");
                }}
              />
            </div>
          </div>

         
        </div>
      </div>
    </div>
  );
}
