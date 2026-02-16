import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (email, password) => {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        console.log("🔍 Login API URL:", `${apiUrl}/auth/login`);
        console.log("🔍 NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL);

        const response = await axios.post(`${apiUrl}/auth/login`, {
          email,
          password,
        });
        const { user, token } = response.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
      },
      setAuth: (user, token) => {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: "admin-auth-storage",
    },
  ),
);
