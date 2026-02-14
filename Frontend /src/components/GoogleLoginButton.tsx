"use client";

import { useState } from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
}

export default function GoogleLoginButton({
  onSuccess,
}: GoogleLoginButtonProps) {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
    // Prevent double submission
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      console.log("Google login attempt");
      const response = await authApi.googleLogin({
        token: credentialResponse.credential,
      });

      console.log("Google login response:", response.data);
      const { user, token } = response.data;

      if (!user || !token) {
        throw new Error("Invalid response: missing user or token");
      }

      setAuth(user, token);
      toast.success("Logged in successfully!");

      // Give state time to update before redirecting
      setTimeout(() => {
        onSuccess?.();
        router.push("/");
      }, 500);
    } catch (error: any) {
      console.error("Google login error:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Google login failed";
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  const handleGoogleError = () => {
    toast.error("Google login failed. Please try again.");
  };

  return (
    <div className="flex justify-center my-4">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
      />
    </div>
  );
}
