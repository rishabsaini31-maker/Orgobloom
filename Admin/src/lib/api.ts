import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
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
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
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
  getAppSettings: () => api.get("/admin/settings"),
  updateAppSettings: (data: any) => api.put("/admin/settings", data),
  uploadIntroVideo: (data: FormData) =>
    api.post("/site-media/intro-video", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
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

export default api;
