import axios from "axios";

// Use environment variable or fallback based on environment
const getApiUrl = () => {
  // First priority: environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // Fallback for development
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    return "http://localhost:8000/api";
  }
  // Production fallback
  console.warn(
    "NEXT_PUBLIC_API_URL is not set. Please configure it in Vercel environment variables.",
  );
  return "https://orgobloom.onrender.com/api";
};

const API_URL = getApiUrl();

console.log("[API] Using API URL:", API_URL);
console.log(
  "[API] NEXT_PUBLIC_API_URL env var:",
  process.env.NEXT_PUBLIC_API_URL || "NOT SET",
);

// Make API URL available for debugging
if (typeof window !== "undefined") {
  (window as any).__NEXT_PUBLIC_API_URL = API_URL;
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 second timeout
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        // Enhanced error logging for debugging
        console.error("[AUTH] 401 Unauthorized detected by axios interceptor");
        console.error("[AUTH] Error response:", error.response);
        console.error("[AUTH] Error data:", error.response?.data);
        // Optionally show a toast or alert here
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Give user time to see the error before redirect
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      }
    }
    return Promise.reject(error);
  },
);

// Admin API
export const adminApi = {
  getOrders: (params?: any) => api.get("/admin/orders", { params }),
  updateOrderStatus: (id: string, data: any) =>
    api.patch(`/admin/orders/${id}/status`, data),
  uploadProductImages: (data: FormData) =>
    api.post("/admin/uploads/products", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getAnalytics: () => api.get("/admin/analytics"),
  getAdvancedAnalytics: (timeRange: string) =>
    api.get("/admin/analytics/advanced", { params: { timeRange } }),
  getPayments: (status?: string) =>
    api.get("/admin/payments", { params: { status } }),
  retryPayment: (paymentId: string) =>
    api.post(`/admin/payments/${paymentId}/retry`),
  getAppSettings: () =>
    api.get("/admin/settings", {
      params: { _t: Date.now() }, // Cache-busting timestamp
    }),
  updateAppSettings: (data: any) => api.put("/admin/settings", data),
  // Site Media Settings (images, content, SEO)
  getSiteSettings: () =>
    api.get("/site-media/settings", {
      params: { _t: Date.now() }, // Cache-busting timestamp
    }),
  updateSiteSettings: (data: any) => api.put("/site-media/settings", data),
  uploadIntroVideos: (data: FormData) =>
    api.post("/site-media/intro-videos", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getIntroVideos: () => api.get("/site-media/intro-videos"),
  deleteIntroVideo: (videoUrl: string) =>
    api.delete(
      `/site-media/intro-videos?videoUrl=${encodeURIComponent(videoUrl)}`,
    ),
  getCustomers: (params?: any) => api.get("/customers", { params }),
  getProducts: (params?: any) => api.get("/admin/products", { params }),
  createProduct: (data: any) => api.post("/admin/products", data),
  updateProduct: (id: string, data: any) =>
    api.put(`/admin/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`),
  getInventory: (params?: any) => api.get("/admin/inventory", { params }),
  updateInventory: (productId: string, data: any) =>
    api.patch(`/admin/inventory/${productId}`, data),
};

// Customers API
export const customersApi = {
  getAll: (params?: any) => api.get("/customers", { params }),
  getProblematic: (params?: any) =>
    api.get("/customers/problematic", { params }),
  getById: (customerId: string) => api.get(`/customers/${customerId}`),
  blockCustomer: (customerId: string, data?: any) =>
    api.post(`/customers/${customerId}/block`, data),
  unblockCustomer: (customerId: string) =>
    api.post(`/customers/${customerId}/unblock`),
};

// Products API
export const productsApi = {
  getAll: (params?: any) => api.get("/products", { params }),
  create: (data: any) => api.post("/products", data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// Auth API
export const authApi = {
  login: (data: any) => api.post("/auth/login", data),
};

// User API
export const userApi = {
  getProfile: () => api.get("/user/me"),
  updateProfile: (data: any) => api.put("/user/profile", data),
  changePassword: (data: any) => api.put("/user/password", data),
};

// Reviews API
export const reviewsApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get("/reviews/admin/all", { params }),
  moderate: (
    id: string,
    data: { isApproved?: boolean; isFeatured?: boolean },
  ) => api.patch(`/reviews/${id}/moderate`, data),
  delete: (id: string) => api.delete(`/reviews/${id}`),
};

// Notifications API (Socket.io status)
export const notificationsApi = {
  getStatus: () => api.get("/admin/notifications/status"),
};

export default api;
