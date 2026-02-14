"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

function AdminProfilePageContent() {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const tab = searchParams.get("tab") || "profile";

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // API call would go here
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      // API call would go here
      toast.success("Password updated successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error("Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        <a
          href="/dashboard/profile"
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === "profile"
              ? "text-primary-600 border-primary-600"
              : "text-gray-600 border-transparent hover:text-gray-900"
          }`}
        >
          Profile
        </a>
        <a
          href="/dashboard/profile?tab=settings"
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === "settings"
              ? "text-primary-600 border-primary-600"
              : "text-gray-600 border-transparent hover:text-gray-900"
          }`}
        >
          Settings
        </a>
        <a
          href="/dashboard/profile?tab=password"
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === "password"
              ? "text-primary-600 border-primary-600"
              : "text-gray-600 border-transparent hover:text-gray-900"
          }`}
        >
          Change Password
        </a>
      </div>

      {/* Profile Tab */}
      {tab === "profile" && (
        <div className="card max-w-2xl">
          <h2 className="text-xl font-bold mb-6">Admin Information</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
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
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleProfileChange}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Settings Tab */}
      {tab === "settings" && (
        <div className="card max-w-2xl">
          <h2 className="text-xl font-bold mb-6">Admin Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-600">
                  Receive admin alerts and updates
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <p className="font-medium text-gray-900">Daily Reports</p>
                <p className="text-sm text-gray-600">
                  Get daily business summary reports
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <p className="font-medium text-gray-900">Login Alerts</p>
                <p className="text-sm text-gray-600">
                  Notify on admin account login
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <p className="font-medium text-gray-900">
                  Two-Factor Authentication
                </p>
                <p className="text-sm text-gray-600">
                  Add extra security layer
                </p>
              </div>
              <button className="px-4 py-1 border border-yellow-600 text-yellow-600 rounded-lg hover:bg-yellow-50 font-medium">
                Enable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Tab */}
      {tab === "password" && (
        <div className="card max-w-2xl">
          <h2 className="text-xl font-bold mb-6">Change Password</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function AdminProfilePage() {
  return (
    <Suspense
      fallback={<div className="container mx-auto px-4 py-16">Loading...</div>}
    >
      <AdminProfilePageContent />
    </Suspense>
  );
}
