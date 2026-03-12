# Susu Protocol — Decentralized Rotating Savings on Polkadot

> *"My grandmother ran a susu with 12 women in Accra for 30 years. Everyone built their first house from it."*

[![Polkadot Hub](https://img.shields.io/badge/Network-Polkadot%20Hub%20Westend-E6007A)](https://westend-asset-hub-eth-rpc.polkadot.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue)](https://soliditylang.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)

---

## What is Susu?

**Susu** (Ghana), **Ajo** (Nigeria), **Tontine** (Côte d'Ivoire and francophone Africa), **Djanggi** (Cameroon), **Ekub** (Ethiopia) — different names, the same ancient wisdom.

A group of trusted community members pool their savings together. Each cycle, one member receives the entire pot in a rotating fashion. The rotation continues until every member has received the pot once. The group can then restart or disband.

This tradition has been practiced for **centuries across more than 50 countries** and moves an estimated **$400 billion annually** — more than many formal banking systems. It works on trust, social accountability, and community bonds. No banks. No credit checks. No middlemen.

## The Problem

Traditional Susu groups are powerful but fragile:

- **Operator risk**: The group organizer can disappear with the money — and frequently does. With no enforcement mechanism, participants have no recourse.
- **No diaspora access**: A Ghanaian in London wants to participate in her mother's Susu in Accra. She can't. Wire transfers are expensive, slow, and introduce currency risk.
- **No credit history**: Years of perfect participation builds no formal financial record. Banks don't recognise Susu history. No credit score is built, no loan access unlocked.
- **Trust degradation**: As groups grow beyond tight-knit circles, trust becomes harder to maintain. Defections increase. The system breaks down.

## Our Solution

Susu Protocol replaces trust with cryptographic guarantees:

- **Smart contracts enforce all rules** — no operator can steal the pot; funds are locked on-chain until the rightful recipient's turn
- **Payout is automatic** — when all members contribute, the contract sends the full pot immediately, no human needed
- **Participation builds verifiable on-chain reputation** — every on-time contribution is recorded permanently; your history follows you across every group you join
- **Cross-border by default** — anyone with a wallet and an internet connection can join, regardless of geography or banking access
- **Transparent and auditable** — all transactions are public on Polkadot Hub's block explorer

## Why Polkadot Hub?

Polkadot Hub (Asset Hub) is the ideal foundation for global community finance:

| Feature | Why It Matters for Susu |
|---------|------------------------|
| **EVM Compatible** | Full Solidity support. Deploy and interact with familiar tooling (Hardhat, wagmi, viem). |
| **XCM Native** | Cross-Chain Messaging built into the protocol. Future: accept contributions from Celo, Base, any parachain — in one Susu pool. |
| **Shared Security** | Protected by Polkadot's entire validator set (Nominated Proof-of-Stake). Your community's funds are guarded by institutional-grade security. |
| **Low Fees** | Micro-contributions are economically viable. A $5 weekly contribution shouldn't cost $3 in gas. |
| **Substrate Foundation** | Polkadot's native multi-asset support means future versions can handle multiple stablecoins natively. |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SUSU PROTOCOL                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SusuFactory                                                │
│  ├── createPool() → deploys SusuPool                       │
│  ├── getAllPools()                                          │
│  ├── getPoolsByMember()                                     │
│  └── getPoolsByOperator()                                   │
│                                                             │
│  SusuPool (per group)                                       │
│  ├── joinPool()                                            │
│  ├── startPool()  ──── shuffles payout order               │
│  ├── contribute() ──── pulls mUSDC, records to registry    │
│  ├── triggerPayout() ─ sends pot to current recipient      │
│  └── emergencyCancel() ─ operator or 75% member vote       │
│                                                             │
│  ReputationRegistry (global)                                │
│  ├── recordContribution() ─ +10 (on-time) or +3 (late)    │
│  ├── recordDefault()       ─ -50                           │
│  ├── recordCompletion()    ─ +25 bonus                     │
│  └── getScore(), getHistory()                              │
│                                                             │
│  MockUSDC                                                   │
│  ├── faucet() ─ 1000 mUSDC / 24h                          │
│  └── Standard ERC20                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Flow:
User → SusuFactory.createPool() → new SusuPool deployed
                                 → ReputationRegistry.authorizePool()

User → SusuPool.joinPool()      → Factory.registerMember()
     → SusuPool.contribute()    → Registry.recordContribution()
     → SusuPool.triggerPayout() → ERC20.transfer(recipient, pot)
                                 → auto-advance cycle
     → (final cycle)            → Registry.recordCompletion()
                                 → PoolState = COMPLETED
```

## Contract Addresses (Westend Testnet)

> Run `pnpm contracts:deploy` (or `node contracts/scripts/deploy-direct.ts`) to deploy, then copy the addresses below from `contracts/deployments/westend.json`.

| Contract | Address |
|----------|---------|
| MockUSDC | `TBD (see contracts/deployments/westend.json)` |
| ReputationRegistry | `TBD (see contracts/deployments/westend.json)` |
| SusuFactory | `TBD (see contracts/deployments/westend.json)` |
| Demo Pool | `TBD (see contracts/deployments/westend.json)` |

**Block Explorer**: https://blockscout.westend.asset-hub.paritytech.net

---

## Local Development

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- A wallet with WND testnet tokens ([faucet](https://faucet.polkadot.io))

### 1. Clone and install

```bash
git clone https://github.com/AkakpoErnest/Susu-Protocol-.git
cd Susu-Protocol-
pnpm install
```

### 2. Configure contracts

```bash
cd contracts
cp .env.example .env
# Edit .env and add your PRIVATE_KEY (with leading 0x)
```

> **Note:** The Hardhat config pins `evmVersion = "paris"` and uses fixed `gasPrice`/`gas` values to avoid estimation issues on Westend.

### 3. Compile contracts

```bash
pnpm contracts:compile
```

### 4. Run tests

```bash
pnpm contracts:test
```

### 5. Deploy to Westend testnet

```bash
pnpm contracts:deploy
# This outputs contract addresses to contracts/deployments/westend.json
# and prints them to console
```

### 6. Configure frontend

```bash
cd frontend
cp .env.local.example .env.local
# Fill in the contract addresses from step 5
# Add your WalletConnect Project ID from https://cloud.walletconnect.com
```

### 7. Run the frontend

```bash
pnpm frontend:dev
# Open http://localhost:3000
```

---

## Running Tests

```bash
pnpm contracts:test
```

Expected output:
```
  ReputationRegistry
    Initial state
      ✓ should start member at 500 (uninitialized)
      ✓ should have empty history for new member
      ✓ should start pools completed at 0
    Authorization
      ✓ should only allow factory to authorize pools
      ✓ should reject writes from unauthorized addresses
      ...
    Score Updates
      ✓ should add 10 points for on-time contribution
      ✓ should add 3 points for late contribution
      ✓ should subtract 50 points for a default
      ✓ should floor score at 0
      ✓ should add 25 points for pool completion
      ✓ should not exceed max score of 1000

  SusuPool
    Pool deployment
      ✓ should deploy a pool with correct config
      ✓ should start in OPEN state
      ...
    Full 3-member pool cycle
      ✓ should complete all 3 cycles and finalize
      ✓ should award completion bonus to members with no defaults
    Emergency Cancel
      ✓ should allow operator to cancel immediately
      ✓ should refund current cycle contributions on cancel
      ✓ should allow cancellation if 75% of members vote

  XX passing (Xs)
```

---

## How to Use (User Guide)

### Step 1: Connect Your Wallet

Open the app, click "Connect Wallet", and select your wallet (MetaMask, Rabby, etc.).

### Step 2: Add Westend Asset Hub Network

If your wallet doesn't have Westend Asset Hub, the app will prompt you to add it:

| Setting | Value |
|---------|-------|
| Network Name | Westend Asset Hub |
| RPC URL | `https://westend-asset-hub-eth-rpc.polkadot.io` |
| Chain ID | `420420421` |
| Currency Symbol | `WND` |
| Explorer URL | `https://blockscout.westend.asset-hub.paritytech.net` |

### Step 3: Get Test WND (Gas)

Visit the [Polkadot Faucet](https://faucet.polkadot.io) and request WND for the Westend Asset Hub chain. You'll need this for gas fees.

### Step 4: Get Test mUSDC

In the Dashboard, click **"Get Test Tokens"**. This calls `MockUSDC.faucet()` and sends 1000 mUSDC to your address. Rate limited to once per 24 hours.

### Step 5: Create or Join a Pool

**Create:** Go to `/pools/create`, fill the multi-step form, and deploy your pool. You become the operator.

**Join:** Browse pools at `/pools/explore`. Click any OPEN pool and hit "Join Pool". If the pool has a minimum reputation score, yours must meet the threshold.

### Step 6: Contribute Each Cycle

1. Navigate to your pool's detail page
2. Click **Approve mUSDC** (allows the pool contract to pull your tokens)
3. Click **Contribute** (sends your mUSDC to the pool)
4. When all members contribute, the payout fires automatically to the cycle's designated recipient

### Step 7: Watch Your Reputation Grow

Every on-time contribution: **+10 points**. Late contributions (within grace period): **+3 points**. Complete a full pool without defaulting: **+25 bonus points**. Your score and history are visible at `/reputation/[your-address]`.

---

## Testnet Setup

### Network Details

```
Network Name:  Westend Asset Hub
RPC URL:       https://westend-asset-hub-eth-rpc.polkadot.io
Chain ID:      420420421
Symbol:        WND
Decimals:      18
Explorer:      https://blockscout.westend.asset-hub.paritytech.net
```

### Getting WND Test Tokens

1. Visit https://faucet.polkadot.io
2. Select "Westend Asset Hub"
3. Enter your address
4. Click "Get some WND"

---

## Smart Contract Design Decisions

### Reputation Score Initialisation

New addresses are treated as score 500 (neutral). This avoids the cold-start problem where new users are penalised simply for being new. Score 500 = "untested but given benefit of the doubt."

### Payout Order Shuffle

When the operator calls `startPool()`, member addresses are shuffled using `keccak256(block.timestamp, block.prevrandao, blockhash(block.number-1), members, i)`. This is pseudo-random and fine for testnet. For mainnet, Chainlink VRF or a commit-reveal scheme would be appropriate.

### Emergency Cancel Mechanics

Either the operator can cancel unilaterally, OR 75% of members can vote to cancel (preventing operator abuse). Current cycle contributions are refunded. Previous cycles' payouts are not reversed.

### Default Handling

If a member misses a cycle deadline, they are recorded as defaulted (-50 reputation), but they are not ejected from the pool. The payout still proceeds to the cycle's recipient (from contributions received). Two consecutive defaults could be grounds for future protocol-level ejection (roadmap item).

---

## Project Structure

```
susu-protocol/
├── contracts/
│   ├── contracts/
│   │   ├── MockUSDC.sol           ERC20 test token, public faucet
│   │   ├── ReputationRegistry.sol Global reputation scores
│   │   ├── SusuPool.sol           Individual savings circle
│   │   └── SusuFactory.sol        Pool deployer + registry
│   ├── scripts/
│   │   ├── deploy.ts              Full deployment script
│   │   └── verify.ts              Blockscout verification
│   ├── test/
│   │   ├── SusuPool.test.ts       Pool lifecycle tests
│   │   └── ReputationRegistry.test.ts Reputation tests
│   ├── deployments/
│   │   └── westend.json           Written by deploy script
│   └── hardhat.config.ts
│
├── frontend/
│   ├── src/
│   │   ├── app/                   Next.js App Router pages
│   │   ├── components/            React components
│   │   ├── hooks/                 wagmi custom hooks
│   │   ├── lib/                   Config, utils, contract ABIs
│   │   └── types/                 TypeScript types
│   └── package.json
│
└── pnpm-workspace.yaml
```

---

## Roadmap

### v1 (Current — Hackathon)
- [x] Full Susu pool lifecycle (join → contribute → payout)
- [x] On-chain reputation system
- [x] Testnet deployment (Westend Asset Hub)
- [x] Production-quality frontend

### v2 (Post-hackathon)
- [ ] **XCM cross-chain contributions** — Accept mUSDC from Moonbeam, Acala, or any EVM parachain via XCM
- [ ] **Mobile-first PWA** — Installable progressive web app optimized for mobile users in Africa
- [ ] **Operator dashboard** — Member management, approval workflows, private pool invites
- [ ] **Flexible token support** — Any ERC20 stablecoin (native USDC when available on Polkadot Hub)

### v3 (Long-term vision)
- [ ] **DAO governance** — Protocol fee parameters governed by SUSU token holders
- [ ] **Credit scoring API** — Export Susu history to DeFi lending protocols (Aave, Compound)
- [ ] **Offline-first mobile** — USSD/SMS fallback for non-smartphone users
- [ ] **Mainnet deployment** — After security audit

---

## Security Considerations

- **ReentrancyGuard** on all token-moving functions
- **SafeERC20** for all token transfers
- **No centralised keys** — no admin can pause or drain pools
- **Operator limits** — operator can start/cancel but cannot redirect funds
- **Audits**: This is hackathon code. Do not use with real money. An audit is required before any mainnet deployment.

---

## Team

Built for the Polkadot Solidity Hackathon 2026.

---

## License

MIT — see [LICENSE](./LICENSE)

---

*Susu Protocol is testnet software. It is not audited. Do not use with real funds.*

## Contributing

- Fork the repository and create a feature branch for your changes.
- Keep commits small and focused; use clear commit messages.
- Run tests locally before opening a pull request:

```bash
pnpm contracts:test
```

## Contact

- Maintainer: AkakpoErnest — open an issue for questions or feature requests.

