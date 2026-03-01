import { expect } from 'chai';
import { ethers } from 'hardhat';
import { ReputationRegistry, MockUSDC } from '../typechain-types';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

describe('ReputationRegistry', function () {
  let registry: ReputationRegistry;
  let owner: HardhatEthersSigner;
  let factory: HardhatEthersSigner;
  let pool: HardhatEthersSigner;
  let member: HardhatEthersSigner;
  let other: HardhatEthersSigner;

  const INITIAL_SCORE = 500n;
  const MAX_SCORE = 1000n;

  beforeEach(async function () {
    [owner, factory, pool, member, other] = await ethers.getSigners();

    const Registry = await ethers.getContractFactory('ReputationRegistry');
    registry = await Registry.deploy();
    await registry.waitForDeployment();

    // Set factory
    await registry.connect(owner).setFactory(factory.address);

    // Authorize a pool via factory
    await registry.connect(factory).authorizePool(pool.address);
  });

  // ─── Initial State ───────────────────────────────────────────────────────

  describe('Initial state', function () {
    it('should start member at 500 (uninitialized)', async function () {
      const score = await registry.getScore(member.address);
      expect(score).to.equal(INITIAL_SCORE);
    });

    it('should have empty history for new member', async function () {
      const history = await registry.getHistory(member.address);
      expect(history.length).to.equal(0);
    });

    it('should start pools completed at 0', async function () {
      expect(await registry.getTotalPoolsCompleted(member.address)).to.equal(0);
    });
  });

  // ─── Authorization ────────────────────────────────────────────────────────

  describe('Authorization', function () {
    it('should only allow factory to authorize pools', async function () {
      await expect(
        registry.connect(other).authorizePool(other.address)
      ).to.be.revertedWith('ReputationRegistry: caller is not factory');
    });

    it('should reject writes from unauthorized addresses', async function () {
      await expect(
        registry.connect(other).recordContribution(member.address, pool.address, 1, true)
      ).to.be.revertedWith('ReputationRegistry: caller not authorized pool');
    });

    it('should only allow owner to set factory', async function () {
      await expect(registry.connect(other).setFactory(other.address)).to.be.revertedWithCustomError(
        registry,
        'OwnableUnauthorizedAccount'
      );
    });

    it('should reject zero address for factory', async function () {
      const Registry = await ethers.getContractFactory('ReputationRegistry');
      const reg2 = await Registry.deploy();
      await expect(reg2.setFactory(ethers.ZeroAddress)).to.be.revertedWith(
        'ReputationRegistry: zero address'
      );
    });
  });

  // ─── Score Updates ────────────────────────────────────────────────────────

  describe('On-time contribution', function () {
    it('should add 10 points for on-time contribution', async function () {
      await registry.connect(pool).recordContribution(member.address, pool.address, 1, true);
      expect(await registry.getScore(member.address)).to.equal(INITIAL_SCORE + 10n);
    });

    it('should emit ScoreUpdated event', async function () {
      await expect(
        registry.connect(pool).recordContribution(member.address, pool.address, 1, true)
      )
        .to.emit(registry, 'ScoreUpdated')
        .withArgs(member.address, INITIAL_SCORE, INITIAL_SCORE + 10n);
    });

    it('should emit ContributionRecorded event', async function () {
      await expect(
        registry.connect(pool).recordContribution(member.address, pool.address, 1, true)
      )
        .to.emit(registry, 'ContributionRecorded')
        .withArgs(member.address, pool.address, 1n);
    });
  });

  describe('Late contribution', function () {
    it('should add 3 points for late contribution', async function () {
      await registry.connect(pool).recordContribution(member.address, pool.address, 1, false);
      expect(await registry.getScore(member.address)).to.equal(INITIAL_SCORE + 3n);
    });
  });

  describe('Default', function () {
    it('should subtract 50 points for a default', async function () {
      await registry.connect(pool).recordDefault(member.address, pool.address, 1);
      expect(await registry.getScore(member.address)).to.equal(INITIAL_SCORE - 50n);
    });

    it('should floor score at 0', async function () {
      // Bring score down to near zero first
      // Each default is -50 from 500, need 11 defaults to go below 0
      for (let i = 0; i < 11; i++) {
        await registry.connect(pool).recordDefault(member.address, pool.address, i);
      }
      expect(await registry.getScore(member.address)).to.equal(0n);
    });
  });

  describe('Completion bonus', function () {
    it('should add 25 points for pool completion', async function () {
      await registry.connect(pool).recordCompletion(member.address, pool.address);
      expect(await registry.getScore(member.address)).to.equal(INITIAL_SCORE + 25n);
    });

    it('should increment totalPoolsCompleted', async function () {
      await registry.connect(pool).recordCompletion(member.address, pool.address);
      expect(await registry.getTotalPoolsCompleted(member.address)).to.equal(1n);
    });
  });

  describe('Score cap at 1000', function () {
    it('should not exceed max score of 1000', async function () {
      // Each contribution = +10, need (1000 - 500) / 10 = 50 contributions to hit cap
      for (let i = 0; i < 52; i++) {
        await registry.connect(pool).recordContribution(member.address, pool.address, i, true);
      }
      expect(await registry.getScore(member.address)).to.equal(MAX_SCORE);
    });
  });

  // ─── History ──────────────────────────────────────────────────────────────

  describe('History tracking', function () {
    it('should record contribution history', async function () {
      await registry.connect(pool).recordContribution(member.address, pool.address, 1, true);
      await registry.connect(pool).recordContribution(member.address, pool.address, 2, false);
      await registry.connect(pool).recordDefault(member.address, pool.address, 3);

      const history = await registry.getHistory(member.address);
      expect(history.length).to.equal(3);
      expect(history[0].onTime).to.equal(true);
      expect(history[0].defaulted).to.equal(false);
      expect(history[1].onTime).to.equal(false);
      expect(history[1].defaulted).to.equal(false);
      expect(history[2].defaulted).to.equal(true);
    });

    it('should record pool address and cycle number in history', async function () {
      await registry.connect(pool).recordContribution(member.address, pool.address, 5, true);
      const history = await registry.getHistory(member.address);
      expect(history[0].poolAddress).to.equal(pool.address);
      expect(history[0].cycleNumber).to.equal(5n);
    });
  });
});
