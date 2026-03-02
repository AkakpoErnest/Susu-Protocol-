'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import toast from 'react-hot-toast';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PoolTimeline } from '@/components/pools/PoolTimeline';
import { MemberList } from '@/components/pools/MemberList';
import { ContributeButton } from '@/components/pools/ContributeButton';
import { ReputationBadge } from '@/components/reputation/ReputationBadge';
import {
  usePoolInfo,
  usePayoutSchedule,
  useContributionStatus,
  useTimeUntilDeadline,
  useIsMember,
  useHasContributed,
  useJoinPool,
  useStartPool,
  useTriggerPayout,
} from '@/hooks/usePool';
import { useScore } from '@/hooks/useReputation';
import {
  formatUSDC,
  formatDuration,
  formatCountdown,
  truncateAddress,
  POOL_STATE_LABELS,
  POOL_STATE_COLORS,
  explorerTx,
  explorerAddress,
  cn,
} from '@/lib/utils';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';
import {
  Users,
  Clock,
  Coins,
  Share2,
  ExternalLink,
  Loader2,
  Play,
  Zap,
  Lock,
  Shield,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function PoolDetailPage() {
  const params = useParams();
  const poolAddress = params.id as `0x${string}`;
  const { address, isConnected } = useAccount();

  // Data hooks
  const { data: poolData, refetch: refetchPool } = usePoolInfo(poolAddress);
  const { data: payoutData, refetch: refetchPayout } = usePayoutSchedule(poolAddress);
  const { data: contributionData, refetch: refetchContrib } = useContributionStatus(poolAddress);
  const { data: deadline, refetch: refetchDeadline } = useTimeUntilDeadline(poolAddress);
  const { data: isMember, refetch: refetchMember } = useIsMember(poolAddress, address);
  const { data: hasContributed, refetch: refetchContrib2 } = useHasContributed(poolAddress, address);
  const { data: userScore } = useScore(address);

  // Write hooks
  const { joinPool, hash: joinHash, isPending: joinPending, isConfirming: joinConfirming, isSuccess: joinSuccess, error: joinError } = useJoinPool(poolAddress);
  const { startPool, hash: startHash, isPending: startPending, isConfirming: startConfirming, isSuccess: startSuccess, error: startError } = useStartPool(poolAddress);
  const { triggerPayout, hash: payoutHash, isPending: payoutPending, isConfirming: payoutConfirming, isSuccess: payoutSuccess, error: payoutError } = useTriggerPayout(poolAddress);

  // Countdown ticker
  const [countdownDisplay, setCountdownDisplay] = useState('');
  useEffect(() => {
    if (!deadline) return;
    const update = () => setCountdownDisplay(formatCountdown(Number(deadline)));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  // Toast effects
  useEffect(() => {
    if (joinConfirming) toast.loading('Joining pool...', { id: 'join' });
    if (joinSuccess && joinHash) {
      toast.success('Joined!', { id: 'join' });
      refetchPool(); refetchMember(); refetchPayout();
    }
    if (joinError) toast.error(`Failed: ${joinError.message.slice(0, 80)}`, { id: 'join' });
  }, [joinConfirming, joinSuccess, joinError, joinHash]);

  useEffect(() => {
    if (startConfirming) toast.loading('Starting pool...', { id: 'start' });
    if (startSuccess && startHash) {
      toast.success('Pool started!', { id: 'start' });
      refetchPool(); refetchPayout();
    }
    if (startError) toast.error(`Failed: ${startError.message.slice(0, 80)}`, { id: 'start' });
  }, [startConfirming, startSuccess, startError, startHash]);

  useEffect(() => {
    if (payoutConfirming) toast.loading('Triggering payout...', { id: 'payout' });
    if (payoutSuccess && payoutHash) {
      toast.success('Payout sent!', { id: 'payout' });
      refetchPool(); refetchPayout(); refetchDeadline();
    }
    if (payoutError) toast.error(`Failed: ${payoutError.message.slice(0, 80)}`, { id: 'payout' });
  }, [payoutConfirming, payoutSuccess, payoutError, payoutHash]);

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied!');
  };

  if (!poolData) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 page-container">
          <div className="flex items-center justify-center h-64">
            <Loader2 size={32} className="animate-spin text-accent" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const [config, state, currentCycle, totalMembers, cycleStart, potBalance] = poolData;
  const stateLabel = POOL_STATE_LABELS[state as keyof typeof POOL_STATE_LABELS] || 'UNKNOWN';
  const stateColor = POOL_STATE_COLORS[state as keyof typeof POOL_STATE_COLORS] || '';
  const isOperator = address?.toLowerCase() === config.operator.toLowerCase();
  const isOpen = state === 0;
  const isActive = state === 1;
  const meetsReputation =
    config.minReputationScore === 0n ||
    (userScore !== undefined && userScore >= config.minReputationScore);

  // Build timeline entries
  const timelineEntries = payoutData
    ? payoutData[0].map((addr, idx) => ({
        address: addr as `0x${string}`,
        cycleIndex: idx + 1,
        paid: payoutData[1][idx],
        isCurrent: isActive && idx + 1 === Number(currentCycle),
        amount: config.contributionAmount * totalMembers,
      }))
    : [];

  const contributionAddresses = contributionData?.[0] || [];
  const contributionStatuses = contributionData?.[1] || [];
  const payoutStatuses = payoutData?.[1] || [];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 page-container">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-heading font-bold text-2xl md:text-3xl truncate">
                {config.name}
              </h1>
              <span className={cn('badge shrink-0', stateColor)}>{stateLabel}</span>
            </div>
            <p className="text-gray-400 text-sm">{config.description || 'No description'}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <span>by</span>
              <a
                href={explorerAddress(config.operator)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-accent transition-colors font-mono"
              >
                {truncateAddress(config.operator)}
                <ExternalLink size={10} />
              </a>
              {isOperator && (
                <span className="bg-accent/10 text-accent text-xs px-2 py-0.5 rounded-full border border-accent/20">
                  You (Operator)
                </span>
              )}
            </div>
          </div>
          <button onClick={copyUrl} className="btn-secondary text-sm flex items-center gap-2 shrink-0">
            <Share2 size={14} /> Share
          </button>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* LEFT — Pool Info (2 cols) */}
          <div className="lg:col-span-2 space-y-4">

            {/* Stats */}
            <div className="card">
              <h2 className="font-heading font-semibold text-lg mb-4">Pool Info</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Coins size={14} /> Contribution
                  </div>
                  <div className="font-medium">{formatUSDC(config.contributionAmount)} mUSDC</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Users size={14} /> Members
                  </div>
                  <div className="font-medium">{Number(totalMembers)}/{Number(config.maxMembers)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Clock size={14} /> Cycle
                  </div>
                  <div className="font-medium">{formatDuration(config.cycleDurationSeconds)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Shield size={14} /> Min Score
                  </div>
                  <div className="font-medium">
                    {config.minReputationScore === 0n ? 'Open' : Number(config.minReputationScore)}
                  </div>
                </div>
                {isActive && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="text-gray-400 text-sm">Current Cycle</div>
                      <div className="font-medium text-accent">
                        {Number(currentCycle)}/{Number(totalMembers)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-gray-400 text-sm">Pot Balance</div>
                      <div className="font-medium text-accent">{formatUSDC(potBalance)} mUSDC</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Clock size={14} /> Deadline
                      </div>
                      <div className={cn('font-mono text-sm font-medium', deadline && deadline < 3600n ? 'text-danger' : 'text-yellow-400')}>
                        {countdownDisplay || '—'}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="card">
              {!isConnected ? (
                <div>
                  <p className="text-gray-400 text-sm mb-4">Connect wallet to interact</p>
                  <ConnectButton />
                </div>
              ) : isOpen && !isMember ? (
                <div className="space-y-3">
                  <h3 className="font-heading font-semibold">Join This Pool</h3>
                  {config.isPrivate ? (
                    <div className="flex items-start gap-2 text-sm text-yellow-400 bg-yellow-400/10 rounded-lg p-3">
                      <Lock size={14} className="mt-0.5 shrink-0" />
                      <span>This is a private pool. Contact the operator to request access.</span>
                    </div>
                  ) : !meetsReputation ? (
                    <div className="flex items-start gap-2 text-sm text-danger bg-danger/10 rounded-lg p-3">
                      <Shield size={14} className="mt-0.5 shrink-0" />
                      <span>
                        Insufficient reputation. Need {Number(config.minReputationScore)}, you have{' '}
                        {userScore !== undefined ? Number(userScore) : 500}.
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={joinPool}
                      disabled={joinPending || joinConfirming}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      {joinPending || joinConfirming ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          {joinPending ? 'Waiting...' : 'Joining...'}
                        </>
                      ) : (
                        'Join Pool'
                      )}
                    </button>
                  )}
                </div>
              ) : isOpen && isMember && isOperator ? (
                <div className="space-y-3">
                  <h3 className="font-heading font-semibold">Start Pool</h3>
                  <p className="text-gray-400 text-sm">
                    {Number(totalMembers) < 2
                      ? `Need at least 2 members (have ${Number(totalMembers)})`
                      : `${Number(totalMembers)} members ready. Start to begin cycle rotations.`}
                  </p>
                  <button
                    onClick={startPool}
                    disabled={Number(totalMembers) < 2 || startPending || startConfirming}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {startPending || startConfirming ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        {startPending ? 'Waiting...' : 'Starting...'}
                      </>
                    ) : (
                      <>
                        <Play size={16} /> Start Pool
                      </>
                    )}
                  </button>
                </div>
              ) : isOpen && isMember && !isOperator ? (
                <div className="flex items-center gap-2 text-success text-sm">
                  <CheckCircle size={16} />
                  You&apos;re in! Waiting for operator to start.
                </div>
              ) : isActive && isMember ? (
                <div className="space-y-4">
                  <h3 className="font-heading font-semibold">Contribute</h3>
                  {hasContributed ? (
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle size={18} />
                      <span className="font-medium">Contributed this cycle ✓</span>
                    </div>
                  ) : (
                    <ContributeButton
                      poolAddress={poolAddress}
                      contributionAmount={config.contributionAmount}
                      stablecoinAddress={config.stablecoin as `0x${string}`}
                      onSuccess={() => {
                        refetchPool();
                        refetchPayout();
                        refetchContrib();
                        refetchContrib2();
                      }}
                    />
                  )}

                  {/* Trigger payout button */}
                  {isOperator && (
                    <div className="pt-3 border-t border-border">
                      <button
                        onClick={triggerPayout}
                        disabled={payoutPending || payoutConfirming}
                        className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
                      >
                        {payoutPending || payoutConfirming ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Zap size={14} /> Trigger Payout
                          </>
                        )}
                      </button>
                      <p className="text-xs text-gray-500 mt-1.5 text-center">
                        Available after deadline or when all contributed
                      </p>
                    </div>
                  )}
                </div>
              ) : isActive && !isMember ? (
                <div className="text-gray-400 text-sm text-center py-4">
                  This pool is active and no longer accepting new members.
                </div>
              ) : state === 2 ? (
                <div className="text-center py-4">
                  <div className="text-2xl mb-2">🎉</div>
                  <div className="font-semibold text-success">Pool Completed</div>
                  <p className="text-gray-400 text-sm mt-1">All members have received their payout.</p>
                </div>
              ) : state === 3 ? (
                <div className="text-center py-4">
                  <div className="text-2xl mb-2">⛔</div>
                  <div className="font-semibold text-danger">Pool Cancelled</div>
                </div>
              ) : null}
            </div>

            {/* Pool address */}
            <div className="card text-xs text-gray-500">
              <div className="flex items-center justify-between">
                <span>Contract</span>
                <a
                  href={explorerAddress(poolAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-mono hover:text-accent transition-colors"
                >
                  {truncateAddress(poolAddress, 6)}
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT — Timeline + Members (3 cols) */}
          <div className="lg:col-span-3 space-y-6">

            {/* Payout Timeline */}
            <div className="card">
              <h2 className="font-heading font-semibold text-lg mb-4">
                Payout Schedule
                {isActive && (
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    Cycle {Number(currentCycle)} of {Number(totalMembers)}
                  </span>
                )}
              </h2>
              <PoolTimeline entries={timelineEntries} />
            </div>

            {/* Members */}
            <div className="card">
              <h2 className="font-heading font-semibold text-lg mb-4">
                Members ({Number(totalMembers)}/{Number(config.maxMembers)})
              </h2>
              <MemberList
                members={contributionAddresses as readonly `0x${string}`[]}
                contributionStatuses={contributionStatuses as readonly boolean[]}
                payoutStatuses={payoutStatuses as readonly boolean[]}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
