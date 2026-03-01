'use client';

import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, REPUTATION_REGISTRY_ABI } from '@/lib/contracts';
import { getReputationTier, type ReputationTier } from '@/lib/utils';

export function useScore(address?: `0x${string}`) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.ReputationRegistry,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: 'getScore',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });
}

export function useHistory(address?: `0x${string}`) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.ReputationRegistry,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: 'getHistory',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30_000 },
  });
}

export function useTotalPoolsCompleted(address?: `0x${string}`) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.ReputationRegistry,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: 'getTotalPoolsCompleted',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30_000 },
  });
}

export function useReputation(address?: `0x${string}`) {
  const { data: score, isLoading: scoreLoading } = useScore(address);
  const { data: history, isLoading: historyLoading } = useHistory(address);
  const { data: poolsCompleted } = useTotalPoolsCompleted(address);

  const numericScore = score !== undefined ? Number(score) : 500;
  const tier: ReputationTier = getReputationTier(numericScore);

  return {
    score: numericScore,
    tier,
    history: history || [],
    poolsCompleted: poolsCompleted || 0n,
    isLoading: scoreLoading || historyLoading,
  };
}
