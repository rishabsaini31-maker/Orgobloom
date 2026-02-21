"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GoogleAuthProviderComponent from "@/components/GoogleAuthProvider";
import LiveChat from "@/components/LiveChat";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh longer
            gcTime: 10 * 60 * 1000, // 10 minutes - cache retention (formerly cacheTime)
            refetchOnWindowFocus: false,
            refetchOnMount: false, // Don't refetch when component mounts if data is fresh
            refetchOnReconnect: true, // Refetch when network reconnects
            retry: 2, // Retry failed requests twice
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
          },
        },
      }),
  );

  return (
    <GoogleAuthProviderComponent>
      <QueryClientProvider client={queryClient}>
        {children}
        <LiveChat />
      </QueryClientProvider>
    </GoogleAuthProviderComponent>
  );
}
