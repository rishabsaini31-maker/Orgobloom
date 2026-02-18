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
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
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
