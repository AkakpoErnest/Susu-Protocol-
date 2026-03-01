// ─── Pool Types ────────────────────────────────────────────────────────────────

export interface PoolConfig {
  name: string;
  description: string;
  operator: `0x${string}`;
  stablecoin: `0x${string}`;
  contributionAmount: bigint;
  maxMembers: bigint;
  cycleDurationSeconds: bigint;
  gracePeriodSeconds: bigint;
  minReputationScore: bigint;
  isPrivate: boolean;
}

export interface PoolInfo {
  config: PoolConfig;
  state: PoolState;
  currentCycle: bigint;
  totalMembers: bigint;
  cycleStartTime: bigint;
  potBalance: bigint;
  address: `0x${string}`;
}

export enum PoolState {
  OPEN = 0,
  ACTIVE = 1,
  COMPLETED = 2,
  CANCELLED = 3,
}

export interface PayoutScheduleEntry {
  address: `0x${string}`;
  cycleIndex: number;
  paid: boolean;
  isCurrent: boolean;
}

// ─── Reputation Types ──────────────────────────────────────────────────────────

export interface ContributionRecord {
  poolAddress: `0x${string}`;
  cycleNumber: bigint;
  onTime: boolean;
  defaulted: boolean;
  timestamp: bigint;
}

export type ReputationTier = 'NEWCOMER' | 'TRUSTED' | 'VETERAN' | 'CHAMPION';

// ─── Create Pool Form ─────────────────────────────────────────────────────────

export interface CreatePoolFormData {
  name: string;
  description: string;
  isPrivate: boolean;
  contributionAmount: string;
  maxMembers: number;
  cycleDurationDays: number;
  gracePeriodHours: number;
  minReputationScore: number;
}
