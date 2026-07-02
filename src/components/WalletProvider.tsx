"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { RainbowKitProvider, getDefaultConfig, lightTheme, useConnectModal } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { defineChain } from "viem";
import { useAccount, useChainId, WagmiProvider } from "wagmi";
import { CHAIN_ID, type Wallet } from "@/lib/proofforge";

interface Ctx {
  wallet: Wallet | null;
  connecting: boolean;
  error: string | null;
  wrongNetwork: boolean;
  hasWallet: boolean;
  connect: () => Promise<void>;
}

const C = createContext<Ctx | null>(null);

const rpcUrl = process.env.NEXT_PUBLIC_GENLAYER_RPC || "https://studio.genlayer.com/api";
const explorerUrl = process.env.NEXT_PUBLIC_GENLAYER_EXPLORER || "https://explorer-studio.genlayer.com";
const walletConnectProjectId = (process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "proofforge-local-dev").trim();

const studionetChain = defineChain({
  id: CHAIN_ID,
  name: "GenLayer Studionet",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: {
    default: { http: [rpcUrl] },
    public: { http: [rpcUrl] },
  },
  blockExplorers: {
    default: { name: "GenLayer Studio Explorer", url: explorerUrl },
  },
  testnet: true,
});

const config = getDefaultConfig({
  appName: "ProofForge",
  projectId: walletConnectProjectId,
  chains: [studionetChain],
  ssr: true,
});

export function useWallet(): Ctx {
  const c = useContext(C);
  if (!c) throw new Error("useWallet outside provider");
  return c;
}

function WalletStateProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const activeChainId = useChainId();
  const { openConnectModal } = useConnectModal();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wallet = useMemo<Wallet | null>(() => {
    if (!isConnected || !address) return null;
    return { address: address as `0x${string}`, chainId: activeChainId };
  }, [activeChainId, address, isConnected]);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      if (!openConnectModal) {
        setError("Wallet connector unavailable.");
        return;
      }
      openConnectModal();
    } finally {
      setConnecting(false);
    }
  }, [openConnectModal]);

  return (
    <C.Provider value={{ wallet, connecting, error, wrongNetwork: !!wallet && wallet.chainId !== CHAIN_ID, hasWallet: true, connect }}>
      {children}
    </C.Provider>
  );
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={studionetChain}
          theme={lightTheme({
            accentColor: "#245C4A",
            accentColorForeground: "#FFFFFF",
            borderRadius: "small",
            overlayBlur: "small",
          })}
        >
          <WalletStateProvider>{children}</WalletStateProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
