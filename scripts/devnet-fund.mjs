// Airdrop devnet SOL to the launchpad wallet and a local test wallet.
import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";
import fs from "node:fs";

const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => l.split("=")));
const conn = new Connection(env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com", "confirmed");
const launchpad = Keypair.fromSecretKey(bs58.decode(env.LAUNCHPAD_SECRET_KEY));
let tester;
if (fs.existsSync(".data/test-wallet.json")) tester = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(".data/test-wallet.json", "utf8"))));
else { tester = Keypair.generate(); fs.mkdirSync(".data", { recursive: true }); fs.writeFileSync(".data/test-wallet.json", JSON.stringify([...tester.secretKey])); }

async function fund(kp, label, want) {
  let bal = (await conn.getBalance(kp.publicKey)) / LAMPORTS_PER_SOL;
  console.log(`${label} ${kp.publicKey.toBase58()} balance ${bal} SOL`);
  for (let i = 0; i < 4 && bal < want; i++) {
    try {
      const sig = await conn.requestAirdrop(kp.publicKey, 2 * LAMPORTS_PER_SOL);
      await conn.confirmTransaction(sig, "confirmed");
      bal = (await conn.getBalance(kp.publicKey)) / LAMPORTS_PER_SOL;
      console.log(`  airdrop ok → ${bal} SOL`);
    } catch (e) {
      console.log(`  airdrop failed: ${String(e.message).slice(0, 120)}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}
await fund(launchpad, "launchpad", 2);
await fund(tester, "tester   ", 2);
