"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { useState, useRef } from "react";
import toast from "react-hot-toast";

export default function CustomizeAppPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "images" | "content">(
    "general",
  );
  const [appSettings, setAppSettings] = useState({
    appName: "Orgobloom",
    appDescription: "Premium organic products marketplace",
    logo: "",
    primaryColor: "#3b82f6",
    secondaryColor: "#10b981",
    accentColor: "#f59e0b",
    emailFrom: "noreply@orgobloom.com",
    supportEmail: "support@orgobloom.com",
    currency: "INR",
    timezone: "Asia/Kolkata",
    maintenanceMode: false,
    enableRegistration: true,
    enableGuestCheckout: true,
    maxOrderQuantity: 999,
    minOrderAmount: 0,
    freeShippingThreshold: 500,
    shippingCost: 50,
    taxRate: 18,
  });

  // Image settings state
  const [imageSettings, setImageSettings] = useState({
    heroImage: "/images/plant2.jpg",
    heroImageAlt: "Why Choose Orgobloom",
    advertisingImage: "/images/advertising.jpeg",
    advertisingImageAlt: "Orgobloom Advertising",
    aboutImage: "/images/plant.jpg",
    aboutImageAlt: "About Orgobloom",
    testimonialBackground: "",
    ctaBackground: "",
  });

  // Content settings state
  const [contentSettings, setContentSettings] = useState({
    heroTitle: "Premium Organic Fertilizers",
    heroSubtitle:
      "Handcrafted with care, our organic fertilizers are designed to nourish your soil and boost crop yields naturally.",
    benefitsTitle: "Benefits of Organic Fertilizers",
    whyChooseUsTitle: "The Orgobloom Difference",
    advertisingTitle: "Now available on major E-Commerce Platforms",
    advertisingSubtitle: "Fast delivery, secure payments, and trusted service",
    ctaTitle: "Ready to Grow Naturally?",
    ctaSubtitle:
      "Join thousands of farmers who trust Orgobloom for their organic farming needs.",
    footerAbout:
      "Premium organic fertilizers for sustainable farming. Nourish your soil, naturally.",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
    try {
      const formData = new FormData();
      formData.append("images", file);

      const response = await adminApi.uploadProductImages(formData);
      const uploadedUrls = response.data?.urls || [];

      if (uploadedUrls.length > 0) {
        setImageSettings((prev) => ({
          ...prev,
          [field]: uploadedUrls[0],
        }));
        toast.success("Image uploaded successfully!");
      }
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploadingField(null);
    }
  };

  const triggerFileInput = (field: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.dataset.field = field;
      fileInputRef.current.click();
    }
  };

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["app-settings"],
    queryFn: () => adminApi.getAppSettings(),
  });

  // Update settings when data is fetched
  if (
    settingsData?.data &&
    JSON.stringify(settingsData.data) !== JSON.stringify(appSettings)
  ) {
    setAppSettings(settingsData.data);
  }

  const updateSettings = useMutation({
    mutationFn: () => adminApi.updateAppSettings(appSettings),
    onSuccess: () => {
      toast.success("Settings updated successfully!");
      setIsEditing(false);
    },
    onError: () => {
      toast.error("Failed to update settings");
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setAppSettings({
      ...appSettings,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleColorChange = (colorKey: string, value: string) => {
    setAppSettings({
      ...appSettings,
      [colorKey]: value,
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">App Customization</h1>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition"
          >
            Edit Settings
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                updateSettings.mutate();
                toast.success("All settings saved successfully!");
              }}
              disabled={updateSettings.isPending}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition disabled:opacity-50"
            >
              {updateSettings.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2 font-medium text-sm transition border-b-2 ${
            activeTab === "general"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          General Settings
        </button>
        <button
          onClick={() => setActiveTab("images")}
          className={`px-4 py-2 font-medium text-sm transition border-b-2 ${
            activeTab === "images"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Images
        </button>
        <button
          onClick={() => setActiveTab("content")}
          className={`px-4 py-2 font-medium text-sm transition border-b-2 ${
            activeTab === "content"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Content
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const field = e.currentTarget.dataset.field;
          if (field) handleImageUpload(e, field);
        }}
      />

      {/* General Settings Tab */}
      {activeTab === "general" && (
        <>
          {/* General Settings */}
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-6">General Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  App Name
                </label>
                <input
                  type="text"
                  name="appName"
                  value={appSettings.appName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  App Description
                </label>
                <input
                  type="text"
                  name="appDescription"
                  value={appSettings.appDescription}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  name="currency"
                  value={appSettings.currency}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                >
                  <option>INR</option>
                  <option>USD</option>
                  <option>EUR</option>
                  <option>GBP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  name="timezone"
                  value={appSettings.timezone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                >
                  <option>Asia/Kolkata</option>
                  <option>UTC</option>
                  <option>America/New_York</option>
                  <option>Europe/London</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Settings */}
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-6">Contact Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email From
                </label>
                <input
                  type="email"
                  name="emailFrom"
                  value={appSettings.emailFrom}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Support Email
                </label>
                <input
                  type="email"
                  name="supportEmail"
                  value={appSettings.supportEmail}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Theme Colors */}
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-6">Theme Colors</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={appSettings.primaryColor}
                    onChange={(e) =>
                      handleColorChange("primaryColor", e.target.value)
                    }
                    disabled={!isEditing}
                    className="w-12 h-12 border rounded-lg cursor-pointer disabled:cursor-not-allowed"
                  />
                  <input
                    type="text"
                    value={appSettings.primaryColor}
                    onChange={(e) =>
                      handleColorChange("primaryColor", e.target.value)
                    }
                    disabled={!isEditing}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={appSettings.secondaryColor}
                    onChange={(e) =>
                      handleColorChange("secondaryColor", e.target.value)
                    }
                    disabled={!isEditing}
                    className="w-12 h-12 border rounded-lg cursor-pointer disabled:cursor-not-allowed"
                  />
                  <input
                    type="text"
                    value={appSettings.secondaryColor}
                    onChange={(e) =>
                      handleColorChange("secondaryColor", e.target.value)
                    }
                    disabled={!isEditing}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={appSettings.accentColor}
                    onChange={(e) =>
                      handleColorChange("accentColor", e.target.value)
                    }
                    disabled={!isEditing}
                    className="w-12 h-12 border rounded-lg cursor-pointer disabled:cursor-not-allowed"
                  />
                  <input
                    type="text"
                    value={appSettings.accentColor}
                    onChange={(e) =>
                      handleColorChange("accentColor", e.target.value)
                    }
                    disabled={!isEditing}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Business Settings */}
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-6">Business Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Order Amount (₹)
                </label>
                <input
                  type="number"
                  name="minOrderAmount"
                  value={appSettings.minOrderAmount}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Free Shipping Threshold (₹)
                </label>
                <input
                  type="number"
                  name="freeShippingThreshold"
                  value={appSettings.freeShippingThreshold}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Cost (₹)
                </label>
                <input
                  type="number"
                  name="shippingCost"
                  value={appSettings.shippingCost}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  name="taxRate"
                  value={appSettings.taxRate}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Order Quantity
                </label>
                <input
                  type="number"
                  name="maxOrderQuantity"
                  value={appSettings.maxOrderQuantity}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="card">
            <h2 className="text-xl font-bold mb-6">Feature Toggles</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-gray-700">
                  Maintenance Mode
                </label>
                <input
                  type="checkbox"
                  name="maintenanceMode"
                  checked={appSettings.maintenanceMode}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-5 h-5 rounded disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-gray-700">
                  Enable Registration
                </label>
                <input
                  type="checkbox"
                  name="enableRegistration"
                  checked={appSettings.enableRegistration}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-5 h-5 rounded disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-gray-700">
                  Enable Guest Checkout
                </label>
                <input
                  type="checkbox"
                  name="enableGuestCheckout"
                  checked={appSettings.enableGuestCheckout}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-5 h-5 rounded disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Images Tab */}
      {activeTab === "images" && (
        <div className="space-y-6">
          {/* Hero Section Image */}
          <div className="card">
            <h2 className="text-xl font-bold mb-6">Hero Section Image</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hero Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                  {imageSettings.heroImage ? (
                    <div className="relative">
                      <img
                        src={imageSettings.heroImage}
                        alt={imageSettings.heroImageAlt}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      {isEditing && (
                        <button
                          onClick={() => triggerFileInput("heroImage")}
                          disabled={uploadingField === "heroImage"}
                          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition rounded-lg"
                        >
                          <span className="text-white font-medium">
                            {uploadingField === "heroImage"
                              ? "Uploading..."
                              : "Change Image"}
                          </span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => triggerFileInput("heroImage")}
                      disabled={!isEditing || uploadingField === "heroImage"}
                      className="w-full h-48 flex items-center justify-center text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    >
                      {uploadingField === "heroImage"
                        ? "Uploading..."
                        : "Click to upload image"}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hero Image Alt Text
                </label>
                <input
                  type="text"
                  value={imageSettings.heroImageAlt}
                  onChange={(e) =>
                    setImageSettings({
                      ...imageSettings,
                      heroImageAlt: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                  placeholder="Describe the hero image"
                />
              </div>
            </div>
          </div>

          {/* Advertising Section Image */}
          <div className="card">
            <h2 className="text-xl font-bold mb-6">
              Advertising Section Image
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Advertising Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                  {imageSettings.advertisingImage ? (
                    <div className="relative">
                      <img
                        src={imageSettings.advertisingImage}
                        alt={imageSettings.advertisingImageAlt}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      {isEditing && (
                        <button
                          onClick={() => triggerFileInput("advertisingImage")}
                          disabled={uploadingField === "advertisingImage"}
                          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition rounded-lg"
                        >
                          <span className="text-white font-medium">
                            {uploadingField === "advertisingImage"
                              ? "Uploading..."
                              : "Change Image"}
                          </span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => triggerFileInput("advertisingImage")}
                      disabled={
                        !isEditing || uploadingField === "advertisingImage"
                      }
                      className="w-full h-48 flex items-center justify-center text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    >
                      {uploadingField === "advertisingImage"
                        ? "Uploading..."
                        : "Click to upload image"}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Advertising Image Alt Text
                </label>
                <input
                  type="text"
                  value={imageSettings.advertisingImageAlt}
                  onChange={(e) =>
                    setImageSettings({
                      ...imageSettings,
                      advertisingImageAlt: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                  placeholder="Describe the advertising image"
                />
              </div>
            </div>
          </div>

          {/* About Section Image */}
          <div className="card">
            <h2 className="text-xl font-bold mb-6">About Section Image</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  About Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                  {imageSettings.aboutImage ? (
                    <div className="relative">
                      <img
                        src={imageSettings.aboutImage}
                        alt={imageSettings.aboutImageAlt}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      {isEditing && (
                        <button
                          onClick={() => triggerFileInput("aboutImage")}
                          disabled={uploadingField === "aboutImage"}
                          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition rounded-lg"
                        >
                          <span className="text-white font-medium">
                            {uploadingField === "aboutImage"
                              ? "Uploading..."
                              : "Change Image"}
                          </span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => triggerFileInput("aboutImage")}
                      disabled={!isEditing || uploadingField === "aboutImage"}
                      className="w-full h-48 flex items-center justify-center text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    >
                      {uploadingField === "aboutImage"
                        ? "Uploading..."
                        : "Click to upload image"}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  About Image Alt Text
                </label>
                <input
                  type="text"
                  value={imageSettings.aboutImageAlt}
                  onChange={(e) =>
                    setImageSettings({
                      ...imageSettings,
                      aboutImageAlt: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                  placeholder="Describe the about image"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Tab */}
      {activeTab === "content" && (
        <div className="space-y-6">
          {/* Hero Section Content */}
          <div className="card">
            <h2 className="text-xl font-bold mb-6">Hero Section</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hero Title
                </label>
                <input
                  type="text"
                  value={contentSettings.heroTitle}
                  onChange={(e) =>
                    setContentSettings({
                      ...contentSettings,
                      heroTitle: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hero Subtitle
                </label>
                <textarea
                  value={contentSettings.heroSubtitle}
                  onChange={(e) =>
                    setContentSettings({
                      ...contentSettings,
                      heroSubtitle: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Benefits Section Content */}
          <div className="card">
            <h2 className="text-xl font-bold mb-6">Benefits Section</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Benefits Title
              </label>
              <input
                type="text"
                value={contentSettings.benefitsTitle}
                onChange={(e) =>
                  setContentSettings({
                    ...contentSettings,
                    benefitsTitle: e.target.value,
                  })
                }
                disabled={!isEditing}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Why Choose Us Section Content */}
          <div className="card">
            <h2 className="text-xl font-bold mb-6">Why Choose Us Section</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section Title
              </label>
              <input
                type="text"
                value={contentSettings.whyChooseUsTitle}
                onChange={(e) =>
                  setContentSettings({
                    ...contentSettings,
                    whyChooseUsTitle: e.target.value,
                  })
                }
                disabled={!isEditing}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Advertising Section Content */}
          <div className="card">
            <h2 className="text-xl font-bold mb-6">Advertising Section</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Advertising Title
                </label>
                <input
                  type="text"
                  value={contentSettings.advertisingTitle}
                  onChange={(e) =>
                    setContentSettings({
                      ...contentSettings,
                      advertisingTitle: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Advertising Subtitle
                </label>
                <input
                  type="text"
                  value={contentSettings.advertisingSubtitle}
                  onChange={(e) =>
                    setContentSettings({
                      ...contentSettings,
                      advertisingSubtitle: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* CTA Section Content */}
          <div className="card">
            <h2 className="text-xl font-bold mb-6">Call to Action Section</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CTA Title
                </label>
                <input
                  type="text"
                  value={contentSettings.ctaTitle}
                  onChange={(e) =>
                    setContentSettings({
                      ...contentSettings,
                      ctaTitle: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CTA Subtitle
                </label>
                <textarea
                  value={contentSettings.ctaSubtitle}
                  onChange={(e) =>
                    setContentSettings({
                      ...contentSettings,
                      ctaSubtitle: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Footer Content */}
          <div className="card">
            <h2 className="text-xl font-bold mb-6">Footer Section</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Footer About Text
              </label>
              <textarea
                value={contentSettings.footerAbout}
                onChange={(e) =>
                  setContentSettings({
                    ...contentSettings,
                    footerAbout: e.target.value,
                  })
                }
                disabled={!isEditing}
                rows={2}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
