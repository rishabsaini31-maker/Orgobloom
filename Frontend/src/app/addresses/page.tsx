"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    isDefault: false,
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await axios.get(`${apiUrl}/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAddresses(response.data.addresses || []);
    } catch (error: any) {
      console.error("Error fetching addresses:", error);
      if (error.response?.status === 401) {
        router.push("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      if (editingAddress) {
        // Update existing address
        await axios.put(`${apiUrl}/addresses/${editingAddress.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Address updated successfully");
      } else {
        // Create new address
        await axios.post(`${apiUrl}/addresses`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Address added successfully");
      }

      setShowForm(false);
      setEditingAddress(null);
      resetForm();
      fetchAddresses();
    } catch (error: any) {
      console.error("Error saving address:", error);
      toast.error(error.response?.data?.error || "Failed to save address");
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm("Are you sure you want to delete this address?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      await axios.delete(`${apiUrl}/addresses/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Address deleted successfully");
      fetchAddresses();
    } catch (error: any) {
      console.error("Error deleting address:", error);
      toast.error(error.response?.data?.error || "Failed to delete address");
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      await axios.post(
        `${apiUrl}/addresses/${addressId}/default`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast.success("Default address updated");
      fetchAddresses();
    } catch (error: any) {
      console.error("Error setting default address:", error);
      toast.error(
        error.response?.data?.error || "Failed to set default address",
      );
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      isDefault: false,
    });
  };

  const openAddForm = () => {
    resetForm();
    setEditingAddress(null);
    setShowForm(true);
  };

  const openEditForm = (address: Address) => {
    setFormData({
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: "India",
      isDefault: address.isDefault,
    });
    setEditingAddress(address);
    setShowForm(true);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors mb-6"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Saved Addresses
                </h1>
                <p className="text-gray-600">Manage your delivery addresses</p>
              </div>
              <button
                onClick={openAddForm}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
              >
                + Add New Address
              </button>
            </div>

            {/* Address Form Modal */}
            {showForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4">
                    {editingAddress ? "Edit Address" : "Add New Address"}
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 1 *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.addressLine1}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            addressLine1: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        placeholder="House/Flat No., Building Name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        value={formData.addressLine2}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            addressLine2: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        placeholder="Street, Area, Landmark"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.state}
                          onChange={(e) =>
                            setFormData({ ...formData, state: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.pincode}
                        onChange={(e) =>
                          setFormData({ ...formData, pincode: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={formData.isDefault}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isDefault: e.target.checked,
                          })
                        }
                        className="w-4 h-4"
                      />
                      <label
                        htmlFor="isDefault"
                        className="text-sm text-gray-700"
                      >
                        Set as default address
                      </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          setEditingAddress(null);
                          resetForm();
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                      >
                        {editingAddress ? "Update" : "Add Address"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-600">Loading addresses...</p>
              </div>
            ) : addresses.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <svg
                  className="w-16 h-16 mx-auto text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <p className="text-gray-600 mb-4">No saved addresses yet</p>
                <button
                  onClick={openAddForm}
                  className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Add Your First Address
                </button>
              </div>
            ) : (
              /* Address List */
              <div className="space-y-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="bg-white rounded-lg border border-gray-200 p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {addr.fullName}
                          </h3>
                          {addr.isDefault && (
                            <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 mb-1">
                          {addr.addressLine1}
                        </p>
                        {addr.addressLine2 && (
                          <p className="text-gray-700 mb-1">
                            {addr.addressLine2}
                          </p>
                        )}
                        <p className="text-gray-600 mb-1">
                          {addr.city}, {addr.state} {addr.pincode}
                        </p>
                        <p className="text-gray-600 text-sm">
                          Phone: {addr.phone}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => openEditForm(addr)}
                          className="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 border border-primary-600 rounded transition-colors"
                        >
                          Edit
                        </button>
                        {!addr.isDefault && (
                          <button
                            onClick={() => handleSetDefault(addr.id)}
                            className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 border border-green-600 rounded transition-colors"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(addr.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 border border-red-600 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
