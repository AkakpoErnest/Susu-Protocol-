'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useAccount } from 'wagmi';
import { CONTRACT_ADDRESSES, MOCK_USDC_ABI } from '@/lib/contracts';
import { parseUnits } from 'viem';

export function useMockUSDCBalance(address?: `0x${string}`) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.MockUSDC,
    abi: MOCK_USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });
}

export function useAllowance(owner?: `0x${string}`, spender?: `0x${string}`) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.MockUSDC,
    abi: MOCK_USDC_ABI,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    query: { enabled: !!owner && !!spender, refetchInterval: 5_000 },
  });
}

export function useTimeUntilNextClaim(address?: `0x${string}`) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.MockUSDC,
    abi: MOCK_USDC_ABI,
    functionName: 'timeUntilNextClaim',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30_000 },
  });
}

export function useFaucet() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claim = () => {
    writeContract({
      address: CONTRACT_ADDRESSES.MockUSDC,
      abi: MOCK_USDC_ABI,
      functionName: 'faucet',
    });
  };

  return { claim, hash, isPending, isConfirming, isSuccess, error };
}

export function useApprove(spender: `0x${string}`, amount: bigint) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = () => {
    writeContract({
      address: CONTRACT_ADDRESSES.MockUSDC,
      abi: MOCK_USDC_ABI,
      functionName: 'approve',
      args: [spender, amount],
    });
  };

  return { approve, hash, isPending, isConfirming, isSuccess, error };
}
