# Susu Protocol — Decentralized Rotating Savings on Polkadot

> *"My grandmother ran a susu with 12 women in Accra for 30 years. Everyone built their first house from it."*

[![Polkadot Hub](https://img.shields.io/badge/Network-Passet%20Hub%20Testnet-E6007A)](https://services.polkadothub-rpc.com/testnet)
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
| **PolkaVM Runtime** | Contracts are compiled with `resolc` to PolkaVM bytecode — more efficient and native to the Polkadot execution environment. |
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

---

## Deployed Contract Addresses (Passet Hub Testnet)

> Live on **Passet Hub** (Polkadot's smart contract testnet, chain ID `420420417`).

| Contract | Address |
|----------|---------|
| MockUSDC | `0xF7d2d01Ab847FCaC754DEd3DD14813Fb1306d946` |
| ReputationRegistry | `0x08250Af4b0CbF75F9929F2abf622C0d7Ba9B02dd` |
| SusuFactory | `0x92Da3B4d1611C7f06EE4FBB57854B2D23EB6190B` |
| SusuPool (demo) | `0xB4260c5d4b4977e79F5ad9Db45aA884520148E45` |

**Deployer wallet**: `0xC65C290DB6Eab614A5076FA800e28B8381223Ed8`
**Block Explorer**: https://blockscout-passet-hub.parity-testnet.parity.io

---

## Local Development

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- A wallet with PAS testnet tokens ([faucet](https://faucet.polkadot.io/?parachain=1111))

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
# Edit .env — add your PRIVATE_KEY (without leading 0x) and set WESTEND_RPC_URL
```

Your `.env` should look like:

```
PRIVATE_KEY=your_64_char_hex_private_key_here
WESTEND_RPC_URL=https://services.polkadothub-rpc.com/testnet
BLOCKSCOUT_API_KEY=
```

### 3. Compile contracts

Contracts must be compiled with **resolc** (not standard solc) to produce PolkaVM bytecode. The `polkadot: true` flag on the `westend` network in `hardhat.config.ts` triggers this automatically when deploying.

```bash
pnpm contracts:compile
```

> You will see Polkadot-specific warnings about `extcodesize` from OpenZeppelin's SafeERC20 — these are expected and harmless.

### 4. Run tests

```bash
pnpm contracts:test
# 55/55 tests passing
```

### 5. Deploy to Passet Hub testnet

**Get PAS test tokens first:**
1. Go to https://faucet.polkadot.io/?parachain=1111
2. Select **Paseo** network, parachain **1111**
3. Enter your EVM wallet address
4. The faucet accepts EVM (H160) addresses directly

**Deploy:**

```bash
# Option A — via Hardhat (recommended, auto-compiles with resolc)
pnpm contracts:deploy:westend

# Option B — direct Node script (more control, type-0 transactions)
node contracts/scripts/deploy-direct.js
```

> **Important gas note:** Passet Hub's base gas price is **1,000 gwei** (1,000,000,000,000 wei). The deploy scripts are configured with `gasPrice: 1,500,000,000,000` (1,500 gwei) to stay above the base fee. Standard 1 gwei will be rejected with `Invalid Transaction`.

The deploy script outputs addresses to `contracts/deployments/westend.json` and copies them to `frontend/src/lib/deployments.json`.

### 6. Configure frontend

```bash
cd frontend
cp .env.local.example .env.local
```

Fill in `frontend/.env.local`:

```
NEXT_PUBLIC_CHAIN_ID=420420417
NEXT_PUBLIC_FACTORY_ADDRESS=0x92Da3B4d1611C7f06EE4FBB57854B2D23EB6190B
NEXT_PUBLIC_REPUTATION_ADDRESS=0x08250Af4b0CbF75F9929F2abf622C0d7Ba9B02dd
NEXT_PUBLIC_MOCKUSDC_ADDRESS=0xF7d2d01Ab847FCaC754DEd3DD14813Fb1306d946
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_from_cloud_walletconnect_com
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

  55 passing
```

---

## Network Details

### Passet Hub Testnet (current deployment)

```
Network Name:  Passet Hub Testnet
RPC URL:       https://services.polkadothub-rpc.com/testnet
Alt RPC URL:   https://eth-rpc-testnet.polkadot.io
Chain ID:      420420417
Symbol:        PAS
Decimals:      18
Explorer:      https://blockscout-passet-hub.parity-testnet.parity.io
```

> **Note:** The old Westend Asset Hub RPC (`https://westend-asset-hub-eth-rpc.polkadot.io`, chain ID `420420421`) has a metadata mismatch and should not be used. Use the Passet Hub endpoints above.

### Getting PAS Test Tokens

1. Visit https://faucet.polkadot.io/?parachain=1111
2. Select **Paseo** network
3. Enter your EVM wallet address (e.g. `0xYourAddress`)
4. Submit — tokens arrive within 1-2 minutes via XCM

> The faucet is rate-limited to once per day per IP/address.

### Adding Passet Hub to MetaMask

| Setting | Value |
|---------|-------|
| Network Name | Passet Hub Testnet |
| RPC URL | `https://services.polkadothub-rpc.com/testnet` |
| Chain ID | `420420417` |
| Currency Symbol | `PAS` |
| Explorer URL | `https://blockscout-passet-hub.parity-testnet.parity.io` |

---

## How to Use (User Guide)

### Step 1: Connect Your Wallet

Open the app, click "Connect Wallet", and select your wallet (MetaMask, Rabby, etc.).

### Step 2: Add Passet Hub Network

If your wallet doesn't have Passet Hub, the app will prompt you to add it using the network details above.

### Step 3: Get Test PAS (Gas)

Visit the [Polkadot Faucet](https://faucet.polkadot.io/?parachain=1111) and request PAS for Passet Hub (parachain 1111, Paseo network).

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

## Smart Contract Design Decisions

### PolkaVM Compilation (resolc)

Contracts are compiled with `@parity/hardhat-polkadot-resolc` (resolc v1.0.0) instead of standard solc. Setting `polkadot: true` on the Hardhat network config triggers resolc automatically during `hardhat run --network westend`. PolkaVM bytecode starts with the magic bytes `0x50564d` ("PVM"). Standard EVM bytecode is rejected by the Passet Hub runtime with error `1010: Invalid Transaction`.

### Gas Settings

Passet Hub uses a base fee of 1,000 gwei. Deploy transactions use `gasPrice: 1,500,000,000,000` (1,500 gwei) and `gasLimit: 10,000,000`. These are set explicitly as legacy type-0 transactions to avoid EIP-1559 estimation issues.

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
│   │   ├── deploy.ts              Hardhat deployment script
│   │   ├── deploy-direct.js       Direct ethers.js deploy (type-0 txs)
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
- [x] Deployed to Passet Hub testnet (chain ID 420420417)
- [x] Production-quality frontend
- [x] 55/55 tests passing

### v2 (Post-hackathon)
- [ ] **Fix factory pool creation on PolkaVM** — Work around `new SusuPool()` CREATE limitation using a clone/proxy pattern or pre-authorized pool registry
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

## Known Issues & Limitations

| Issue | Status | Notes |
|-------|--------|-------|
| `SusuFactory.createPool()` reverts on Passet Hub | Known | PolkaVM restricts `new Contract()` inside contracts. Workaround: deploy SusuPool directly using `deploy-direct.js`. Fix planned for v2. |
| Old Westend RPC (`420420421`) broken | Resolved | Switched to Passet Hub (`420420417`) with working RPC. |
| Standard EVM bytecode rejected | Resolved | Contracts now compiled with resolc to produce PolkaVM bytecode. |
| Gas price too low | Resolved | Updated to 1,500 gwei (above Passet Hub's 1,000 gwei base fee). |

---

## Team

Built for the **Polkadot Solidity Hackathon 2026**.

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
