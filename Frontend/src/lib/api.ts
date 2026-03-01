// Blogs API
export const blogsApi = {
  getAll: (params?: any) => {
    const queryParams = {
      ...params,
      _t: params?._t || Date.now(),
    };
    return api.get("/blogs", {
      params: queryParams,
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
  },
  getById: (id: string) => api.get(`/blogs/${id}`),
  getBySlug: (slug: string) => api.get(`/blogs/slug/${slug}`),
};
import axios from "axios";

// Use environment variable or fallback based on environment
const getApiUrl = () => {
  // First priority: environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // Fallback for development - use port 8000
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    return "http://localhost:8000/api";
  }
  // Production fallback - this should be set in Vercel environment variables
  console.warn(
    "NEXT_PUBLIC_API_URL is not set. Please configure it in Vercel environment variables.",
  );
  return "http://localhost:8000/api";
};

const API_URL = getApiUrl();

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
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authApi = {
  register: (data: any) => api.post("/auth/register", data),
  login: (data: any) => api.post("/auth/login", data),
  googleLogin: (data: any) => api.post("/auth/google", data),
  forgotPassword: (data: any) => api.post("/auth/forgot-password", data),
  resetPassword: (data: any) => api.post("/auth/reset-password", data),
  post: (endpoint: string, data: any) => api.post(endpoint, data),
};

// Products API
export const productsApi = {
  getAll: (params?: any) => {
    return api.get("/products", {
      params: params,
    });
  },
  getById: (id: string) => api.get(`/products/${id}`),
  getBySlug: (slug: string) => api.get(`/products/slug/${slug}`),
};

// Site Settings API (public)
export const siteSettingsApi = {
  getSettings: () =>
    api.get("/site-media/settings", {
      params: { _t: Date.now() }, // Cache-busting timestamp
      headers: { "Cache-Control": "no-cache" },
    }),
  getIntroVideos: () => api.get("/site-media/intro-videos"),
};

// User API
export const userApi = {
  getProfile: () => api.get("/user/me"),
  updateProfile: (data: any) => api.put("/user/profile", data),
  changePassword: (data: any) => api.put("/user/password", data),
};

// Reviews API
export const reviewsApi = {
  getByProduct: (
    productId: string,
    params?: { page?: number; limit?: number },
  ) => api.get(`/reviews/product/${productId}`, { params }),
  create: (data: {
    productId: string;
    rating: number;
    title?: string;
    comment: string;
    images?: string[];
  }) => api.post("/reviews", data),
  update: (
    id: string,
    data: {
      rating?: number;
      title?: string;
      comment?: string;
      images?: string[];
    },
  ) => api.put(`/reviews/${id}`, data),
  delete: (id: string) => api.delete(`/reviews/${id}`),
  markHelpful: (id: string) => api.post(`/reviews/${id}/helpful`),
  // Admin
  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get("/reviews/admin/all", { params }),
  moderate: (
    id: string,
    data: { isApproved?: boolean; isFeatured?: boolean },
  ) => api.patch(`/reviews/${id}/moderate`, data),
};

// Orders API
export const ordersApi = {
  getAll: () => api.get("/orders"),
  getById: (id: string) => api.get(`/orders/${id}`),
  create: (data: any) => api.post("/orders", data),
  updateStatus: (id: string, status: string) =>
    api.put(`/orders/${id}/status`, { status }),
};

// Payments API
export const paymentsApi = {
  createOrder: (orderId: string, amount: number) =>
    api.post("/payments/create-order", { orderId, amount }),
  verify: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    orderId: string;
  }) => api.post("/payments/verify", data),
  getDetails: (paymentId: string) => api.get(`/payments/${paymentId}`),
  refund: (paymentId: string, amount?: number, reason?: string) =>
    api.post("/payments/refund", { paymentId, amount, reason }),
};

export default api;
