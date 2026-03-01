'use client';

import { truncateAddress, cn, explorerAddress } from '@/lib/utils';
import { useReputation } from '@/hooks/useReputation';
import { ReputationBadge } from '@/components/reputation/ReputationBadge';
import { CheckCircle, XCircle, Coins, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface MemberRowProps {
  address: `0x${string}`;
  hasContributed: boolean;
  hasPayout: boolean;
}

function MemberRow({ address, hasContributed, hasPayout }: MemberRowProps) {
  const { score, tier } = useReputation(address);

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={`/reputation/${address}`}
            className="font-mono text-sm text-text-primary hover:text-accent transition-colors flex items-center gap-1"
          >
            {truncateAddress(address)}
            <ExternalLink size={11} className="opacity-50" />
          </Link>
        </div>
        <div className="mt-1">
          <ReputationBadge score={score} size="sm" />
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {/* Contributed this cycle */}
        <div className="text-center">
          <div className="text-xs text-gray-400 mb-1">Contributed</div>
          {hasContributed ? (
            <CheckCircle size={16} className="text-success mx-auto" />
          ) : (
            <XCircle size={16} className="text-gray-500 mx-auto" />
          )}
        </div>

        {/* Received payout */}
        <div className="text-center">
          <div className="text-xs text-gray-400 mb-1">Payout</div>
          {hasPayout ? (
            <Coins size={16} className="text-accent mx-auto" />
          ) : (
            <span className="text-gray-500 text-xs">—</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface MemberListProps {
  members: readonly `0x${string}`[];
  contributionStatuses: readonly boolean[];
  payoutStatuses: readonly boolean[];
}

export function MemberList({ members, contributionStatuses, payoutStatuses }: MemberListProps) {
  if (members.length === 0) {
    return (
      <p className="text-center text-gray-400 py-8 text-sm">
        No members yet. Be the first to join!
      </p>
    );
  }

  return (
    <div>
      {members.map((address, idx) => (
        <MemberRow
          key={address}
          address={address}
          hasContributed={contributionStatuses[idx] || false}
          hasPayout={payoutStatuses[idx] || false}
        />
      ))}
    </div>
  );
}
