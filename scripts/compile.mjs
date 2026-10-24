// Compiles contracts/*.sol with solc-js into contracts/out/<Name>.json ({ abi, bytecode }).
import solc from "solc";
import fs from "node:fs";
import path from "node:path";

const dir = "contracts";
const sources = Object.fromEntries(fs.readdirSync(dir).filter((f) => f.endsWith(".sol")).map((f) => [f, { content: fs.readFileSync(path.join(dir, f), "utf8") }]));
const input = { language: "Solidity", sources, settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "cancun", outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } } };
const out = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = (out.errors ?? []).filter((e) => e.severity === "error");
for (const e of out.errors ?? []) console.error(e.formattedMessage);
if (errors.length) process.exit(1);
fs.mkdirSync(path.join(dir, "out"), { recursive: true });
for (const [file, contracts] of Object.entries(out.contracts)) {
  for (const [name, c] of Object.entries(contracts)) {
    fs.writeFileSync(path.join(dir, "out", `${name}.json`), JSON.stringify({ abi: c.abi, bytecode: "0x" + c.evm.bytecode.object }, null, 1));
    console.log(`${file} → ${name}: ${c.evm.bytecode.object.length / 2} bytes`);
  }
}
