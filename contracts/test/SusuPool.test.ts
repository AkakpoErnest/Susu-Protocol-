import { expect } from 'chai';
import { ethers } from 'hardhat';
import { time } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import {
  MockUSDC,
  ReputationRegistry,
  SusuFactory,
  SusuPool,
} from '../typechain-types';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

describe('SusuPool', function () {
  let mockUSDC: MockUSDC;
  let registry: ReputationRegistry;
  let factory: SusuFactory;

  let operator: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;
  let charlie: HardhatEthersSigner;
  let outsider: HardhatEthersSigner;

  const CONTRIBUTION = ethers.parseUnits('100', 6); // 100 mUSDC
  const CYCLE_DAYS = 1n;
  const GRACE_HOURS = 12n;
  const CYCLE_SECONDS = CYCLE_DAYS * 86400n;
  const GRACE_SECONDS = GRACE_HOURS * 3600n;

  async function deployPool(
    overrides: Partial<{
      maxMembers: number;
      minReputationScore: number;
      isPrivate: boolean;
      cycleDurationDays: number;
      gracePeriodHours: number;
    }> = {}
  ): Promise<SusuPool> {
    const tx = await factory
      .connect(operator)
      .createPool(
        'Test Pool',
        'A test pool',
        CONTRIBUTION,
        overrides.maxMembers ?? 3,
        overrides.cycleDurationDays ?? Number(CYCLE_DAYS),
        overrides.gracePeriodHours ?? Number(GRACE_HOURS),
        overrides.minReputationScore ?? 0,
        overrides.isPrivate ?? false,
        ethers.ZeroAddress
      );
    const receipt = await tx.wait();
    const event = receipt?.logs
      .map((log) => {
        try {
          return factory.interface.parseLog({ topics: [...log.topics], data: log.data });
        } catch {
          return null;
        }
      })
      .find((e) => e?.name === 'PoolCreated');

    const poolAddress = event?.args?.poolAddress;
    return ethers.getContractAt('SusuPool', poolAddress) as Promise<SusuPool>;
  }

  async function approveAndContribute(pool: SusuPool, signer: HardhatEthersSigner) {
    await mockUSDC.connect(signer).approve(await pool.getAddress(), CONTRIBUTION);
    await pool.connect(signer).contribute();
  }

  beforeEach(async function () {
    [operator, alice, bob, charlie, outsider] = await ethers.getSigners();

    // Deploy MockUSDC
    const USDC = await ethers.getContractFactory('MockUSDC');
    mockUSDC = await USDC.deploy();
    await mockUSDC.waitForDeployment();

    // Deploy ReputationRegistry
    const Registry = await ethers.getContractFactory('ReputationRegistry');
    registry = await Registry.deploy();
    await registry.waitForDeployment();

    // Deploy SusuFactory
    const Factory = await ethers.getContractFactory('SusuFactory');
    factory = await Factory.deploy(await registry.getAddress(), await mockUSDC.getAddress());
    await factory.waitForDeployment();

    // Wire up registry → factory
    await registry.setFactory(await factory.getAddress());

    // Fund test accounts with mUSDC
    const faucetAmount = ethers.parseUnits('1000', 6);
    for (const signer of [alice, bob, charlie, outsider]) {
      // Use faucet (mints 1000 mUSDC)
      await mockUSDC.connect(signer).faucet();
    }
    // Give operator extra tokens from deployer
    await mockUSDC.transfer(operator.address, faucetAmount);
  });

  // ─── Deployment ───────────────────────────────────────────────────────────

  describe('Pool deployment', function () {
    it('should deploy a pool with correct config', async function () {
      const pool = await deployPool();
      const [cfg] = await pool.getPoolInfo();
      expect(cfg.name).to.equal('Test Pool');
      expect(cfg.contributionAmount).to.equal(CONTRIBUTION);
      expect(cfg.maxMembers).to.equal(3n);
      expect(cfg.operator).to.equal(operator.address);
    });

    it('should start in OPEN state', async function () {
      const pool = await deployPool();
      expect(await pool.state()).to.equal(0); // OPEN
    });

    it('should reject invalid config: maxMembers < 2', async function () {
      await expect(
        factory.connect(operator).createPool(
          'Bad Pool', '', CONTRIBUTION, 1, 1, 12, 0, false, ethers.ZeroAddress
        )
      ).to.be.revertedWith('SusuFactory: maxMembers must be 2-20');
    });

    it('should reject invalid config: maxMembers > 20', async function () {
      await expect(
        factory.connect(operator).createPool(
          'Bad Pool', '', CONTRIBUTION, 21, 1, 12, 0, false, ethers.ZeroAddress
        )
      ).to.be.revertedWith('SusuFactory: maxMembers must be 2-20');
    });

    it('should reject zero contributionAmount', async function () {
      await expect(
        factory.connect(operator).createPool(
          'Bad Pool', '', 0n, 3, 1, 12, 0, false, ethers.ZeroAddress
        )
      ).to.be.revertedWith('SusuFactory: contributionAmount must be > 0');
    });
  });

  // ─── Joining ──────────────────────────────────────────────────────────────

  describe('joinPool', function () {
    it('should allow anyone to join an open public pool', async function () {
      const pool = await deployPool();
      await pool.connect(alice).joinPool();
      expect(await pool.isMember(alice.address)).to.be.true;
      expect(await pool.totalMembers()).to.equal(1n);
    });

    it('should emit MemberJoined event', async function () {
      const pool = await deployPool();
      await expect(pool.connect(alice).joinPool())
        .to.emit(pool, 'MemberJoined')
        .withArgs(alice.address, 1n);
    });

    it('should reject double join', async function () {
      const pool = await deployPool();
      await pool.connect(alice).joinPool();
      await expect(pool.connect(alice).joinPool()).to.be.revertedWith(
        'SusuPool: already a member'
      );
    });

    it('should respect maxMembers cap', async function () {
      const pool = await deployPool({ maxMembers: 2 });
      await pool.connect(alice).joinPool();
      await pool.connect(bob).joinPool();
      await expect(pool.connect(charlie).joinPool()).to.be.revertedWith('SusuPool: pool is full');
    });

    it('should enforce reputation gate', async function () {
      const pool = await deployPool({ minReputationScore: 600 });
      // Default score is 500 — should fail
      await expect(pool.connect(alice).joinPool()).to.be.revertedWith(
        'SusuPool: insufficient reputation score'
      );
    });

    it('should require operator approval for private pool', async function () {
      const pool = await deployPool({ isPrivate: true });
      await expect(pool.connect(alice).joinPool()).to.be.revertedWith(
        'SusuPool: not approved for private pool'
      );
    });

    it('should allow join after operator approves in private pool', async function () {
      const pool = await deployPool({ isPrivate: true });
      await pool.connect(operator).approveApplicant(alice.address);
      await pool.connect(alice).joinPool();
      expect(await pool.isMember(alice.address)).to.be.true;
    });
  });

  // ─── Starting ─────────────────────────────────────────────────────────────

  describe('startPool', function () {
    it('should only allow operator to start', async function () {
      const pool = await deployPool();
      await pool.connect(alice).joinPool();
      await pool.connect(bob).joinPool();
      await expect(pool.connect(alice).startPool()).to.be.revertedWith(
        'SusuPool: caller is not operator'
      );
    });

    it('should require at least 2 members', async function () {
      const pool = await deployPool();
      await pool.connect(alice).joinPool();
      await expect(pool.connect(operator).startPool()).to.be.revertedWith(
        'SusuPool: need at least 2 members'
      );
    });

    it('should start successfully with 2+ members', async function () {
      const pool = await deployPool();
      await pool.connect(alice).joinPool();
      await pool.connect(bob).joinPool();
      await pool.connect(operator).startPool();
      expect(await pool.state()).to.equal(1); // ACTIVE
      expect(await pool.currentCycle()).to.equal(1n);
    });

    it('should emit PoolStarted with shuffled order', async function () {
      const pool = await deployPool();
      await pool.connect(alice).joinPool();
      await pool.connect(bob).joinPool();
      await pool.connect(charlie).joinPool();
      const tx = await pool.connect(operator).startPool();
      const receipt = await tx.wait();
      const event = receipt?.logs
        .map((log) => {
          try {
            return pool.interface.parseLog({ topics: [...log.topics], data: log.data });
          } catch {
            return null;
          }
        })
        .find((e) => e?.name === 'PoolStarted');
      expect(event).to.not.be.null;
      expect(event?.args?.payoutOrder.length).to.equal(3);
    });
  });

  // ─── Contributing ─────────────────────────────────────────────────────────

  describe('contribute', function () {
    let pool: SusuPool;

    beforeEach(async function () {
      pool = await deployPool();
      await pool.connect(alice).joinPool();
      await pool.connect(bob).joinPool();
      await pool.connect(charlie).joinPool();
      await pool.connect(operator).startPool();
    });

    it('should accept contribution with correct amount', async function () {
      await approveAndContribute(pool, alice);
      expect(await pool.hasContributedThisCycle(alice.address)).to.be.true;
    });

    it('should emit ContributionMade event', async function () {
      await mockUSDC.connect(alice).approve(await pool.getAddress(), CONTRIBUTION);
      await expect(pool.connect(alice).contribute())
        .to.emit(pool, 'ContributionMade')
        .withArgs(alice.address, 1n, CONTRIBUTION, false);
    });

    it('should reject double contribution', async function () {
      await approveAndContribute(pool, alice);
      await mockUSDC.connect(alice).approve(await pool.getAddress(), CONTRIBUTION);
      await expect(pool.connect(alice).contribute()).to.be.revertedWith(
        'SusuPool: already contributed this cycle'
      );
    });

    it('should reject contribution after grace period', async function () {
      // Advance time past cycle + grace period
      await time.increase(Number(CYCLE_SECONDS + GRACE_SECONDS) + 1);
      await mockUSDC.connect(alice).approve(await pool.getAddress(), CONTRIBUTION);
      await expect(pool.connect(alice).contribute()).to.be.revertedWith(
        'SusuPool: contribution deadline passed'
      );
    });

    it('should mark contribution as late after cycle duration', async function () {
      // Advance past cycle duration but within grace period
      await time.increase(Number(CYCLE_SECONDS) + 1);
      await mockUSDC.connect(alice).approve(await pool.getAddress(), CONTRIBUTION);
      await expect(pool.connect(alice).contribute())
        .to.emit(pool, 'ContributionMade')
        .withArgs(alice.address, 1n, CONTRIBUTION, true);
    });

    it('should reject non-member contribution', async function () {
      await mockUSDC.connect(outsider).approve(await pool.getAddress(), CONTRIBUTION);
      await expect(pool.connect(outsider).contribute()).to.be.revertedWith(
        'SusuPool: not a member'
      );
    });

    it('should transfer tokens to pool contract', async function () {
      const poolAddr = await pool.getAddress();
      const before = await mockUSDC.balanceOf(poolAddr);
      await approveAndContribute(pool, alice);
      const after = await mockUSDC.balanceOf(poolAddr);
      expect(after - before).to.equal(CONTRIBUTION);
    });
  });

  // ─── Payout ───────────────────────────────────────────────────────────────

  describe('triggerPayout', function () {
    let pool: SusuPool;
    let payoutOrder: string[];

    beforeEach(async function () {
      pool = await deployPool();
      await pool.connect(alice).joinPool();
      await pool.connect(bob).joinPool();
      await pool.connect(charlie).joinPool();
      await pool.connect(operator).startPool();

      // Get actual payout order
      const [members] = await pool.getPayoutSchedule();
      payoutOrder = [...members] as string[];
    });

    it('should pay correct recipient after all contribute', async function () {
      const recipient = payoutOrder[0];

      // Capture balance before any contributions are made
      const before = await mockUSDC.balanceOf(recipient);
      await approveAndContribute(pool, alice);
      await approveAndContribute(pool, bob);
      await approveAndContribute(pool, charlie);
      const after = await mockUSDC.balanceOf(recipient);

      // Recipient contributes 1×CONTRIBUTION and receives 3×CONTRIBUTION
      // Net gain = 3×CONTRIBUTION - 1×CONTRIBUTION = 2×CONTRIBUTION
      expect(after - before).to.equal(CONTRIBUTION * 2n);
    });

    it('should advance to cycle 2 after payout', async function () {
      await approveAndContribute(pool, alice);
      await approveAndContribute(pool, bob);
      await approveAndContribute(pool, charlie);
      expect(await pool.currentCycle()).to.equal(2n);
    });

    it('should allow anyone to trigger after deadline', async function () {
      // Only alice contributes; deadline passes
      await approveAndContribute(pool, alice);
      await time.increase(Number(CYCLE_SECONDS + GRACE_SECONDS) + 1);

      // Bob (non-operator) can trigger
      await pool.connect(bob).triggerPayout();
      expect(await pool.currentCycle()).to.equal(2n);
    });

    it('should record defaults for non-contributors', async function () {
      await approveAndContribute(pool, alice);
      await time.increase(Number(CYCLE_SECONDS + GRACE_SECONDS) + 1);
      await pool.connect(operator).triggerPayout();

      // Bob and Charlie should be recorded as defaulted
      const bobHistory = await registry.getHistory(bob.address);
      const defaultRecord = bobHistory.find((r) => r.defaulted);
      expect(defaultRecord).to.not.be.undefined;
    });

    it('should emit PayoutTriggered', async function () {
      await approveAndContribute(pool, alice);
      await approveAndContribute(pool, bob);
      const potBefore = await pool.getPotBalance();
      await mockUSDC.connect(charlie).approve(await pool.getAddress(), CONTRIBUTION);
      await expect(pool.connect(charlie).contribute()).to.emit(pool, 'PayoutTriggered');
    });
  });

  // ─── Full 3-Member Cycle ──────────────────────────────────────────────────

  describe('Full 3-member pool cycle', function () {
    it('should complete all 3 cycles and finalize', async function () {
      const pool = await deployPool();
      await pool.connect(alice).joinPool();
      await pool.connect(bob).joinPool();
      await pool.connect(charlie).joinPool();
      await pool.connect(operator).startPool();

      const [payoutOrder] = await pool.getPayoutSchedule();

      // Complete all 3 cycles
      for (let cycle = 0; cycle < 3; cycle++) {
        // All three contribute
        for (const signer of [alice, bob, charlie]) {
          await mockUSDC.connect(signer).approve(await pool.getAddress(), CONTRIBUTION);
          await pool.connect(signer).contribute();
        }
        // After last contribution of last cycle, pool auto-finalizes
      }

      expect(await pool.state()).to.equal(2); // COMPLETED

      // Each member should have received payout once
      for (const addr of payoutOrder) {
        expect(await pool.hasReceivedPayout(addr)).to.be.true;
      }
    });

    it('should award completion bonus to members with no defaults', async function () {
      const pool = await deployPool();
      await pool.connect(alice).joinPool();
      await pool.connect(bob).joinPool();
      await pool.connect(charlie).joinPool();
      await pool.connect(operator).startPool();

      for (let cycle = 0; cycle < 3; cycle++) {
        for (const signer of [alice, bob, charlie]) {
          await mockUSDC.connect(signer).approve(await pool.getAddress(), CONTRIBUTION);
          await pool.connect(signer).contribute();
        }
      }

      // All completed with no defaults — should have completion bonus
      const aliceScore = await registry.getScore(alice.address);
      // 500 + (3 * 10 on-time) + 25 completion = 555
      expect(aliceScore).to.be.greaterThan(500n);
    });
  });

  // ─── Emergency Cancel ─────────────────────────────────────────────────────

  describe('emergencyCancel', function () {
    it('should allow operator to cancel immediately', async function () {
      const pool = await deployPool();
      await pool.connect(alice).joinPool();
      await pool.connect(bob).joinPool();
      await pool.connect(operator).startPool();

      await approveAndContribute(pool, alice);
      const aliceBalanceBefore = await mockUSDC.balanceOf(alice.address);

      await pool.connect(operator).emergencyCancel('Test cancel');
      expect(await pool.state()).to.equal(3); // CANCELLED

      // Alice's contribution should be refunded
      const aliceBalanceAfter = await mockUSDC.balanceOf(alice.address);
      expect(aliceBalanceAfter).to.equal(aliceBalanceBefore + CONTRIBUTION);
    });

    it('should refund current cycle contributions on cancel', async function () {
      const pool = await deployPool();
      await pool.connect(alice).joinPool();
      await pool.connect(bob).joinPool();
      await pool.connect(charlie).joinPool();
      await pool.connect(operator).startPool();

      // Only alice and bob contribute (not charlie) — contributing all 3 would
      // auto-trigger a payout, advancing the cycle and resetting contributions.
      const aliceBefore = await mockUSDC.balanceOf(alice.address);
      const bobBefore = await mockUSDC.balanceOf(bob.address);
      const charlieBefore = await mockUSDC.balanceOf(charlie.address);

      await approveAndContribute(pool, alice);
      await approveAndContribute(pool, bob);
      // charlie has not contributed

      await pool.connect(operator).emergencyCancel('Refund test');

      // Alice and Bob should be refunded their contributions
      expect(await mockUSDC.balanceOf(alice.address)).to.equal(aliceBefore);
      expect(await mockUSDC.balanceOf(bob.address)).to.equal(bobBefore);
      // Charlie never contributed — balance unchanged
      expect(await mockUSDC.balanceOf(charlie.address)).to.equal(charlieBefore);
    });

    it('should emit PoolCancelled', async function () {
      const pool = await deployPool();
      await pool.connect(alice).joinPool();
      await pool.connect(bob).joinPool();
      await pool.connect(operator).startPool();

      await expect(pool.connect(operator).emergencyCancel('test'))
        .to.emit(pool, 'PoolCancelled');
    });

    it('should allow cancellation if 75% of members vote', async function () {
      const pool = await deployPool({ maxMembers: 4 });
      await pool.connect(alice).joinPool();
      await pool.connect(bob).joinPool();
      await pool.connect(charlie).joinPool();
      await pool.connect(outsider).joinPool();
      await pool.connect(operator).startPool();

      // 3 out of 4 = 75%
      await pool.connect(alice).emergencyCancel('vote');
      await pool.connect(bob).emergencyCancel('vote');
      await pool.connect(charlie).emergencyCancel('vote');

      expect(await pool.state()).to.equal(3); // CANCELLED
    });
  });

  // ─── View Functions ───────────────────────────────────────────────────────

  describe('View functions', function () {
    it('getTimeUntilDeadline returns correct value', async function () {
      const pool = await deployPool();
      await pool.connect(alice).joinPool();
      await pool.connect(bob).joinPool();
      await pool.connect(operator).startPool();

      const deadline = await pool.getTimeUntilDeadline();
      expect(deadline).to.be.greaterThan(0n);
      // Should be approximately CYCLE_SECONDS + GRACE_SECONDS
      expect(deadline).to.be.lte(CYCLE_SECONDS + GRACE_SECONDS);
    });

    it('getMembersContributed returns correct count', async function () {
      const pool = await deployPool();
      await pool.connect(alice).joinPool();
      await pool.connect(bob).joinPool();
      await pool.connect(charlie).joinPool();
      await pool.connect(operator).startPool();

      expect(await pool.getMembersContributed()).to.equal(0n);
      await approveAndContribute(pool, alice);
      expect(await pool.getMembersContributed()).to.equal(1n);
      await approveAndContribute(pool, bob);
      expect(await pool.getMembersContributed()).to.equal(2n);
    });

    it('getPotBalance reflects contributions', async function () {
      const pool = await deployPool();
      await pool.connect(alice).joinPool();
      await pool.connect(bob).joinPool();
      await pool.connect(operator).startPool();

      expect(await pool.getPotBalance()).to.equal(0n);
      await approveAndContribute(pool, alice);
      expect(await pool.getPotBalance()).to.equal(CONTRIBUTION);
      await approveAndContribute(pool, bob);
      expect(await pool.getPotBalance()).to.equal(0n); // auto-paid out
    });
  });
});
