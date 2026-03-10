import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  // Check if store has been hydrated from localStorage
  isHydrated: boolean;
  setIsHydrated: (hydrated: boolean) => void;
  // Restore auth data - useful for manual recovery
  restoreFromStorage: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isHydrated: false,
      setIsHydrated: (hydrated: boolean) => {
        set({ isHydrated: hydrated });
      },
      setAuth: (user, token) => {
        console.log("[AUTH_STORE] Setting auth for user:", user.email);
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        set({ user, token, isAuthenticated: true, isHydrated: true });
      },
      logout: () => {
        console.log("[AUTH_STORE] Logging out");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        set({ user: null, token: null, isAuthenticated: false });
      },
      restoreFromStorage: () => {
        // Manually restore from localStorage in case hydration fails
        if (typeof window !== "undefined") {
          try {
            const token = localStorage.getItem("token");
            const userStr = localStorage.getItem("user");

            if (token && userStr) {
              const user = JSON.parse(userStr);
              console.log("[AUTH_STORE] Manually restoring auth from storage");
              set({ user, token, isAuthenticated: true, isHydrated: true });
            } else {
              console.log("[AUTH_STORE] No auth data found in storage");
              set({
                user: null,
                token: null,
                isAuthenticated: false,
                isHydrated: true,
              });
            }
          } catch (error) {
            console.error("[AUTH_STORE] Error restoring from storage:", error);
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isHydrated: true,
            });
          }
        }
      },
    }),
    {
      name: "admin-auth-storage",
      onRehydrateStorage: () => (state) => {
        // Called after localStorage is read
        if (state) {
          console.log("[AUTH_STORE] Hydration complete:", {
            hasToken: !!state.token,
            hasUser: !!state.user,
          });
          state.setIsHydrated(true);
        }
      },
    },
  ),
);
