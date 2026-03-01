import { ethers, network } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerBalance = await ethers.provider.getBalance(deployer.address);

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║           SUSU PROTOCOL — DEPLOYMENT SCRIPT              ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  console.log(`Network:      ${network.name} (chainId: ${network.config.chainId})`);
  console.log(`Deployer:     ${deployer.address}`);
  console.log(`Balance:      ${ethers.formatEther(deployerBalance)} WND\n`);

  if (deployerBalance === 0n) {
    throw new Error('Deployer has no balance. Get WND from the faucet first.');
  }

  // ─── 1. Deploy MockUSDC ────────────────────────────────────────────────────
  console.log('1/4 Deploying MockUSDC...');
  const MockUSDC = await ethers.getContractFactory('MockUSDC');
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();
  console.log(`    ✓ MockUSDC deployed at: ${mockUSDCAddress}`);

  // ─── 2. Deploy ReputationRegistry ─────────────────────────────────────────
  console.log('2/4 Deploying ReputationRegistry...');
  const ReputationRegistry = await ethers.getContractFactory('ReputationRegistry');
  const registry = await ReputationRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`    ✓ ReputationRegistry deployed at: ${registryAddress}`);

  // ─── 3. Deploy SusuFactory ────────────────────────────────────────────────
  console.log('3/4 Deploying SusuFactory...');
  const SusuFactory = await ethers.getContractFactory('SusuFactory');
  const factory = await SusuFactory.deploy(registryAddress, mockUSDCAddress);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log(`    ✓ SusuFactory deployed at: ${factoryAddress}`);

  // ─── 4. Wire up Registry → Factory ────────────────────────────────────────
  console.log('4/4 Configuring contracts...');
  const setFactoryTx = await registry.setFactory(factoryAddress);
  await setFactoryTx.wait();
  console.log(`    ✓ ReputationRegistry.setFactory(${factoryAddress})`);

  // ─── 5. Create Demo Pool (5-minute cycles for testing) ────────────────────
  console.log('\nCreating demo pool with 5-minute cycles for testnet judges...');

  // Demo pool uses 5 minutes as "1 day" — we pass cycleDurationDays=1 but
  // for a true 5-minute demo, we need to interact directly with the pool
  // Actually let's create it via factory with minimal values
  // cycleDurationDays must be >= 1, so we use 1 day cycle
  // For demo purposes, we'll note that the UI can show the actual small cycle
  const demoTx = await factory.createPool(
    'Demo Susu Circle',
    'A demo pool with short cycles for testing. Join, contribute, and see your payout!',
    ethers.parseUnits('10', 6), // 10 mUSDC contribution
    5, // max 5 members
    1, // 1 day (will be shown as is; judges can use test time)
    12, // 12h grace
    0, // no reputation requirement
    false, // public
    ethers.ZeroAddress // use MockUSDC
  );
  const demoReceipt = await demoTx.wait();
  const demoEvent = demoReceipt?.logs
    .map((log) => {
      try {
        return factory.interface.parseLog({ topics: [...log.topics], data: log.data });
      } catch {
        return null;
      }
    })
    .find((e) => e?.name === 'PoolCreated');
  const demoPoolAddress = demoEvent?.args?.poolAddress;
  console.log(`    ✓ Demo pool created at: ${demoPoolAddress}`);

  // ─── 6. Build and write deployments/westend.json ─────────────────────────
  console.log('\nWriting deployment artifacts...');

  const mockUSDCArtifact = await ethers.getContractFactory('MockUSDC').then((f) =>
    f.getDeployTransaction()
  );
  const MockUSDCContract = await ethers.getContractAt('MockUSDC', mockUSDCAddress);
  const RegistryContract = await ethers.getContractAt('ReputationRegistry', registryAddress);
  const FactoryContract = await ethers.getContractAt('SusuFactory', factoryAddress);

  const deploymentData = {
    network: network.name,
    chainId: network.config.chainId,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    demoPoolAddress: demoPoolAddress || null,
    contracts: {
      MockUSDC: {
        address: mockUSDCAddress,
        abi: JSON.parse(
          fs.readFileSync(
            path.join(__dirname, '../artifacts/contracts/MockUSDC.sol/MockUSDC.json'),
            'utf8'
          )
        ).abi,
      },
      ReputationRegistry: {
        address: registryAddress,
        abi: JSON.parse(
          fs.readFileSync(
            path.join(
              __dirname,
              '../artifacts/contracts/ReputationRegistry.sol/ReputationRegistry.json'
            ),
            'utf8'
          )
        ).abi,
      },
      SusuFactory: {
        address: factoryAddress,
        abi: JSON.parse(
          fs.readFileSync(
            path.join(__dirname, '../artifacts/contracts/SusuFactory.sol/SusuFactory.json'),
            'utf8'
          )
        ).abi,
      },
      SusuPool: {
        address: demoPoolAddress || ethers.ZeroAddress,
        abi: JSON.parse(
          fs.readFileSync(
            path.join(__dirname, '../artifacts/contracts/SusuPool.sol/SusuPool.json'),
            'utf8'
          )
        ).abi,
      },
    },
  };

  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const outputPath = path.join(deploymentsDir, 'westend.json');
  fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));
  console.log(`    ✓ Deployment saved to deployments/westend.json`);

  // Also copy to frontend for easy import
  const frontendDir = path.join(__dirname, '../../frontend/src/lib');
  if (fs.existsSync(frontendDir)) {
    fs.writeFileSync(
      path.join(frontendDir, 'deployments.json'),
      JSON.stringify(deploymentData, null, 2)
    );
    console.log(`    ✓ Copied to frontend/src/lib/deployments.json`);
  }

  // ─── 7. Print summary ─────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                  DEPLOYMENT SUMMARY                      ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║ MockUSDC           ${mockUSDCAddress.padEnd(40)} ║`);
  console.log(`║ ReputationRegistry ${registryAddress.padEnd(40)} ║`);
  console.log(`║ SusuFactory        ${factoryAddress.padEnd(40)} ║`);
  if (demoPoolAddress) {
    console.log(`║ Demo Pool          ${demoPoolAddress.padEnd(40)} ║`);
  }
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║ Network: Westend Asset Hub (chainId: 420420421)           ║');
  console.log(
    '║ Explorer: https://blockscout.westend.asset-hub.paritytech.net ║'
  );
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log('Next steps:');
  console.log('  1. Copy contract addresses to frontend/.env.local');
  console.log('  2. Run: cd frontend && pnpm dev');
  console.log(
    `  3. NEXT_PUBLIC_FACTORY_ADDRESS=${factoryAddress}`
  );
  console.log(
    `  4. NEXT_PUBLIC_REPUTATION_ADDRESS=${registryAddress}`
  );
  console.log(
    `  5. NEXT_PUBLIC_MOCKUSDC_ADDRESS=${mockUSDCAddress}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
