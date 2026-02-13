#!/usr/bin/env node
/**
 * Deploy Blackjack Move contract to Endless Testnet
 *
 * Usage:
 * 1. First compile the contract with: aptos move compile --save-metadata --named-addresses pixel_blackjack=<ACCOUNT_ADDRESS>
 * 2. Then run: node scripts/deploy-contract.mjs
 *
 * This script reads the compiled bytecode and metadata from move/build/
 * and deploys using the Endless TypeScript SDK.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { Endless, EndlessConfig, Network, Account, Ed25519PrivateKey } = require('@endlesslab/endless-ts-sdk');

const PRIVATE_KEY = '0x0191361921e001ccdaef5362b50f53aef8dbf7ac029f07ad1ceab599241b2ea3';
const ACCOUNT_ADDRESS = '0x1329ceb3251b7593e20755b5ac2a4ee848ef1430c71d18b8bddff6510d81a792';

const BUILD_DIR = join(import.meta.dirname, '..', 'move', 'build', 'pixel_blackjack');

async function main() {
  const config = new EndlessConfig({ network: Network.TESTNET });
  const endless = new Endless(config);

  const privateKey = new Ed25519PrivateKey(PRIVATE_KEY);
  const account = Account.fromPrivateKey({ privateKey });

  console.log('Deployer address:', account.accountAddress.toString());

  // Read compiled metadata
  const metadataPath = join(BUILD_DIR, 'package-metadata.bcs');
  if (!existsSync(metadataPath)) {
    console.error('ERROR: Compiled metadata not found at', metadataPath);
    console.error('Please compile the contract first:');
    console.error('  cd move && aptos move compile --save-metadata --named-addresses pixel_blackjack=' + ACCOUNT_ADDRESS);
    process.exit(1);
  }

  const metadataBytes = readFileSync(metadataPath);
  console.log('Metadata size:', metadataBytes.length, 'bytes');

  // Read compiled bytecode modules
  const bytecodePath = join(BUILD_DIR, 'bytecode_modules');
  const modules = readdirSync(bytecodePath)
    .filter(f => f.endsWith('.mv'))
    .map(f => readFileSync(join(bytecodePath, f)));

  console.log('Modules:', modules.length);
  modules.forEach((m, i) => console.log(`  Module ${i}: ${m.length} bytes`));

  // Deploy
  console.log('\nDeploying contract...');
  const transaction = await endless.publishPackageTransaction({
    account: account.accountAddress,
    metadataBytes: metadataBytes,
    moduleBytecode: modules,
  });

  const pendingTx = await endless.signAndSubmitTransaction({
    signer: account,
    transaction,
  });

  console.log('TX hash:', pendingTx.hash);
  console.log('Waiting for confirmation...');

  const result = await endless.waitForTransaction({ transactionHash: pendingTx.hash });
  console.log('Success:', result.success);

  if (result.success) {
    console.log('\n=== CONTRACT DEPLOYED ===');
    console.log('Address:', ACCOUNT_ADDRESS);
    console.log('Module:', ACCOUNT_ADDRESS + '::blackjack');
    console.log('\nUpdate web/.env:');
    console.log('  VITE_CONTRACT_ADDRESS_TESTNET=' + ACCOUNT_ADDRESS);
  } else {
    console.log('FAILED:', result.vm_status);
  }
}

main().catch(console.error);
