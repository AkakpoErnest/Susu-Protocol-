'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, SUSU_FACTORY_ABI, SUSU_POOL_ABI } from '@/lib/contracts';
import { zeroAddress } from 'viem';
import { CreatePoolFormData } from '@/types';
import { parseUnits } from 'viem';
import { useReadContracts } from 'wagmi';

export function useAllPools() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.SusuFactory,
    abi: SUSU_FACTORY_ABI,
    functionName: 'getAllPools',
    query: { refetchInterval: 15_000 },
  });
}

export function useActivePools() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.SusuFactory,
    abi: SUSU_FACTORY_ABI,
    functionName: 'getActivePools',
    query: { refetchInterval: 15_000 },
  });
}

export function usePoolsByMember(address?: `0x${string}`) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.SusuFactory,
    abi: SUSU_FACTORY_ABI,
    functionName: 'getPoolsByMember',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });
}

export function usePoolsByOperator(address?: `0x${string}`) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.SusuFactory,
    abi: SUSU_FACTORY_ABI,
    functionName: 'getPoolsByOperator',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });
}

export function usePoolCount() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.SusuFactory,
    abi: SUSU_FACTORY_ABI,
    functionName: 'getPoolCount',
    query: { refetchInterval: 30_000 },
  });
}

export function useCreatePool() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createPool = (formData: CreatePoolFormData) => {
    const contributionAmount = parseUnits(formData.contributionAmount, 6);

    writeContract({
      address: CONTRACT_ADDRESSES.SusuFactory,
      abi: SUSU_FACTORY_ABI,
      functionName: 'createPool',
      args: [
        formData.name,
        formData.description,
        contributionAmount,
        BigInt(formData.maxMembers),
        BigInt(formData.cycleDurationDays),
        BigInt(formData.gracePeriodHours),
        BigInt(formData.minReputationScore),
        formData.isPrivate,
        zeroAddress, // use default MockUSDC
      ],
    });
  };

  return { createPool, hash, isPending, isConfirming, isSuccess, error, reset };
}

// Aggregate stats for landing page
export function useTotalStats() {
  const { data: allPools, isLoading: poolsLoading } = useAllPools();
  const { data: poolCount } = usePoolCount();

  return {
    totalPools: poolCount || 0n,
    allPools: allPools || [],
    isLoading: poolsLoading,
  };
}
