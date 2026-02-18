"use client";

import { useState } from "react";
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

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "verify" | "reset">("email");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [showPasswordReqs, setShowPasswordReqs] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: "",
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

  const passwordReqs = checkPasswordRequirements(formData.newPassword);
  const isPasswordValid = Object.values(passwordReqs).every((v) => v);

  // Step 1: Request code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authApi.forgotPassword({ email });
      toast.success("✓ Verification code sent to your email!");
      setStep("verify");
    } catch (error: any) {
      console.error("Forgot password error:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Failed to send code";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authApi.post("/auth/verify-code", { email, code });
      toast.success("✓ Code verified!");
      // Store email and code in localStorage for reset-password page
      localStorage.setItem("resetEmail", email);
      localStorage.setItem("resetCode", code);
      setStep("reset");
    } catch (error: any) {
      console.error("Verify code error:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Invalid code";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

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

      toast.success("✓ Password reset successful! Signing in...");
      // Clear localStorage
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

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
          {/* Step 1: Enter Email */}
          {step === "email" && (
            <>
              <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
                Forgot Password
              </h1>
              <p className="text-center text-gray-600 mb-8">
                Enter your email and we'll send you a verification code
              </p>

              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent transition"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? "Sending Code..." : "Send Verification Code"}
                </button>
              </form>
            </>
          )}

          {/* Step 2: Enter Code */}
          {step === "verify" && (
            <>
              <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
                Enter Code
              </h1>
              <p className="text-center text-gray-600 mb-8">
                We sent a 6-digit code to
                <br />
                <strong>{email}</strong>
              </p>

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    required
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-3 text-3xl text-center tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent transition font-mono"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Code expires in 10 minutes
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </button>

                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="w-full text-primary-600 py-2 font-semibold hover:text-primary-700"
                >
                  Back
                </button>
              </form>
            </>
          )}

          {/* Step 3: Reset Password */}
          {step === "reset" && (
            <>
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
                          className={`text-sm ${
                            passwordReqs.minLength
                              ? "text-green-600"
                              : "text-gray-500"
                          }`}
                        >
                          <span className="mr-2">
                            {passwordReqs.minLength ? "✓" : "○"}
                          </span>
                          Minimum 8 characters
                        </div>
                        <div
                          className={`text-sm ${
                            passwordReqs.hasUpperCase
                              ? "text-green-600"
                              : "text-gray-500"
                          }`}
                        >
                          <span className="mr-2">
                            {passwordReqs.hasUpperCase ? "✓" : "○"}
                          </span>
                          Uppercase letter (A-Z)
                        </div>
                        <div
                          className={`text-sm ${
                            passwordReqs.hasLowerCase
                              ? "text-green-600"
                              : "text-gray-500"
                          }`}
                        >
                          <span className="mr-2">
                            {passwordReqs.hasLowerCase ? "✓" : "○"}
                          </span>
                          Lowercase letter (a-z)
                        </div>
                        <div
                          className={`text-sm ${
                            passwordReqs.hasNumber
                              ? "text-green-600"
                              : "text-gray-500"
                          }`}
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
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            </>
          )}

          {/* Back Button */}
          {step !== "email" && (
            <button
              onClick={() => {
                if (step === "verify") setStep("email");
                if (step === "reset") setStep("verify");
              }}
              className="w-full text-primary-600 py-2 font-semibold hover:text-primary-700 text-center mt-4"
            >
              Back
            </button>
          )}

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
