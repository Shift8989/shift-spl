// Deploys ShiftLaunchpad. Usage: RPC=<url> KEY=<0x private key> node scripts/deploy.mjs
import { createPublicClient, createWalletClient, http, parseEther, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import fs from "node:fs";

const env = fs.existsSync(".env.local") ? Object.fromEntries(fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])) : {};
const RPC = process.env.RPC ?? env.NEXT_PUBLIC_RPC_URL ?? "https://rpc.mainnet.chain.robinhood.com";
const KEY = process.env.KEY ?? env.LAUNCHPAD_PRIVATE_KEY;
if (!KEY) throw new Error("KEY or LAUNCHPAD_PRIVATE_KEY required");
const account = privateKeyToAccount(KEY);
const pub = createPublicClient({ transport: http(RPC) });
const chainId = await pub.getChainId();
const chain = { id: chainId, name: `chain-${chainId}`, nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }, rpcUrls: { default: { http: [RPC] } } };
const wallet = createWalletClient({ account, chain, transport: http(RPC) });
const art = JSON.parse(fs.readFileSync("contracts/out/ShiftLaunchpad.json", "utf8"));
const bal = await pub.getBalance({ address: account.address });
console.log(`deployer ${account.address} on chain ${chainId}, balance ${formatEther(bal)} ETH`);
const params = { virtualEth: parseEther(process.env.VIRTUAL_ETH ?? "1.2"), virtualTokens: parseEther("1073000000"), feeBps: 100 };
const hash = await wallet.deployContract({ abi: art.abi, bytecode: art.bytecode, args: [account.address, account.address, account.address, params] });
const rcpt = await pub.waitForTransactionReceipt({ hash });
console.log(`ShiftLaunchpad deployed at ${rcpt.contractAddress} (tx ${hash}, gas ${rcpt.gasUsed})`);
if (process.env.WRITE_ENV !== "0" && fs.existsSync(".env.local")) {
  const lines = fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l && !l.startsWith("NEXT_PUBLIC_LAUNCHPAD_ADDRESS="));
  lines.push(`NEXT_PUBLIC_LAUNCHPAD_ADDRESS=${rcpt.contractAddress}`);
  fs.writeFileSync(".env.local", lines.join("\n") + "\n");
  console.log("written to .env.local");
}
