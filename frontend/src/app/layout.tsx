import type { Metadata } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Susu Protocol — Decentralized Rotating Savings on Polkadot',
    template: '%s | Susu Protocol',
  },
  description:
    'Susu Protocol brings the ancient rotating savings tradition of West Africa to Polkadot — trustless, transparent, and borderless. Join a savings circle, contribute every cycle, and build your on-chain reputation. No bank required.',
  keywords: [
    // Core product
    'susu', 'ajo', 'tontine', 'djanggi', 'ekub', 'paluwagan',
    'rotating savings', 'rotating credit association', 'ROSCA',
    'community savings', 'savings circle', 'savings group', 'savings club',
    // Web3 / DeFi
    'DeFi', 'decentralized finance', 'blockchain savings', 'on-chain savings',
    'smart contract savings', 'crypto savings', 'Web3 community',
    'trustless savings', 'transparent savings',
    // Polkadot
    'Polkadot', 'Polkadot Hub', 'Passet Hub', 'Polkadot EVM', 'PAS token',
    // Audience
    'African diaspora finance', 'community finance', 'group savings',
    'peer savings', 'cooperative savings', 'financial inclusion',
    'unbanked', 'microfinance', 'community wealth',
    // Discovery
    'save money with friends', 'group investment', 'rotating pot',
    'money circle', 'savings pool', 'contribution pool',
  ],
  authors: [{ name: 'Susu Protocol' }],
  creator: 'Susu Protocol',
  metadataBase: new URL('https://susu-protocol.xyz'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: 'https://susu-protocol.xyz',
    title: 'Susu Protocol — Save Together, On-Chain',
    description:
      'Join a trustless savings circle on Polkadot. Inspired by the ancient Susu/Ajo/Tontine tradition — now borderless, transparent, and unstoppable.',
    siteName: 'Susu Protocol',
    locale: 'en_US',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Susu Protocol' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Susu Protocol — Save Together, On-Chain',
    description:
      'Trustless rotating savings on Polkadot. Join a circle, contribute every cycle, build your reputation. No bank required.',
    creator: '@SusuProtocol',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
    },
  },
  category: 'finance',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="bg-primary text-text-primary font-body antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
