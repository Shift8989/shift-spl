"use client";

import { createContext, useContext } from "react";

export const ClusterContext = createContext<"devnet" | "mainnet-beta">("devnet");
export const useCluster = () => useContext(ClusterContext);
