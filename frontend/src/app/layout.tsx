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
    'Susu Protocol brings the ancient rotating savings tradition of West Africa to Polkadot — trustless, transparent, and borderless. Join a circle, contribute, and build your on-chain reputation.',
  keywords: ['susu', 'polkadot', 'rotating savings', 'DeFi', 'tontine', 'ajo', 'blockchain'],
  openGraph: {
    type: 'website',
    title: 'Susu Protocol',
    description: 'Decentralized rotating savings on Polkadot Hub',
    siteName: 'Susu Protocol',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Susu Protocol',
    description: 'Decentralized rotating savings on Polkadot Hub',
  },
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
