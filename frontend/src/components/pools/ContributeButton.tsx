'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import { useApproveAndContribute } from '@/hooks/usePool';
import { formatUSDC, explorerTx } from '@/lib/utils';
import { Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';

interface ContributeButtonProps {
  poolAddress: `0x${string}`;
  contributionAmount: bigint;
  stablecoinAddress?: `0x${string}`;
  onSuccess?: () => void;
}

export function ContributeButton({
  poolAddress,
  contributionAmount,
  stablecoinAddress,
  onSuccess,
}: ContributeButtonProps) {
  const { address } = useAccount();
  const {
    step,
    isAlreadyApproved,
    approve,
    contribute,
    approveHash,
    contributeHash,
    isApprovePending,
    isApproveConfirming,
    isContributePending,
    isContributeConfirming,
    isContributeSuccess,
    approveError,
    contributeError,
  } = useApproveAndContribute(poolAddress, contributionAmount, stablecoinAddress);

  useEffect(() => {
    if (isApproveConfirming) {
      toast.loading('Confirming approval...', { id: 'approve' });
    }
    if (approveHash && !isApproveConfirming) {
      toast.success(
        <span>
          Approved!{' '}
          <a href={explorerTx(approveHash)} target="_blank" rel="noopener noreferrer" className="underline">
            View tx
          </a>
        </span>,
        { id: 'approve' }
      );
    }
  }, [isApproveConfirming, approveHash]);

  useEffect(() => {
    if (isContributeConfirming) {
      toast.loading('Confirming contribution...', { id: 'contribute' });
    }
    if (isContributeSuccess && contributeHash) {
      toast.success(
        <span>
          Contributed {formatUSDC(contributionAmount)} mUSDC!{' '}
          <a href={explorerTx(contributeHash)} target="_blank" rel="noopener noreferrer" className="underline">
            View tx
          </a>
        </span>,
        { id: 'contribute', duration: 5000 }
      );
      onSuccess?.();
    }
  }, [isContributeConfirming, isContributeSuccess, contributeHash, contributionAmount, onSuccess]);

  useEffect(() => {
    if (approveError) toast.error(`Approval failed: ${approveError.message.slice(0, 60)}`);
    if (contributeError) toast.error(`Contribution failed: ${contributeError.message.slice(0, 60)}`);
  }, [approveError, contributeError]);

  if (isContributeSuccess) {
    return (
      <div className="flex items-center gap-2 text-success font-medium">
        <CheckCircle size={18} />
        Contributed this cycle!
      </div>
    );
  }

  const isLoading =
    isApprovePending || isApproveConfirming || isContributePending || isContributeConfirming;

  // Step 1: Approve
  if (step === 'approve' && !isAlreadyApproved) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-gray-400">
          Step 1/2: Approve {formatUSDC(contributionAmount)} mUSDC spending
        </div>
        <button
          onClick={approve}
          disabled={isLoading}
          className="btn-secondary w-full flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {isApprovePending ? 'Waiting for wallet...' : 'Confirming...'}
            </>
          ) : (
            <>
              Approve mUSDC <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    );
  }

  // Step 2: Contribute
  return (
    <div className="space-y-3">
      {!isAlreadyApproved && (
        <div className="text-sm text-gray-400">
          Step 2/2: Contribute {formatUSDC(contributionAmount)} mUSDC
        </div>
      )}
      <button
        onClick={contribute}
        disabled={isLoading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {isContributePending ? 'Waiting for wallet...' : 'Confirming...'}
          </>
        ) : (
          `Contribute ${formatUSDC(contributionAmount)} mUSDC`
        )}
      </button>
    </div>
  );
}
