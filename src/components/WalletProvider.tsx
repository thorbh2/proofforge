"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { connectWallet, currentWallet, CHAIN_ID, type Wallet } from "@/lib/proofforge";

interface Ctx {
  wallet: Wallet | null; connecting: boolean; error: string | null;
  wrongNetwork: boolean; hasWallet: boolean; connect: () => Promise<void>;
}
const C = createContext<Ctx | null>(null);
export function useWallet(): Ctx {
  const c = useContext(C);
  if (!c) throw new Error("useWallet outside provider");
  return c;
}
export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasWallet, setHasWallet] = useState(false);

  useEffect(() => {
    const p = (window as any).ethereum;
    setHasWallet(!!p);
    void currentWallet().then((w) => w && setWallet(w));
    if (p?.on) {
      p.on("accountsChanged", () => void currentWallet().then(setWallet));
      p.on("chainChanged", () => void currentWallet().then(setWallet));
    }
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true); setError(null);
    try { setWallet(await connectWallet()); }
    catch (e) {
      const m = e instanceof Error ? e.message : "failed";
      setError(m === "no_wallet" ? "No browser wallet detected. Install MetaMask to act as creator/contributor/reviewer." : "Wallet connection rejected.");
    } finally { setConnecting(false); }
  }, []);

  return (
    <C.Provider value={{ wallet, connecting, error, wrongNetwork: !!wallet && wallet.chainId !== CHAIN_ID, hasWallet, connect }}>
      {children}
    </C.Provider>
  );
}
