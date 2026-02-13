// Generate an Endless testnet account for contract deployment
import { Endless, EndlessConfig, Network, Ed25519PrivateKey, Account } from "@endlesslab/endless-ts-sdk";

async function main() {
  const config = new EndlessConfig({ network: Network.TESTNET });
  const endless = new Endless(config);

  // Generate a new account
  const account = Account.generate();

  console.log("=== New Endless Testnet Account ===");
  console.log("Address:", account.accountAddress.toString());
  console.log("Private Key:", account.privateKey.toString());
  console.log("Public Key:", account.publicKey.toString());

  // Fund via faucet
  console.log("\nFunding account via faucet...");
  try {
    const tx = await endless.fundAccount({
      accountAddress: account.accountAddress,
      amount: 500_000_000, // 5 EDS
    });
    console.log("Funded! TX:", tx);
  } catch (e) {
    console.log("Faucet error:", e.message);
    console.log("You may need to fund manually.");
  }

  // Check balance
  try {
    const balance = await endless.getAccountEDSAmount({
      accountAddress: account.accountAddress,
    });
    console.log("Balance:", balance, "octas (", Number(balance) / 100_000_000, "EDS)");
  } catch (e) {
    console.log("Balance check error:", e.message);
  }

  console.log("\n=== Save these for deployment ===");
  console.log(`PRIVATE_KEY=${account.privateKey.toString()}`);
  console.log(`ACCOUNT_ADDRESS=${account.accountAddress.toString()}`);
}

main().catch(console.error);
