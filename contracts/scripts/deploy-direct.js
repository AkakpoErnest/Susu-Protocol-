const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const RPC_URL = process.env.WESTEND_RPC_URL || 'https://westend-asset-hub-eth-rpc.polkadot.io';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const GAS_LIMIT = 10_000_000n;
const GAS_PRICE = 1_500_000_000_000n; // 1500 gwei (above 1000 gwei base fee on Passet Hub)
const TX_OVERRIDES = { gasLimit: GAS_LIMIT, gasPrice: GAS_PRICE, type: 0 };

async function deployContract(wallet, artifactPath, constructorArgs = []) {
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const deployTx = await factory.getDeployTransaction(...constructorArgs);
  const tx = await wallet.sendTransaction({
    data: deployTx.data,
    ...TX_OVERRIDES,
  });
  const receipt = await tx.wait();
  if (!receipt?.contractAddress) throw new Error('Deploy failed — no contract address in receipt');
  return receipt.contractAddress;
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const network = await provider.getNetwork();
  const balance = await provider.getBalance(wallet.address);

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║           SUSU PROTOCOL — DEPLOYMENT SCRIPT              ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  console.log(`Network:      westend (chainId: ${network.chainId})`);
  console.log(`Deployer:     ${wallet.address}`);
  console.log(`Balance:      ${ethers.formatEther(balance)} WND\n`);

  if (balance === 0n) throw new Error('Deployer has no balance.');

  const artifactsBase = path.join(__dirname, '../artifacts/contracts');

  console.log('1/4 Deploying MockUSDC...');
  const mockUSDCAddress = await deployContract(wallet, path.join(artifactsBase, 'MockUSDC.sol/MockUSDC.json'));
  console.log(`    ✓ MockUSDC deployed at: ${mockUSDCAddress}`);

  console.log('2/4 Deploying ReputationRegistry...');
  const registryAddress = await deployContract(wallet, path.join(artifactsBase, 'ReputationRegistry.sol/ReputationRegistry.json'));
  console.log(`    ✓ ReputationRegistry deployed at: ${registryAddress}`);

  console.log('3/4 Deploying SusuFactory...');
  const factoryAddress = await deployContract(wallet, path.join(artifactsBase, 'SusuFactory.sol/SusuFactory.json'), [registryAddress, mockUSDCAddress]);
  console.log(`    ✓ SusuFactory deployed at: ${factoryAddress}`);

  console.log('4/4 Configuring contracts...');
  const registryArtifact = JSON.parse(fs.readFileSync(path.join(artifactsBase, 'ReputationRegistry.sol/ReputationRegistry.json'), 'utf8'));
  const registry = new ethers.Contract(registryAddress, registryArtifact.abi, wallet);
  const setFactoryData = registry.interface.encodeFunctionData('setFactory', [factoryAddress]);
  const wireTx = await wallet.sendTransaction({ to: registryAddress, data: setFactoryData, gasLimit: GAS_LIMIT, gasPrice: GAS_PRICE });
  await wireTx.wait();
  console.log(`    ✓ ReputationRegistry.setFactory(${factoryAddress})`);

  console.log('\nCreating demo pool...');
  const factoryArtifact = JSON.parse(fs.readFileSync(path.join(artifactsBase, 'SusuFactory.sol/SusuFactory.json'), 'utf8'));
  const factoryContract = new ethers.Contract(factoryAddress, factoryArtifact.abi, wallet);
  const createPoolData = factoryContract.interface.encodeFunctionData('createPool', [
    'Demo Susu Circle',
    'A demo pool for testnet judges. Join, contribute, and see your payout!',
    ethers.parseUnits('10', 6),
    5, 1, 12, 0, false, ethers.ZeroAddress,
  ]);
  const demoTx = await wallet.sendTransaction({ to: factoryAddress, data: createPoolData, gasLimit: GAS_LIMIT, gasPrice: GAS_PRICE });
  const demoReceipt = await demoTx.wait();
  const demoEvent = demoReceipt?.logs.map(log => { try { return factoryContract.interface.parseLog({ topics: [...log.topics], data: log.data }); } catch { return null; } }).find(e => e?.name === 'PoolCreated');
  const demoPoolAddress = demoEvent?.args?.poolAddress || null;
  console.log(`    ✓ Demo pool created at: ${demoPoolAddress}`);

  console.log('\nWriting deployment artifacts...');
  const deploymentData = {
    network: 'westend',
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    deployer: wallet.address,
    demoPoolAddress,
    contracts: {
      MockUSDC: { address: mockUSDCAddress, abi: JSON.parse(fs.readFileSync(path.join(artifactsBase, 'MockUSDC.sol/MockUSDC.json'), 'utf8')).abi },
      ReputationRegistry: { address: registryAddress, abi: registryArtifact.abi },
      SusuFactory: { address: factoryAddress, abi: factoryArtifact.abi },
      SusuPool: { address: demoPoolAddress || ethers.ZeroAddress, abi: JSON.parse(fs.readFileSync(path.join(artifactsBase, 'SusuPool.sol/SusuPool.json'), 'utf8')).abi },
    },
  };

  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true });
  fs.writeFileSync(path.join(deploymentsDir, 'westend.json'), JSON.stringify(deploymentData, null, 2));
  console.log(`    ✓ Saved to deployments/westend.json`);

  const frontendDir = path.join(__dirname, '../../frontend/src/lib');
  if (fs.existsSync(frontendDir)) {
    fs.writeFileSync(path.join(frontendDir, 'deployments.json'), JSON.stringify(deploymentData, null, 2));
    console.log(`    ✓ Copied to frontend/src/lib/deployments.json`);
  }

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                  DEPLOYMENT SUMMARY                      ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║ MockUSDC           ${mockUSDCAddress.padEnd(40)} ║`);
  console.log(`║ ReputationRegistry ${registryAddress.padEnd(40)} ║`);
  console.log(`║ SusuFactory        ${factoryAddress.padEnd(40)} ║`);
  if (demoPoolAddress) console.log(`║ Demo Pool          ${demoPoolAddress.padEnd(40)} ║`);
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║ Network: Westend Asset Hub (chainId: 420420421)           ║');
  console.log('║ Explorer: https://blockscout.westend.asset-hub.paritytech.net ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  console.log(`  NEXT_PUBLIC_FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`  NEXT_PUBLIC_REPUTATION_ADDRESS=${registryAddress}`);
  console.log(`  NEXT_PUBLIC_MOCKUSDC_ADDRESS=${mockUSDCAddress}`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
