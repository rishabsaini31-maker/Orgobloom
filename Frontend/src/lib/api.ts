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
  getAll: (params?: any) => api.get("/products", { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  getBySlug: (slug: string) => api.get(`/products/slug/${slug}`),
};

// User API
export const userApi = {
  getProfile: () => api.get("/user/me"),
  updateProfile: (data: any) => api.put("/user/profile", data),
  changePassword: (data: any) => api.put("/user/password", data),
};

export default api;
