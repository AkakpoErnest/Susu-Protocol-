'use client';

import type { Metadata } from 'next';
import { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import toast from 'react-hot-toast';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PoolCard } from '@/components/pools/PoolCard';
import { ReputationBadge } from '@/components/reputation/ReputationBadge';
import { ReputationHistory } from '@/components/reputation/ReputationHistory';
import { useMockUSDCBalance, useFaucet, useTimeUntilNextClaim } from '@/hooks/useMockUSDC';
import { usePoolsByMember, useAllPools } from '@/hooks/useFactory';
import { useReputation } from '@/hooks/useReputation';
import { passetHub } from '@/lib/wagmi';
import { formatUSDC, formatWND, formatCountdown, explorerTx, TIER_DESCRIPTIONS } from '@/lib/utils';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';
import { Wallet, Coins, Droplets, RefreshCw, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import Link from 'next/link';

type Tab = 'my-pools' | 'explore' | 'reputation';

export default function DashboardPage() {
  const { address, isConnected, chain } = useAccount();
  const [activeTab, setActiveTab] = useState<Tab>('my-pools');
  const [reputationOpen, setReputationOpen] = useState(false);

  // Balances
  const { data: wndBalance } = useBalance({
    address,
    chainId: passetHub.id,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });
  const { data: usdcBalance, refetch: refetchUSDC } = useMockUSDCBalance(address);
  const { data: cooldown } = useTimeUntilNextClaim(address);

  // Faucet
  const { claim, hash: faucetHash, isPending: faucetPending, isConfirming, isSuccess: faucetSuccess, error: faucetError } = useFaucet();

  useEffect(() => {
    if (isConfirming) toast.loading('Claiming mUSDC...', { id: 'faucet' });
    if (faucetSuccess && faucetHash) {
      toast.success(
        <span>
          Got 1000 mUSDC!{' '}
          <a href={explorerTx(faucetHash)} target="_blank" rel="noopener noreferrer" className="underline">
            View tx
          </a>
        </span>,
        { id: 'faucet', duration: 5000 }
      );
      refetchUSDC();
    }
    if (faucetError) toast.error(`Failed: ${faucetError.message.slice(0, 80)}`, { id: 'faucet' });
  }, [isConfirming, faucetSuccess, faucetError, faucetHash, refetchUSDC]);

  // Pools
  const { data: memberPools } = usePoolsByMember(address);
  const { data: allPools } = useAllPools();

  // Reputation
  const { score, tier, history, poolsCompleted } = useReputation(address);

  const isWrongNetwork = isConnected && chain?.id !== passetHub.id;
  const canClaimFaucet = !cooldown || cooldown === 0n;

  if (!isConnected) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center page-container">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-2xl bg-card flex items-center justify-center mx-auto mb-6">
              <Wallet size={36} className="text-accent" />
            </div>
            <h1 className="font-heading font-bold text-2xl mb-3">Connect Your Wallet</h1>
            <p className="text-gray-400 mb-8">
              Connect your wallet to access your dashboard, manage pools, and track your reputation.
            </p>
            <ConnectButton />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 page-container">

        {/* Wrong network warning */}
        {isWrongNetwork && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-xl flex items-center gap-3">
            <div className="text-danger text-sm">
              ⚠️ Wrong network. Please switch to <strong>Westend Asset Hub</strong> (Chain ID: 420420421)
            </div>
          </div>
        )}

        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading font-bold text-2xl">Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Manage your savings circles</p>
          </div>

          {/* Balances + Faucet */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2">
              <span className="text-xs text-gray-400">WND</span>
              <span className="font-mono font-medium">{wndBalance ? formatWND(wndBalance.value) : '—'}</span>
            </div>
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2">
              <span className="text-xs text-gray-400">mUSDC</span>
              <span className="font-mono font-medium">
                {usdcBalance !== undefined ? formatUSDC(usdcBalance) : '—'}
              </span>
            </div>
            <button
              onClick={claim}
              disabled={faucetPending || isConfirming || !canClaimFaucet}
              className="btn-outline text-sm flex items-center gap-1.5 py-2"
              title={!canClaimFaucet && cooldown ? `Cooldown: ${formatCountdown(Number(cooldown))}` : 'Get 1000 test mUSDC'}
            >
              <Droplets size={14} />
              {!canClaimFaucet && cooldown
                ? formatCountdown(Number(cooldown))
                : 'Get Test Tokens'}
            </button>
          </div>
        </div>

        {/* Reputation Score Bar */}
        <div className="card mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-3xl font-heading font-bold text-accent">{score}</div>
                <div className="text-sm text-gray-400">Reputation Score</div>
              </div>
              <ReputationBadge score={score} size="md" />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right text-sm hidden sm:block">
                <div className="text-text-primary font-medium">{Number(poolsCompleted)} pools completed</div>
                <div className="text-gray-400">{history.length} total contributions</div>
              </div>
              <button
                onClick={() => setReputationOpen(!reputationOpen)}
                className="text-gray-400 hover:text-accent transition-colors"
              >
                {reputationOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
          </div>

          {/* Score bar */}
          <div className="mt-4">
            <div className="h-2 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-yellow-300 rounded-full transition-all duration-500"
                style={{ width: `${score / 10}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>NEWCOMER</span>
              <span>TRUSTED</span>
              <span>VETERAN</span>
              <span>CHAMPION</span>
            </div>
          </div>

          {/* Reputation history expandable */}
          {reputationOpen && (
            <div className="mt-6 pt-6 border-t border-border">
              <ReputationHistory history={[...history]} currentScore={score} />
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface rounded-xl p-1 mb-6 w-full sm:w-auto">
          {(['my-pools', 'explore', 'reputation'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? 'bg-card text-accent shadow-sm'
                  : 'text-gray-400 hover:text-text-primary'
              }`}
            >
              {tab === 'my-pools' ? 'My Pools' : tab === 'explore' ? 'Explore' : 'Reputation'}
            </button>
          ))}
        </div>

        {/* Tab: My Pools */}
        {activeTab === 'my-pools' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-lg">
                My Pools {memberPools?.length ? `(${memberPools.length})` : ''}
              </h2>
              <Link href="/pools/create" className="btn-primary text-sm py-2">
                + Create Pool
              </Link>
            </div>

            {!memberPools || memberPools.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-4xl mb-4">🫂</div>
                <h3 className="font-heading font-semibold text-lg mb-2">No pools yet</h3>
                <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                  Create a new savings circle or join an existing one to get started.
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Link href="/pools/create" className="btn-primary text-sm">Create Pool</Link>
                  <button onClick={() => setActiveTab('explore')} className="btn-secondary text-sm">
                    Explore Pools
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {memberPools.map((addr) => (
                  <PoolCard key={addr} poolAddress={addr as `0x${string}`} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Explore */}
        {activeTab === 'explore' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-lg">
                Open Pools {allPools?.length ? `(${allPools.length})` : ''}
              </h2>
            </div>

            {!allPools || allPools.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-4xl mb-4">🔭</div>
                <h3 className="font-heading font-semibold text-lg mb-2">No pools yet</h3>
                <p className="text-gray-400 mb-6">Be the first to create one!</p>
                <Link href="/pools/create" className="btn-primary text-sm">Create Pool</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {allPools.map((addr) => (
                  <PoolCard key={addr} poolAddress={addr as `0x${string}`} showJoin />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Reputation */}
        {activeTab === 'reputation' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-semibold text-lg">My Reputation</h2>
              {address && (
                <Link
                  href={`/reputation/${address}`}
                  className="text-accent text-sm hover:underline"
                >
                  View public profile →
                </Link>
              )}
            </div>

            {/* Score breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'On-time contribution', change: '+10 pts', color: 'text-success' },
                { label: 'Late contribution', change: '+3 pts', color: 'text-yellow-400' },
                { label: 'Missed cycle (default)', change: '-50 pts', color: 'text-danger' },
                { label: 'Pool completed (no defaults)', change: '+25 pts', color: 'text-accent' },
                { label: 'Minimum score', change: '0 pts', color: 'text-gray-400' },
                { label: 'Maximum score', change: '1000 pts', color: 'text-gray-400' },
              ].map(({ label, change, color }) => (
                <div key={label} className="card flex items-center justify-between">
                  <span className="text-sm text-gray-300">{label}</span>
                  <span className={`font-mono font-bold ${color}`}>{change}</span>
                </div>
              ))}
            </div>

            {/* Tier guide */}
            <div className="card mb-6">
              <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                <HelpCircle size={16} className="text-gray-400" />
                Reputation Tiers
              </h3>
              <div className="space-y-3">
                {[
                  { tier: 'NEWCOMER', range: '0 — 300', desc: TIER_DESCRIPTIONS.NEWCOMER, color: 'text-gray-400' },
                  { tier: 'TRUSTED', range: '301 — 600', desc: TIER_DESCRIPTIONS.TRUSTED, color: 'text-blue-400' },
                  { tier: 'VETERAN', range: '601 — 850', desc: TIER_DESCRIPTIONS.VETERAN, color: 'text-purple-400' },
                  { tier: 'CHAMPION', range: '851 — 1000', desc: TIER_DESCRIPTIONS.CHAMPION, color: 'text-accent' },
                ].map(({ tier: t, range, desc, color }) => (
                  <div key={t} className={`flex items-start gap-3 p-3 rounded-lg ${score >= parseInt(range) ? 'bg-surface' : ''}`}>
                    <div className={`font-heading font-bold text-sm w-24 shrink-0 ${color}`}>{t}</div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-400 mb-0.5">{range}</div>
                      <div className="text-sm text-gray-300">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <ReputationHistory history={[...history]} currentScore={score} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
