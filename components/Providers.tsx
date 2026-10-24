"use client";

import { ClusterContext } from "./ClusterContext";
import { WalletProvider } from "./WalletProvider";

export function Providers({ cluster, children }: { cluster: "devnet" | "mainnet-beta"; children: React.ReactNode }) {
  return (
    <ClusterContext.Provider value={cluster}>
      <WalletProvider>{children}</WalletProvider>
    </ClusterContext.Provider>
  );
}
