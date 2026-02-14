"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { useState } from "react";
import toast from "react-hot-toast";

export default function CustomizeAppPage() {
  const [isEditing, setIsEditing] = useState(false);
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
              onClick={() => updateSettings.mutate()}
              disabled={updateSettings.isPending}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition disabled:opacity-50"
            >
              {updateSettings.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

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
    </div>
  );
}
