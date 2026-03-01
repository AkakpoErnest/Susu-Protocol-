'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';
import { http } from 'wagmi';

// Polkadot Hub Westend Testnet (EVM)
export const westendAssetHub = defineChain({
  id: 420420421,
  name: 'Westend Asset Hub',
  nativeCurrency: {
    decimals: 18,
    name: 'Westend',
    symbol: 'WND',
  },
  rpcUrls: {
    default: {
      http: ['https://westend-asset-hub-eth-rpc.polkadot.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://blockscout.westend.asset-hub.paritytech.net',
    },
  },
  testnet: true,
});

export const wagmiConfig = getDefaultConfig({
  appName: 'Susu Protocol',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'susu-protocol-dev',
  chains: [westendAssetHub],
  transports: {
    [westendAssetHub.id]: http('https://westend-asset-hub-eth-rpc.polkadot.io'),
  },
  ssr: true,
});
