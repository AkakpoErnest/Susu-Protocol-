'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Plus, Search } from 'lucide-react';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pools/explore', label: 'Explore', icon: Search },
  { href: '/pools/create', label: 'Create Pool', icon: Plus },
];

export function Header() {
  const pathname = usePathname();
  const { isConnected } = useAccount();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-primary/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <Image
              src="/logo.png"
              alt="Susu Protocol"
              width={160}
              height={40}
              className="h-9 w-auto object-contain group-hover:opacity-90 transition-opacity"
              priority
            />
          </Link>

          {/* Nav Links - hidden on mobile */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  pathname === href || pathname.startsWith(href + '/')
                    ? 'bg-card text-accent'
                    : 'text-gray-400 hover:text-text-primary hover:bg-card/50'
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </nav>

          {/* Wallet Connect */}
          <div className="flex items-center gap-3">
            <ConnectButton
              accountStatus="avatar"
              chainStatus="icon"
              showBalance={false}
            />
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="flex md:hidden items-center gap-1 pb-3 overflow-x-auto">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                pathname === href
                  ? 'bg-card text-accent'
                  : 'text-gray-400 hover:text-text-primary'
              )}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
