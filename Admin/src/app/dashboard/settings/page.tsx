"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState({
    appName: "Orgobloom",
    tagline: "Your trusted partner for premium organic products",
    email: "contact@orgobloom.com",
    phone: "+91 98765 43210",
    address: "123 Organic Lane, Green City",
    currency: "INR",
    timezone: "Asia/Kolkata",
    language: "English",
    theme: "light",
    emailNotifications: true,
    pushNotifications: true,
    twoFactor: false,
    maintenanceMode: false,
    maxProducts: "1000",
    maxOrders: "10000",
  });

  const [profileData, setProfileData] = useState({
    fullName: "Admin User",
    email: "admin@orgobloom.com",
    phone: "+91 98765 43210",
    department: "Business & Operations",
    joinDate: "15 Jan 2024",
  });

  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [introVideoUrl, setIntroVideoUrl] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  useEffect(() => {
    const loadIntroVideo = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/site-media/intro-video`,
        );
        const data = await response.json();
        setIntroVideoUrl(data?.url || null);
      } catch (error) {
        console.error("Failed to load intro video:", error);
      }
    };

    loadIntroVideo();
  }, []);

  const handleChange = (field: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
    setUnsavedChanges(true);
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setUnsavedChanges(true);
  };

  const handleSave = () => {
    toast.success("Changes saved successfully!");
    setUnsavedChanges(false);
  };

  const handleReset = () => {
    toast.error("Changes discarded");
    setUnsavedChanges(false);
  };

  const handleVideoUpload = async () => {
    if (!videoFile) {
      toast.error("Please select an MP4 video to upload");
      return;
    }

    setIsUploadingVideo(true);

    try {
      const data = new FormData();
      data.append("video", videoFile);
      const response = await adminApi.uploadIntroVideo(data);
      setIntroVideoUrl(response.data?.url || null);
      toast.success("Intro video updated");
      setVideoFile(null);
    } catch (error: any) {
      console.error("Intro video upload failed:", error);
      toast.error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to upload intro video",
      );
    } finally {
      setIsUploadingVideo(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Settings & Profile</h1>
        {unsavedChanges && (
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>

      {unsavedChanges && (
        <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            You have unsaved changes. Don't forget to save them!
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2 sticky top-20">
            {[
              { id: "profile", label: "👤 Profile", icon: "👤" },
              { id: "general", label: "General", icon: "⚙️" },
              { id: "contact", label: "Contact", icon: "📞" },
              { id: "regional", label: "Regional", icon: "🌐" },
              { id: "notifications", label: "Notifications", icon: "🔔" },
              { id: "security", label: "Security", icon: "🔒" },
              { id: "system", label: "System Limits", icon: "📊" },
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id)}
                className={`w-full text-left px-4 py-2 rounded-lg transition text-sm font-medium ${
                  activeTab === section.id
                    ? "bg-primary-100 text-primary-600 border-l-4 border-primary-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <span className="mr-2">👤</span> Admin Profile
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center mb-6">
                    <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-3xl">
                      👨‍💼
                    </div>
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900">
                        {profileData.fullName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {profileData.department}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.fullName}
                      onChange={(e) =>
                        handleProfileChange("fullName", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        handleProfileChange("email", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) =>
                        handleProfileChange("phone", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        value={profileData.department}
                        onChange={(e) =>
                          handleProfileChange("department", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Join Date
                      </label>
                      <input
                        type="text"
                        disabled
                        value={profileData.joinDate}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                      />
                    </div>
                  </div>
                  <button className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition text-sm font-medium mt-4">
                    Change Password
                  </button>
                </div>
              </div>
            </>
          )}

          {/* General Settings Tab */}
          {activeTab === "general" && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">⚙️</span> General Settings
              </h2>
              <div className="mb-8 rounded-lg border border-gray-200 p-4">
                <h3 className="text-base font-semibold mb-3">
                  Intro Video Panel
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload a site-wide MP4 intro video shown before the homepage
                  content.
                </p>
                <input
                  type="file"
                  accept="video/mp4"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-600 file:px-4 file:py-2 file:text-white hover:file:bg-primary-700"
                />
                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleVideoUpload}
                    disabled={isUploadingVideo}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                  >
                    {isUploadingVideo ? "Uploading..." : "Upload Video"}
                  </button>
                  {introVideoUrl && (
                    <a
                      href={introVideoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary-600 hover:underline"
                    >
                      View current video
                    </a>
                  )}
                </div>
                {introVideoUrl && (
                  <div className="mt-4">
                    <video
                      src={introVideoUrl}
                      controls
                      className="w-full rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    App Name
                  </label>
                  <input
                    type="text"
                    value={settings.appName}
                    onChange={(e) => handleChange("appName", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={settings.tagline}
                    onChange={(e) => handleChange("tagline", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Theme
                  </label>
                  <select
                    value={settings.theme}
                    onChange={(e) => handleChange("theme", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) =>
                        handleChange("maintenanceMode", e.target.checked)
                      }
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Maintenance Mode
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    When enabled, only admins can access the system
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Contact Information Tab */}
          {activeTab === "contact" && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">📞</span> Contact Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={settings.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Regional Settings Tab */}
          {activeTab === "regional" && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">🌐</span> Regional Settings
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleChange("currency", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  >
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="GBP">British Pound (£)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone
                  </label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => handleChange("timezone", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">
                      America/New_York (EST)
                    </option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => handleChange("language", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings Tab */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">🔔</span> Notification Settings
              </h2>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) =>
                      handleChange("emailNotifications", e.target.checked)
                    }
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Email Notifications
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={(e) =>
                      handleChange("pushNotifications", e.target.checked)
                    }
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Push Notifications
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">🔒</span> Security
              </h2>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.twoFactor}
                    onChange={(e) =>
                      handleChange("twoFactor", e.target.checked)
                    }
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Two-Factor Authentication
                  </span>
                </label>
                <button className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition text-sm font-medium mt-4">
                  Change Admin Password
                </button>
              </div>
            </div>
          )}

          {/* System Limits Tab */}
          {activeTab === "system" && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">📊</span> System Limits
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Products
                  </label>
                  <input
                    type="number"
                    value={settings.maxProducts}
                    onChange={(e) =>
                      handleChange("maxProducts", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Orders
                  </label>
                  <input
                    type="number"
                    value={settings.maxOrders}
                    onChange={(e) => handleChange("maxOrders", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                </div>
              </div>

              {/* System Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  System Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">App Version</span>
                    <span className="font-medium">2.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated</span>
                    <span className="font-medium">14 Feb 2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className="font-medium text-green-600">
                      ✓ Running
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Database</span>
                    <span className="font-medium">Connected</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
