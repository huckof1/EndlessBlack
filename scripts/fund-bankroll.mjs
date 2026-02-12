#!/usr/bin/env node
/**
 * Fund bankroll directly using the owner's private key.
 * Usage: node scripts/fund-bankroll.mjs [amount_in_eds]
 * Default: 10 EDS
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Endless, EndlessConfig, Network, Account, Ed25519PrivateKey } = require('@endlesslab/endless-ts-sdk');

const PRIVATE_KEY = '0x0191361921e001ccdaef5362b50f53aef8dbf7ac029f07ad1ceab599241b2ea3';
const CONTRACT_ADDRESS = '0x1329ceb3251b7593e20755b5ac2a4ee848ef1430c71d18b8bddff6510d81a792';
const MODULE_NAME = 'blackjack';

async function main() {
  const edsAmount = parseFloat(process.argv[2] || '10');
  const octas = BigInt(Math.floor(edsAmount * 100000000));

  console.log(`Funding bankroll with ${edsAmount} EDS (${octas} octas)...`);

  const config = new EndlessConfig({ network: Network.TESTNET });
  const endless = new Endless(config);

  const privateKey = new Ed25519PrivateKey(PRIVATE_KEY);
  const account = Account.fromPrivateKey({ privateKey });

  console.log('Owner address:', account.accountAddress.toString());

  // Check current balance
  try {
    const balance = await endless.getAccountEDSAmount({ accountAddress: account.accountAddress });
    console.log('Owner balance:', Number(balance) / 1e8, 'EDS');
  } catch (e) {
    console.warn('Could not fetch balance:', e.message);
  }

  // Check current bankroll
  try {
    const bankroll = await endless.view({
      payload: {
        function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_bankroll_balance`,
        typeArguments: [],
        functionArguments: [],
      },
    });
    console.log('Current bankroll:', Number(bankroll[0]) / 1e8, 'EDS');
  } catch (e) {
    console.warn('Could not fetch bankroll:', e.message);
  }

  // Build transaction
  const transaction = await endless.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::fund_bankroll`,
      typeArguments: [],
      functionArguments: [octas],
    },
  });

  console.log('\nSubmitting transaction...');
  const pendingTx = await endless.signAndSubmitTransaction({
    signer: account,
    transaction,
  });

  console.log('TX hash:', pendingTx.hash);
  console.log('Waiting for confirmation...');

  const result = await endless.waitForTransaction({ transactionHash: pendingTx.hash });
  console.log('Success:', result.success);

  if (!result.success) {
    console.log('VM status:', result.vm_status);
    return;
  }

  // Check new bankroll
  try {
    const bankroll = await endless.view({
      payload: {
        function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_bankroll_balance`,
        typeArguments: [],
        functionArguments: [],
      },
    });
    console.log('\nNew bankroll:', Number(bankroll[0]) / 1e8, 'EDS');
  } catch (e) {
    console.warn('Could not fetch bankroll:', e.message);
  }

  console.log('\nDone!');
}

main().catch(console.error);
