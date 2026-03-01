// Contract ABIs and addresses for Susu Protocol
// Addresses loaded from environment variables (set after deployment)

// ─── Addresses ────────────────────────────────────────────────────────────────

export const CONTRACT_ADDRESSES = {
  MockUSDC: (process.env.NEXT_PUBLIC_MOCKUSDC_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  ReputationRegistry: (process.env.NEXT_PUBLIC_REPUTATION_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  SusuFactory: (process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
} as const;

// ─── ABIs ─────────────────────────────────────────────────────────────────────

export const MOCK_USDC_ABI = [
  {
    type: 'constructor',
    inputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'faucet',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'lastClaim',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'timeUntilNextClaim',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'Faucet',
    inputs: [
      { name: 'recipient', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'spender', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
] as const;

export const REPUTATION_REGISTRY_ABI = [
  {
    type: 'function',
    name: 'getScore',
    inputs: [{ name: 'member', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getHistory',
    inputs: [{ name: 'member', type: 'address' }],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'poolAddress', type: 'address' },
          { name: 'cycleNumber', type: 'uint256' },
          { name: 'onTime', type: 'bool' },
          { name: 'defaulted', type: 'bool' },
          { name: 'timestamp', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getTotalPoolsCompleted',
    inputs: [{ name: 'member', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'scores',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'ScoreUpdated',
    inputs: [
      { name: 'member', type: 'address', indexed: true },
      { name: 'oldScore', type: 'uint256', indexed: false },
      { name: 'newScore', type: 'uint256', indexed: false },
    ],
  },
] as const;

export const SUSU_FACTORY_ABI = [
  {
    type: 'constructor',
    inputs: [
      { name: '_reputationRegistry', type: 'address' },
      { name: '_defaultStablecoin', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'createPool',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'contributionAmount', type: 'uint256' },
      { name: 'maxMembers', type: 'uint256' },
      { name: 'cycleDurationDays', type: 'uint256' },
      { name: 'gracePeriodHours', type: 'uint256' },
      { name: 'minReputationScore', type: 'uint256' },
      { name: 'isPrivate', type: 'bool' },
      { name: 'stablecoin', type: 'address' },
    ],
    outputs: [{ name: 'poolAddress', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getAllPools',
    inputs: [],
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getActivePools',
    inputs: [],
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPoolsByOperator',
    inputs: [{ name: 'op', type: 'address' }],
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPoolsByMember',
    inputs: [{ name: 'member', type: 'address' }],
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPoolCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'allPools',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalPoolsCreated',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'reputationRegistry',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'defaultStablecoin',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'PoolCreated',
    inputs: [
      { name: 'poolAddress', type: 'address', indexed: true },
      { name: 'operator', type: 'address', indexed: true },
      { name: 'name', type: 'string', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
      { name: 'poolId', type: 'uint256', indexed: false },
    ],
  },
] as const;

export const SUSU_POOL_ABI = [
  {
    type: 'function',
    name: 'joinPool',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'startPool',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'contribute',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'triggerPayout',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'approveApplicant',
    inputs: [{ name: 'member', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'emergencyCancel',
    inputs: [{ name: 'reason', type: 'string' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getPoolInfo',
    inputs: [],
    outputs: [
      {
        name: 'poolConfig',
        type: 'tuple',
        components: [
          { name: 'name', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'operator', type: 'address' },
          { name: 'stablecoin', type: 'address' },
          { name: 'contributionAmount', type: 'uint256' },
          { name: 'maxMembers', type: 'uint256' },
          { name: 'cycleDurationSeconds', type: 'uint256' },
          { name: 'gracePeriodSeconds', type: 'uint256' },
          { name: 'minReputationScore', type: 'uint256' },
          { name: 'isPrivate', type: 'bool' },
        ],
      },
      { name: 'poolState', type: 'uint8' },
      { name: 'cycle', type: 'uint256' },
      { name: 'members', type: 'uint256' },
      { name: 'cycleStart', type: 'uint256' },
      { name: 'potBalance', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPayoutSchedule',
    inputs: [],
    outputs: [
      { name: 'members', type: 'address[]' },
      { name: 'paid', type: 'bool[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getMembers',
    inputs: [],
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getContributionStatus',
    inputs: [],
    outputs: [
      { name: '', type: 'address[]' },
      { name: '', type: 'bool[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getMembersContributed',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getTimeUntilDeadline',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPotBalance',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'state',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'currentCycle',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalMembers',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isMember',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'hasContributedThisCycle',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'hasReceivedPayout',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'cycleStartTime',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'poolId',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'MemberJoined',
    inputs: [
      { name: 'member', type: 'address', indexed: true },
      { name: 'totalMembers', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PoolStarted',
    inputs: [
      { name: 'timestamp', type: 'uint256', indexed: false },
      { name: 'payoutOrder', type: 'address[]', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ContributionMade',
    inputs: [
      { name: 'member', type: 'address', indexed: true },
      { name: 'cycle', type: 'uint256', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'late', type: 'bool', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PayoutTriggered',
    inputs: [
      { name: 'recipient', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'cycle', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'MemberDefaulted',
    inputs: [
      { name: 'member', type: 'address', indexed: true },
      { name: 'cycle', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PoolCompleted',
    inputs: [
      { name: 'timestamp', type: 'uint256', indexed: false },
      { name: 'totalCycles', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PoolCancelled',
    inputs: [
      { name: 'timestamp', type: 'uint256', indexed: false },
      { name: 'reason', type: 'string', indexed: false },
    ],
  },
] as const;
