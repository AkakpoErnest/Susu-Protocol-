'use client';

import { useTotalStats } from '@/hooks/useFactory';
import { useAllPools } from '@/hooks/useFactory';
import { useReadContracts } from 'wagmi';
import { SUSU_POOL_ABI } from '@/lib/contracts';
import { formatUSDC } from '@/lib/utils';
import { Activity, Users, Coins } from 'lucide-react';

export function LandingStats() {
  const { totalPools, allPools } = useTotalStats();

  // Get pot balances from all pools to compute total volume
  const poolContracts = (allPools as `0x${string}`[]).map((addr) => ({
    address: addr,
    abi: SUSU_POOL_ABI,
    functionName: 'getPotBalance' as const,
  }));

  const { data: potBalances } = useReadContracts({
    contracts: poolContracts,
    query: { enabled: poolContracts.length > 0 },
  });

  const totalVolume = potBalances
    ? potBalances.reduce((sum, result) => {
        if (result.status === 'success' && typeof result.result === 'bigint') {
          return sum + result.result;
        }
        return sum;
      }, 0n)
    : 0n;

  // Get member counts
  const memberContracts = (allPools as `0x${string}`[]).map((addr) => ({
    address: addr,
    abi: SUSU_POOL_ABI,
    functionName: 'totalMembers' as const,
  }));

  const { data: memberCounts } = useReadContracts({
    contracts: memberContracts,
    query: { enabled: memberContracts.length > 0 },
  });

  const totalMembers = memberCounts
    ? memberCounts.reduce((sum, result) => {
        if (result.status === 'success' && typeof result.result === 'bigint') {
          return sum + result.result;
        }
        return sum;
      }, 0n)
    : 0n;

  const stats = [
    {
      label: 'Total Pools Created',
      value: totalPools.toString(),
      icon: Activity,
      color: 'text-accent',
    },
    {
      label: 'Total Volume',
      value: `${formatUSDC(totalVolume)} mUSDC`,
      icon: Coins,
      color: 'text-green-400',
    },
    {
      label: 'Total Members',
      value: totalMembers.toString(),
      icon: Users,
      color: 'text-blue-400',
    },
  ];

  return (
    <div className="bg-surface border-y border-border py-8">
      <div className="page-container">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-card flex items-center justify-center shrink-0`}>
                <Icon size={22} className={color} />
              </div>
              <div>
                <div className={`text-2xl font-heading font-bold ${color}`}>{value}</div>
                <div className="text-sm text-gray-400">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
