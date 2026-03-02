'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PoolCard } from '@/components/pools/PoolCard';
import { useAllPools } from '@/hooks/useFactory';
import { Search, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';

export default function ExplorePoolsPage() {
  const { data: allPools, isLoading } = useAllPools();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 page-container">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading font-bold text-3xl">Explore Pools</h1>
            <p className="text-gray-400 mt-1">Find a savings circle to join</p>
          </div>
          <Link href="/pools/create" className="btn-primary text-sm">
            + Create Pool
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-5 bg-surface rounded mb-3 w-2/3" />
                <div className="h-4 bg-surface rounded mb-2 w-full" />
                <div className="h-4 bg-surface rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : !allPools || allPools.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">🔭</div>
            <h3 className="font-heading font-semibold text-xl mb-2">No pools yet</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Be the first to create a savings circle on Susu Protocol!
            </p>
            <Link href="/pools/create" className="btn-primary">Create the First Pool</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {allPools.map((addr) => (
              <PoolCard key={addr} poolAddress={addr as `0x${string}`} showJoin />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
