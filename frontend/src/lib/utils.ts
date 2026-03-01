import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, fromUnixTime } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Address formatting ───────────────────────────────────────────────────────

export function truncateAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// ─── Token formatting ─────────────────────────────────────────────────────────

export function formatUSDC(amount: bigint, decimals = 6): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 2);
  return `${whole.toLocaleString()}.${fractionStr}`;
}

export function parseUSDC(amount: string, decimals = 6): bigint {
  const [whole, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole) * BigInt(10 ** decimals) + BigInt(paddedFraction);
}

export function formatWND(amount: bigint): string {
  const eth = Number(amount) / 1e18;
  return eth.toFixed(4);
}

// ─── Time formatting ──────────────────────────────────────────────────────────

export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return 'Expired';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

export function formatTimestamp(timestamp: bigint): string {
  return format(fromUnixTime(Number(timestamp)), 'MMM d, yyyy HH:mm');
}

export function formatTimeAgo(timestamp: bigint): string {
  return formatDistanceToNow(fromUnixTime(Number(timestamp)), { addSuffix: true });
}

export function formatDuration(seconds: bigint): string {
  const s = Number(seconds);
  if (s >= 86400) return `${Math.floor(s / 86400)} day${Math.floor(s / 86400) !== 1 ? 's' : ''}`;
  if (s >= 3600) return `${Math.floor(s / 3600)} hour${Math.floor(s / 3600) !== 1 ? 's' : ''}`;
  return `${Math.floor(s / 60)} minute${Math.floor(s / 60) !== 1 ? 's' : ''}`;
}

// ─── Pool state ───────────────────────────────────────────────────────────────

export const POOL_STATE_LABELS = {
  0: 'OPEN',
  1: 'ACTIVE',
  2: 'COMPLETED',
  3: 'CANCELLED',
} as const;

export const POOL_STATE_COLORS = {
  0: 'text-accent bg-accent/10 border-accent/30',
  1: 'text-success bg-success/10 border-success/30',
  2: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  3: 'text-danger bg-danger/10 border-danger/30',
} as const;

// ─── Reputation tiers ─────────────────────────────────────────────────────────

export type ReputationTier = 'NEWCOMER' | 'TRUSTED' | 'VETERAN' | 'CHAMPION';

export function getReputationTier(score: number): ReputationTier {
  if (score >= 851) return 'CHAMPION';
  if (score >= 601) return 'VETERAN';
  if (score >= 301) return 'TRUSTED';
  return 'NEWCOMER';
}

export const TIER_COLORS: Record<ReputationTier, string> = {
  NEWCOMER: 'text-gray-400 border-gray-400',
  TRUSTED: 'text-blue-400 border-blue-400',
  VETERAN: 'text-purple-400 border-purple-400',
  CHAMPION: 'text-accent border-accent',
};

export const TIER_BG: Record<ReputationTier, string> = {
  NEWCOMER: 'bg-gray-400/10',
  TRUSTED: 'bg-blue-400/10',
  VETERAN: 'bg-purple-400/10',
  CHAMPION: 'bg-accent/10',
};

export const TIER_DESCRIPTIONS: Record<ReputationTier, string> = {
  NEWCOMER: 'Just getting started. Build trust by contributing on time.',
  TRUSTED: 'Reliable contributor. Access to most pools.',
  VETERAN: 'Proven track record. Preferred member in elite circles.',
  CHAMPION: 'Top-tier reputation. Unlock exclusive high-value pools.',
};

// ─── Explorer links ────────────────────────────────────────────────────────────

const EXPLORER = 'https://blockscout.westend.asset-hub.paritytech.net';

export function explorerTx(hash: string): string {
  return `${EXPLORER}/tx/${hash}`;
}

export function explorerAddress(address: string): string {
  return `${EXPLORER}/address/${address}`;
}
