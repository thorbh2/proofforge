"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useWallet } from "./WalletProvider";
import {
  hasContract, getPublicStats, getRecentMissions, getOpenChallenges, getOpenAppeals,
  writeMethod, waitAccepted,
} from "@/lib/proofforge";
import type { Mission, Challenge, Appeal, PublicStats } from "@/lib/types";

interface Toast { id: number; kind: "ok" | "error"; msg: string }
interface Ctx {
  configured: boolean;
  stats: PublicStats | null;
  missions: Mission[] | null;
  openChallenges: Challenge[] | null;
  openAppeals: Appeal[] | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  toasts: Toast[];
  dismiss: (id: number) => void;
  run: (fn: string, args: unknown[], okMsg: string) => Promise<boolean>;
  pending: string | null;
}
const C = createContext<Ctx | null>(null);
export function useData(): Ctx {
  const c = useContext(C);
  if (!c) throw new Error("useData outside provider");
  return c;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { wallet, connect, wrongNetwork } = useWallet();
  const configured = hasContract();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [missions, setMissions] = useState<Mission[] | null>(null);
  const [openChallenges, setOpenCh] = useState<Challenge[] | null>(null);
  const [openAppeals, setOpenAp] = useState<Appeal[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const tid = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const notify = useCallback((kind: Toast["kind"], msg: string) => {
    const id = ++tid.current;
    setToasts((t) => [...t, { id, kind, msg }]);
    setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);

  const refresh = useCallback(async () => {
    if (!configured) { setLoading(false); return; }
    try {
      const [s, m, c, a] = await Promise.all([getPublicStats(), getRecentMissions(40), getOpenChallenges(50), getOpenAppeals(50)]);
      setStats(s); setMissions(m); setOpenCh(c); setOpenAp(a); setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read protocol state.");
    } finally { setLoading(false); }
  }, [configured]);

  useEffect(() => { void refresh(); }, [refresh]);

  const run = useCallback(async (fn: string, args: unknown[], okMsg: string): Promise<boolean> => {
    if (!wallet) { await connect(); return false; }
    if (wrongNetwork) { notify("error", "Switch your wallet to Studionet (chain 61999)."); return false; }
    setPending(fn);
    try {
      const hash = await writeMethod(wallet.address, fn, args);
      notify("ok", `${okMsg} - tx sent`);
      await waitAccepted(wallet.address, hash);
      await refresh();
      notify("ok", `${okMsg} - confirmed`);
      return true;
    } catch (e) {
      const m = e instanceof Error ? e.message : "Transaction failed.";
      notify("error", /reject|denied/i.test(m) ? "Transaction rejected in wallet." : m.slice(0, 140));
      return false;
    } finally { setPending(null); }
  }, [wallet, wrongNetwork, connect, notify, refresh]);

  return (
    <C.Provider value={{ configured, stats, missions, openChallenges, openAppeals, loading, error, refresh, toasts, dismiss, run, pending }}>
      {children}
    </C.Provider>
  );
}
