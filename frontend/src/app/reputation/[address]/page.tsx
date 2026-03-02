'use client';

import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ReputationBadge } from '@/components/reputation/ReputationBadge';
import { ReputationHistory } from '@/components/reputation/ReputationHistory';
import { useReputation } from '@/hooks/useReputation';
import { truncateAddress, TIER_DESCRIPTIONS, TIER_COLORS, TIER_BG, getReputationTier, explorerAddress } from '@/lib/utils';
import { ExternalLink, Shield } from 'lucide-react';
import Link from 'next/link';

export default function ReputationPage() {
  const params = useParams();
  const memberAddress = params.address as `0x${string}`;

  const { score, tier, history, poolsCompleted, isLoading } = useReputation(memberAddress);

  const completionRate =
    history.length > 0
      ? Math.round(
          (history.filter((r) => !r.defaulted).length / history.length) * 100
        )
      : 100;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 page-container">
        <div className="max-w-3xl mx-auto">

          {/* Profile Header */}
          <div className="card mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Score Circle */}
              <div className="relative shrink-0">
                <div
                  className={`w-24 h-24 rounded-full border-4 flex items-center justify-center ${TIER_COLORS[tier].split(' ').find(c => c.startsWith('border')) || 'border-gray-400'}`}
                >
                  <span className="font-heading font-bold text-3xl text-accent">{score}</span>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                  <ReputationBadge score={score} size="sm" showScore={false} />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-lg text-text-primary">
                    {truncateAddress(memberAddress, 6)}
                  </span>
                  <a
                    href={explorerAddress(memberAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-accent transition-colors"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
                <div className="text-sm text-gray-400 mb-4 font-mono">{memberAddress}</div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xl font-heading font-bold text-accent">{score}</div>
                    <div className="text-xs text-gray-400">Score</div>
                  </div>
                  <div>
                    <div className="text-xl font-heading font-bold">{Number(poolsCompleted)}</div>
                    <div className="text-xs text-gray-400">Pools Completed</div>
                  </div>
                  <div>
                    <div className="text-xl font-heading font-bold">{completionRate}%</div>
                    <div className="text-xs text-gray-400">Completion Rate</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Score bar */}
            <div className="mt-6">
              <div className="h-3 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent to-yellow-300 rounded-full transition-all duration-500"
                  style={{ width: `${score / 10}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span className="text-blue-400">TRUSTED 301</span>
                <span className="text-purple-400">VETERAN 601</span>
                <span className="text-accent">CHAMPION 851</span>
                <span>1000</span>
              </div>
            </div>

            {/* Tier description */}
            <div className={`mt-4 p-3 rounded-lg ${TIER_BG[tier]} border ${TIER_COLORS[tier].split(' ').find(c => c.startsWith('border')) || ''}`}>
              <div className="flex items-center gap-2 mb-1">
                <Shield size={14} className="text-accent" />
                <span className="text-sm font-semibold">{tier}</span>
              </div>
              <p className="text-xs text-gray-300">{TIER_DESCRIPTIONS[tier]}</p>
            </div>
          </div>

          {/* Tier Guide */}
          <div className="card mb-6">
            <h2 className="font-heading font-semibold mb-4">Reputation Tiers</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { tier: 'NEWCOMER' as const, range: '0–300', color: 'text-gray-400', border: 'border-gray-400' },
                { tier: 'TRUSTED' as const, range: '301–600', color: 'text-blue-400', border: 'border-blue-400' },
                { tier: 'VETERAN' as const, range: '601–850', color: 'text-purple-400', border: 'border-purple-400' },
                { tier: 'CHAMPION' as const, range: '851–1000', color: 'text-accent', border: 'border-accent' },
              ].map(({ tier: t, range, color, border }) => (
                <div
                  key={t}
                  className={`p-3 rounded-lg border ${border} ${tier === t ? TIER_BG[t] : 'opacity-40'}`}
                >
                  <div className={`font-heading font-bold text-sm ${color} mb-1`}>{t}</div>
                  <div className="text-xs text-gray-400">{range}</div>
                </div>
              ))}
            </div>
          </div>

          {/* History */}
          <ReputationHistory history={[...history]} currentScore={score} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
