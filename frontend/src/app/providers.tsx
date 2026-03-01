'use client';

import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { Toaster } from 'react-hot-toast';
import { wagmiConfig } from '@/lib/wagmi';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#e8c547',
            accentColorForeground: '#1a1a2e',
            borderRadius: 'medium',
            fontStack: 'system',
          })}
          coolMode
        >
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#0f3460',
                color: '#f1f5f9',
                border: '1px solid #1e3a5f',
              },
              success: {
                iconTheme: { primary: '#4ade80', secondary: '#0f3460' },
              },
              error: {
                iconTheme: { primary: '#f87171', secondary: '#0f3460' },
              },
            }}
          />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
