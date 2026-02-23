"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

interface BulkOperationsProps {
  selectedIds: string[];
  entityType: "products" | "orders" | "customers";
  onOperationComplete: () => void;
}

export default function BulkOperations({
  selectedIds,
  entityType,
  onOperationComplete,
}: BulkOperationsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  const executeBulkOperation = async (operation: string, data: any) => {
    if (selectedIds.length === 0) {
      toast.error("Please select items first");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${apiUrl}/bulk/${entityType}/${operation}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(`Successfully updated ${selectedIds.length} items`);
      onOperationComplete();
      setShowConfirm(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Operation failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">
          {selectedIds.length} selected
        </span>

        {entityType === "products" && (
          <>
            <select
              className="text-sm border border-gray-300 rounded px-3 py-1.5"
              onChange={(e) => {
                if (e.target.value) {
                  executeBulkOperation("status", {
                    productIds: selectedIds,
                    status: e.target.value,
                  });
                  e.target.value = "";
                }
              }}
              disabled={isLoading}
            >
              <option value="">Change Status...</option>
              <option value="ACTIVE">Set Active</option>
              <option value="INACTIVE">Set Inactive</option>
            </select>

            <button
              onClick={() => setShowConfirm("featured")}
              className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded hover:bg-yellow-200"
              disabled={isLoading}
            >
              Feature
            </button>

            <button
              onClick={() => setShowConfirm("delete")}
              className="text-sm bg-red-100 text-red-800 px-3 py-1.5 rounded hover:bg-red-200"
              disabled={isLoading}
            >
              Delete
            </button>
          </>
        )}

        {entityType === "orders" && (
          <select
            className="text-sm border border-gray-300 rounded px-3 py-1.5"
            onChange={(e) => {
              if (e.target.value) {
                executeBulkOperation("status", {
                  orderIds: selectedIds,
                  status: e.target.value,
                });
                e.target.value = "";
              }
            }}
            disabled={isLoading}
          >
            <option value="">Change Status...</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        )}

        {entityType === "customers" && (
          <>
            <button
              onClick={() =>
                executeBulkOperation("block", {
                  userIds: selectedIds,
                  blocked: true,
                  reason: "Bulk block operation",
                })
              }
              className="text-sm bg-red-100 text-red-800 px-3 py-1.5 rounded hover:bg-red-200"
              disabled={isLoading}
            >
              Block
            </button>

            <button
              onClick={() =>
                executeBulkOperation("block", {
                  userIds: selectedIds,
                  blocked: false,
                })
              }
              className="text-sm bg-green-100 text-green-800 px-3 py-1.5 rounded hover:bg-green-200"
              disabled={isLoading}
            >
              Unblock
            </button>

            <button
              onClick={() =>
                executeBulkOperation("export", { userIds: selectedIds })
              }
              className="text-sm bg-blue-100 text-blue-800 px-3 py-1.5 rounded hover:bg-blue-200"
              disabled={isLoading}
            >
              Export
            </button>
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirm Action</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to {showConfirm} {selectedIds.length} items?
              {showConfirm === "delete" && (
                <span className="block text-red-600 mt-2">
                  This action cannot be undone.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showConfirm === "delete") {
                    executeBulkOperation("delete", { productIds: selectedIds });
                  } else if (showConfirm === "featured") {
                    executeBulkOperation("featured", {
                      productIds: selectedIds,
                      featured: true,
                    });
                  }
                }}
                className={`px-4 py-2 rounded text-white ${
                  showConfirm === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-yellow-600 hover:bg-yellow-700"
                }`}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
