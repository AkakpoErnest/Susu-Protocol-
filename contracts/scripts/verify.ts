import { run } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const deploymentsPath = path.join(__dirname, '../deployments/westend.json');

  if (!fs.existsSync(deploymentsPath)) {
    throw new Error(
      'deployments/westend.json not found. Run deploy:westend first.'
    );
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
  const { contracts } = deployments;

  console.log('Verifying contracts on Blockscout...\n');

  // Verify MockUSDC
  try {
    console.log(`Verifying MockUSDC at ${contracts.MockUSDC.address}...`);
    await run('verify:verify', {
      address: contracts.MockUSDC.address,
      constructorArguments: [],
    });
    console.log('✓ MockUSDC verified');
  } catch (e: any) {
    if (e.message.includes('Already Verified')) {
      console.log('✓ MockUSDC already verified');
    } else {
      console.error('✗ MockUSDC verification failed:', e.message);
    }
  }

  // Verify ReputationRegistry
  try {
    console.log(`\nVerifying ReputationRegistry at ${contracts.ReputationRegistry.address}...`);
    await run('verify:verify', {
      address: contracts.ReputationRegistry.address,
      constructorArguments: [],
    });
    console.log('✓ ReputationRegistry verified');
  } catch (e: any) {
    if (e.message.includes('Already Verified')) {
      console.log('✓ ReputationRegistry already verified');
    } else {
      console.error('✗ ReputationRegistry verification failed:', e.message);
    }
  }

  // Verify SusuFactory
  try {
    console.log(`\nVerifying SusuFactory at ${contracts.SusuFactory.address}...`);
    await run('verify:verify', {
      address: contracts.SusuFactory.address,
      constructorArguments: [
        contracts.ReputationRegistry.address,
        contracts.MockUSDC.address,
      ],
    });
    console.log('✓ SusuFactory verified');
  } catch (e: any) {
    if (e.message.includes('Already Verified')) {
      console.log('✓ SusuFactory already verified');
    } else {
      console.error('✗ SusuFactory verification failed:', e.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
