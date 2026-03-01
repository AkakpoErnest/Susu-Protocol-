'use client';

import { truncateAddress, formatUSDC, cn } from '@/lib/utils';
import { CheckCircle, ArrowRight, Circle } from 'lucide-react';
import Link from 'next/link';

interface TimelineEntry {
  address: `0x${string}`;
  cycleIndex: number;
  paid: boolean;
  isCurrent: boolean;
  amount: bigint;
}

interface PoolTimelineProps {
  entries: TimelineEntry[];
}

export function PoolTimeline({ entries }: PoolTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        Pool has not started yet. The payout order will be revealed when the operator starts the pool.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, idx) => (
        <div
          key={idx}
          className={cn(
            'flex items-center gap-3 p-3 rounded-lg border transition-all duration-200',
            entry.isCurrent
              ? 'border-accent/50 bg-accent/5'
              : entry.paid
              ? 'border-border bg-surface/50 opacity-60'
              : 'border-border bg-surface/30'
          )}
        >
          {/* Status icon */}
          <div className="shrink-0">
            {entry.paid ? (
              <CheckCircle size={18} className="text-success" />
            ) : entry.isCurrent ? (
              <ArrowRight size={18} className="text-accent animate-pulse" />
            ) : (
              <Circle size={18} className="text-gray-500" />
            )}
          </div>

          {/* Cycle number */}
          <div className="shrink-0 w-12 text-center">
            <span className={cn('text-xs font-medium', entry.isCurrent ? 'text-accent' : 'text-gray-400')}>
              #{entry.cycleIndex}
            </span>
          </div>

          {/* Address */}
          <div className="flex-1 min-w-0">
            <Link
              href={`/reputation/${entry.address}`}
              className="font-mono text-sm hover:text-accent transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {truncateAddress(entry.address)}
            </Link>
          </div>

          {/* Amount */}
          <div className="shrink-0 text-right">
            <div className={cn('text-sm font-medium', entry.isCurrent ? 'text-accent' : 'text-gray-300')}>
              {formatUSDC(entry.amount)} mUSDC
            </div>
            <div className="text-xs text-gray-500">
              {entry.paid ? 'Paid ✓' : entry.isCurrent ? 'Current →' : 'Upcoming'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
