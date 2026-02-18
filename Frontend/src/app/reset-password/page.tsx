"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface PasswordRequirements {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isReady, setIsReady] = useState(false);

  const [loading, setLoading] = useState(false);
  const [showPasswordReqs, setShowPasswordReqs] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // Check if we have email and code from localStorage (passed from forgot-password flow)
  useEffect(() => {
    const storedEmail = localStorage.getItem("resetEmail");
    const storedCode = localStorage.getItem("resetCode");

    if (storedEmail && storedCode) {
      setEmail(storedEmail);
      setCode(storedCode);
      setIsReady(true);
    } else {
      // Redirect to forgot-password if no data
      router.push("/forgot-password");
    }
  }, [router]);

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

  const passwordReqs = checkPasswordRequirements(formData.newPassword);
  const isPasswordValid = Object.values(passwordReqs).every((v) => v);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !code) {
      toast.error("Session expired. Please try again.");
      router.push("/forgot-password");
      return;
    }

    if (!isPasswordValid) {
      toast.error("Password does not meet requirements");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword({
        email,
        code,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      toast.success("✓ Password reset successful! Redirecting to login...");
      localStorage.removeItem("resetEmail");
      localStorage.removeItem("resetCode");

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      console.error("Reset password error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to reset password";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isReady) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-2xl font-bold text-center mb-2 text-gray-800">
            Create New Password
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Enter a strong password for your account
          </p>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    newPassword: e.target.value,
                  })
                }
                onFocus={() => setShowPasswordReqs(true)}
                onBlur={() =>
                  formData.newPassword === "" && setShowPasswordReqs(false)
                }
                required
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent transition"
                disabled={loading}
              />

              {showPasswordReqs && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">
                    Password Requirements:
                  </p>
                  <div className="space-y-1">
                    <div
                      className={`text-sm ${passwordReqs.minLength ? "text-green-600" : "text-gray-500"}`}
                    >
                      <span className="mr-2">
                        {passwordReqs.minLength ? "✓" : "○"}
                      </span>
                      Minimum 8 characters
                    </div>
                    <div
                      className={`text-sm ${passwordReqs.hasUpperCase ? "text-green-600" : "text-gray-500"}`}
                    >
                      <span className="mr-2">
                        {passwordReqs.hasUpperCase ? "✓" : "○"}
                      </span>
                      Uppercase letter (A-Z)
                    </div>
                    <div
                      className={`text-sm ${passwordReqs.hasLowerCase ? "text-green-600" : "text-gray-500"}`}
                    >
                      <span className="mr-2">
                        {passwordReqs.hasLowerCase ? "✓" : "○"}
                      </span>
                      Lowercase letter (a-z)
                    </div>
                    <div
                      className={`text-sm ${passwordReqs.hasNumber ? "text-green-600" : "text-gray-500"}`}
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
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    confirmPassword: e.target.value,
                  })
                }
                required
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent transition"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>

          <div className="text-center mt-6">
            <a
              href="/login"
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              Back to Login
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
