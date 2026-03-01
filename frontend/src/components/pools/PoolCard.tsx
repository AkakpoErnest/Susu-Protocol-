'use client';

import Link from 'next/link';
import { formatUSDC, formatDuration, POOL_STATE_LABELS, POOL_STATE_COLORS, truncateAddress, cn } from '@/lib/utils';
import { usePoolInfo } from '@/hooks/usePool';
import { Users, Clock, Coins, Lock } from 'lucide-react';

interface PoolCardProps {
  poolAddress: `0x${string}`;
  showJoin?: boolean;
}

export function PoolCard({ poolAddress, showJoin = false }: PoolCardProps) {
  const { data: poolData, isLoading } = usePoolInfo(poolAddress);

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="h-5 bg-surface rounded mb-3 w-2/3" />
        <div className="h-4 bg-surface rounded mb-2 w-full" />
        <div className="h-4 bg-surface rounded w-3/4" />
      </div>
    );
  }

  if (!poolData) return null;

  const [config, state, currentCycle, totalMembers] = poolData;
  const stateLabel = POOL_STATE_LABELS[state as keyof typeof POOL_STATE_LABELS] || 'UNKNOWN';
  const stateColor = POOL_STATE_COLORS[state as keyof typeof POOL_STATE_COLORS] || '';
  const potPerCycle = config.contributionAmount * config.maxMembers;
  const progressPercent = Number(totalMembers) / Number(config.maxMembers) * 100;

  return (
    <Link href={`/pools/${poolAddress}`}>
      <div className="card-hover group">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
              {config.name}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{config.description}</p>
          </div>
          <span className={cn('badge ml-3 shrink-0', stateColor)}>
            {stateLabel}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Coins size={14} className="text-accent shrink-0" />
            <div>
              <div className="text-text-primary font-medium">
                {formatUSDC(config.contributionAmount)} mUSDC
              </div>
              <div className="text-xs text-gray-400">per member/cycle</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock size={14} className="text-blue-400 shrink-0" />
            <div>
              <div className="text-text-primary font-medium">
                {formatDuration(config.cycleDurationSeconds)}
              </div>
              <div className="text-xs text-gray-400">cycle duration</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users size={14} className="text-green-400 shrink-0" />
            <div>
              <div className="text-text-primary font-medium">
                {Number(totalMembers)}/{Number(config.maxMembers)}
              </div>
              <div className="text-xs text-gray-400">members</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div>
              <div className="text-text-primary font-medium text-accent">
                {formatUSDC(potPerCycle)} mUSDC
              </div>
              <div className="text-xs text-gray-400">winner receives</div>
            </div>
          </div>
        </div>

        {/* Member progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Members</span>
            <span>{Number(totalMembers)}/{Number(config.maxMembers)}</span>
          </div>
          <div className="h-1.5 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>by {truncateAddress(config.operator)}</span>
          <div className="flex items-center gap-2">
            {config.isPrivate && (
              <span className="flex items-center gap-1">
                <Lock size={10} /> Private
              </span>
            )}
            {config.minReputationScore > 0n && (
              <span>Min score: {Number(config.minReputationScore)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
