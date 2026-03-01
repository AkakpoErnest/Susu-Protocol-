'use client';

import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from 'wagmi';
import { SUSU_POOL_ABI, MOCK_USDC_ABI, CONTRACT_ADDRESSES } from '@/lib/contracts';
import { useState, useEffect } from 'react';

export function usePoolInfo(poolAddress?: `0x${string}`) {
  return useReadContract({
    address: poolAddress,
    abi: SUSU_POOL_ABI,
    functionName: 'getPoolInfo',
    query: { enabled: !!poolAddress, refetchInterval: 10_000 },
  });
}

export function usePoolState(poolAddress?: `0x${string}`) {
  return useReadContract({
    address: poolAddress,
    abi: SUSU_POOL_ABI,
    functionName: 'state',
    query: { enabled: !!poolAddress, refetchInterval: 10_000 },
  });
}

export function usePoolMembers(poolAddress?: `0x${string}`) {
  return useReadContract({
    address: poolAddress,
    abi: SUSU_POOL_ABI,
    functionName: 'getMembers',
    query: { enabled: !!poolAddress, refetchInterval: 15_000 },
  });
}

export function usePayoutSchedule(poolAddress?: `0x${string}`) {
  return useReadContract({
    address: poolAddress,
    abi: SUSU_POOL_ABI,
    functionName: 'getPayoutSchedule',
    query: { enabled: !!poolAddress, refetchInterval: 10_000 },
  });
}

export function useContributionStatus(poolAddress?: `0x${string}`) {
  return useReadContract({
    address: poolAddress,
    abi: SUSU_POOL_ABI,
    functionName: 'getContributionStatus',
    query: { enabled: !!poolAddress, refetchInterval: 10_000 },
  });
}

export function useTimeUntilDeadline(poolAddress?: `0x${string}`) {
  return useReadContract({
    address: poolAddress,
    abi: SUSU_POOL_ABI,
    functionName: 'getTimeUntilDeadline',
    query: { enabled: !!poolAddress, refetchInterval: 5_000 },
  });
}

export function usePotBalance(poolAddress?: `0x${string}`) {
  return useReadContract({
    address: poolAddress,
    abi: SUSU_POOL_ABI,
    functionName: 'getPotBalance',
    query: { enabled: !!poolAddress, refetchInterval: 10_000 },
  });
}

export function useIsMember(poolAddress?: `0x${string}`, address?: `0x${string}`) {
  return useReadContract({
    address: poolAddress,
    abi: SUSU_POOL_ABI,
    functionName: 'isMember',
    args: address ? [address] : undefined,
    query: { enabled: !!poolAddress && !!address, refetchInterval: 10_000 },
  });
}

export function useHasContributed(poolAddress?: `0x${string}`, address?: `0x${string}`) {
  return useReadContract({
    address: poolAddress,
    abi: SUSU_POOL_ABI,
    functionName: 'hasContributedThisCycle',
    args: address ? [address] : undefined,
    query: { enabled: !!poolAddress && !!address, refetchInterval: 10_000 },
  });
}

// ─── Write Hooks ──────────────────────────────────────────────────────────────

export function useJoinPool(poolAddress?: `0x${string}`) {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const joinPool = () => {
    if (!poolAddress) return;
    writeContract({
      address: poolAddress,
      abi: SUSU_POOL_ABI,
      functionName: 'joinPool',
    });
  };

  return { joinPool, hash, isPending, isConfirming, isSuccess, error, reset };
}

export function useStartPool(poolAddress?: `0x${string}`) {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const startPool = () => {
    if (!poolAddress) return;
    writeContract({
      address: poolAddress,
      abi: SUSU_POOL_ABI,
      functionName: 'startPool',
    });
  };

  return { startPool, hash, isPending, isConfirming, isSuccess, error, reset };
}

export function useContribute(poolAddress?: `0x${string}`) {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const contribute = () => {
    if (!poolAddress) return;
    writeContract({
      address: poolAddress,
      abi: SUSU_POOL_ABI,
      functionName: 'contribute',
    });
  };

  return { contribute, hash, isPending, isConfirming, isSuccess, error, reset };
}

export function useTriggerPayout(poolAddress?: `0x${string}`) {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const triggerPayout = () => {
    if (!poolAddress) return;
    writeContract({
      address: poolAddress,
      abi: SUSU_POOL_ABI,
      functionName: 'triggerPayout',
    });
  };

  return { triggerPayout, hash, isPending, isConfirming, isSuccess, error, reset };
}

// Two-step approve + contribute flow
export function useApproveAndContribute(
  poolAddress?: `0x${string}`,
  contributionAmount?: bigint,
  stablecoinAddress?: `0x${string}`
) {
  const { address: userAddress } = useAccount();
  const [step, setStep] = useState<'approve' | 'contribute' | 'done'>('approve');

  // Check allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: stablecoinAddress || CONTRACT_ADDRESSES.MockUSDC,
    abi: MOCK_USDC_ABI,
    functionName: 'allowance',
    args: userAddress && poolAddress ? [userAddress, poolAddress] : undefined,
    query: { enabled: !!userAddress && !!poolAddress, refetchInterval: 5_000 },
  });

  // Approve tx
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApprovePending,
    error: approveError,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash });

  // Contribute tx
  const {
    writeContract: writeContribute,
    data: contributeHash,
    isPending: isContributePending,
    error: contributeError,
  } = useWriteContract();

  const { isLoading: isContributeConfirming, isSuccess: isContributeSuccess } =
    useWaitForTransactionReceipt({ hash: contributeHash });

  // Auto-advance step after approve
  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance();
      setStep('contribute');
    }
  }, [isApproveSuccess, refetchAllowance]);

  useEffect(() => {
    if (isContributeSuccess) {
      setStep('done');
    }
  }, [isContributeSuccess]);

  // Check if already approved
  useEffect(() => {
    if (allowance !== undefined && contributionAmount !== undefined) {
      if (allowance >= contributionAmount) {
        setStep('contribute');
      } else {
        setStep('approve');
      }
    }
  }, [allowance, contributionAmount]);

  const approve = () => {
    if (!poolAddress || !contributionAmount) return;
    writeApprove({
      address: stablecoinAddress || CONTRACT_ADDRESSES.MockUSDC,
      abi: MOCK_USDC_ABI,
      functionName: 'approve',
      args: [poolAddress, contributionAmount],
    });
  };

  const contribute = () => {
    if (!poolAddress) return;
    writeContribute({
      address: poolAddress,
      abi: SUSU_POOL_ABI,
      functionName: 'contribute',
    });
  };

  const isAlreadyApproved =
    allowance !== undefined &&
    contributionAmount !== undefined &&
    allowance >= contributionAmount;

  return {
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
  };
}
