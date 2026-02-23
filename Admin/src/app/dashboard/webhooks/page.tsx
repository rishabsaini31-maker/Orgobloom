"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Webhook,
  Plus,
  Trash2,
  Edit,
  Play,
  RefreshCw,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Settings,
  Link2,
} from "lucide-react";
import toast from "react-hot-toast";

interface WebhookItem {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  status: string;
  description?: string;
  lastDeliveryAt?: string;
  lastDeliveryStatus?: string;
  failureCount: string;
  createdAt: string;
}

interface Delivery {
  id: string;
  webhookId: string;
  event: string;
  status: string;
  responseStatusCode?: string;
  errorMessage?: string;
  attemptNumber: string;
  duration?: string;
  createdAt: string;
}

const WEBHOOK_EVENTS = [
  { value: "order.created", label: "Order Created" },
  { value: "order.updated", label: "Order Updated" },
  { value: "order.cancelled", label: "Order Cancelled" },
  { value: "order.delivered", label: "Order Delivered" },
  { value: "payment.captured", label: "Payment Captured" },
  { value: "payment.failed", label: "Payment Failed" },
  { value: "payment.refunded", label: "Payment Refunded" },
  { value: "shipment.created", label: "Shipment Created" },
  { value: "shipment.updated", label: "Shipment Updated" },
  { value: "shipment.delivered", label: "Shipment Delivered" },
  { value: "user.registered", label: "User Registered" },
  { value: "review.created", label: "Review Created" },
  { value: "product.low_stock", label: "Product Low Stock" },
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeliveriesModal, setShowDeliveriesModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookItem | null>(
    null,
  );
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    description: "",
    events: [] as string[],
    retryCount: "3",
    retryDelay: "1000",
    timeout: "30000",
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${apiUrl}/webhooks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWebhooks(response.data.webhooks);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to fetch webhooks");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${apiUrl}/webhooks`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNewSecret(response.data.secret);
      toast.success("Webhook created successfully!");
      fetchWebhooks();
      setShowCreateModal(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create webhook");
    }
  };

  const handleUpdate = async () => {
    if (!selectedWebhook) return;

    try {
      const token = localStorage.getItem("token");
      await axios.put(`${apiUrl}/webhooks/${selectedWebhook.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Webhook updated successfully!");
      fetchWebhooks();
      setShowEditModal(false);
      setSelectedWebhook(null);
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update webhook");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${apiUrl}/webhooks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Webhook deleted successfully!");
      fetchWebhooks();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete webhook");
    }
  };

  const handleTest = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${apiUrl}/webhooks/${id}/test`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Test webhook sent!");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to send test webhook");
    }
  };

  const handleRegenerateSecret = async (id: string) => {
    if (!confirm("Are you sure? This will invalidate the current secret."))
      return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${apiUrl}/webhooks/${id}/regenerate-secret`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNewSecret(response.data.secret);
      toast.success("Secret regenerated successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to regenerate secret");
    }
  };

  const fetchDeliveries = async (webhookId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${apiUrl}/webhooks/${webhookId}/deliveries`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setDeliveries(response.data.deliveries);
    } catch (error: any) {
      toast.error("Failed to fetch deliveries");
    }
  };

  const handleRetryDelivery = async (deliveryId: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${apiUrl}/webhooks/deliveries/${deliveryId}/retry`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Webhook delivery retried!");
      if (selectedWebhook) {
        fetchDeliveries(selectedWebhook.id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to retry delivery");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      url: "",
      description: "",
      events: [],
      retryCount: "3",
      retryDelay: "1000",
      timeout: "30000",
    });
  };

  const openEditModal = (webhook: WebhookItem) => {
    setSelectedWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      description: webhook.description || "",
      events: webhook.events,
      retryCount: webhook.failureCount || "3",
      retryDelay: "1000",
      timeout: "30000",
    });
    setShowEditModal(true);
  };

  const openDeliveriesModal = (webhook: WebhookItem) => {
    setSelectedWebhook(webhook);
    fetchDeliveries(webhook.id);
    setShowDeliveriesModal(true);
  };

  const toggleEvent = (event: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            Active
          </span>
        );
      case "inactive":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            Inactive
          </span>
        );
      case "failed":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
            Failed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            {status}
          </span>
        );
    }
  };

  const getDeliveryStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "retrying":
        return <RefreshCw className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Webhooks</h1>
          <p className="text-gray-600 mt-1">
            Manage webhooks for real-time event notifications
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          <Plus className="w-5 h-5" />
          Create Webhook
        </button>
      </div>

      {/* New Secret Display */}
      {newSecret && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Webhook className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                New Webhook Secret
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Copy this secret now. It won't be shown again.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="px-3 py-1 bg-yellow-100 rounded text-sm font-mono">
                  {newSecret}
                </code>
                <button
                  onClick={() => copyToClipboard(newSecret)}
                  className="p-1 hover:bg-yellow-200 rounded"
                >
                  <Copy className="w-4 h-4 text-yellow-700" />
                </button>
              </div>
            </div>
            <button
              onClick={() => setNewSecret(null)}
              className="text-yellow-600 hover:text-yellow-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Webhooks List */}
      {webhooks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Webhook className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No webhooks yet</h3>
          <p className="text-gray-600 mt-1">
            Create your first webhook to receive event notifications
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Create Webhook
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {webhook.name}
                    </h3>
                    {getStatusBadge(webhook.status)}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <Link2 className="w-4 h-4" />
                    <span className="font-mono">{webhook.url}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {webhook.events.map((event) => (
                      <span
                        key={event}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                  {webhook.lastDeliveryAt && (
                    <div className="mt-2 text-sm text-gray-500">
                      Last delivery:{" "}
                      {new Date(webhook.lastDeliveryAt).toLocaleString()}
                      {webhook.lastDeliveryStatus && (
                        <span
                          className={`ml-2 ${
                            webhook.lastDeliveryStatus === "success"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          ({webhook.lastDeliveryStatus})
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTest(webhook.id)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    title="Test webhook"
                  >
                    <Play className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openDeliveriesModal(webhook)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    title="View deliveries"
                  >
                    <Clock className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openEditModal(webhook)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    title="Edit webhook"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleRegenerateSecret(webhook.id)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    title="Regenerate secret"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(webhook.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete webhook"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {showCreateModal ? "Create Webhook" : "Edit Webhook"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="My Webhook"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="https://example.com/webhook"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  rows={2}
                  placeholder="Webhook description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Events
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {WEBHOOK_EVENTS.map((event) => (
                    <label
                      key={event.value}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={formData.events.includes(event.value)}
                        onChange={() => toggleEvent(event.value)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      {event.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Retry Count
                  </label>
                  <input
                    type="number"
                    value={formData.retryCount}
                    onChange={(e) =>
                      setFormData({ ...formData, retryCount: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Retry Delay (ms)
                  </label>
                  <input
                    type="number"
                    value={formData.retryDelay}
                    onChange={(e) =>
                      setFormData({ ...formData, retryDelay: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timeout (ms)
                  </label>
                  <input
                    type="number"
                    value={formData.timeout}
                    onChange={(e) =>
                      setFormData({ ...formData, timeout: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedWebhook(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={showCreateModal ? handleCreate : handleUpdate}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                {showCreateModal ? "Create" : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deliveries Modal */}
      {showDeliveriesModal && selectedWebhook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                Delivery History - {selectedWebhook.name}
              </h2>
              <button
                onClick={() => {
                  setShowDeliveriesModal(false);
                  setSelectedWebhook(null);
                  setDeliveries([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            {deliveries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No delivery history yet
              </div>
            ) : (
              <div className="space-y-3">
                {deliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getDeliveryStatusIcon(delivery.status)}
                      <div>
                        <div className="font-medium text-sm">
                          {delivery.event}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(delivery.createdAt).toLocaleString()}
                          {delivery.responseStatusCode && (
                            <span className="ml-2">
                              • HTTP {delivery.responseStatusCode}
                            </span>
                          )}
                          {delivery.duration && (
                            <span className="ml-2">
                              • {delivery.duration}ms
                            </span>
                          )}
                        </div>
                        {delivery.errorMessage && (
                          <div className="text-xs text-red-600 mt-1">
                            {delivery.errorMessage}
                          </div>
                        )}
                      </div>
                    </div>
                    {delivery.status === "failed" && (
                      <button
                        onClick={() => handleRetryDelivery(delivery.id)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
