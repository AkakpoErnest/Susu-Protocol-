'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';
import { http } from 'wagmi';

// Polkadot Hub Passet Hub Testnet (EVM)
export const passetHub = defineChain({
  id: 420420417,
  name: 'Passet Hub',
  nativeCurrency: {
    decimals: 18,
    name: 'Paseo',
    symbol: 'PAS',
  },
  rpcUrls: {
    default: {
      http: ['https://services.polkadothub-rpc.com/testnet'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://blockscout-passet-hub.parity-testnet.parity.io',
    },
  },
  testnet: true,
});

export const wagmiConfig = getDefaultConfig({
  appName: 'Susu Protocol',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'susu-protocol-dev',
  chains: [passetHub],
  transports: {
    [passetHub.id]: http('https://services.polkadothub-rpc.com/testnet'),
  },
  ssr: true,
});
