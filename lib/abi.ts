import launchpadArtifact from "@/contracts/out/ShiftLaunchpad.json";
import tokenArtifact from "@/contracts/out/ShiftToken.json";

export const launchpadAbi = launchpadArtifact.abi;
export const tokenAbi = tokenArtifact.abi;
export const tokenBytecode = tokenArtifact.bytecode as `0x${string}`;
