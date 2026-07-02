"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ProofForgeLogo } from "./ProofForgeLogo";
import { useWallet } from "./WalletProvider";
import { useData } from "./DataProvider";
import { Icon, Spinner } from "./ui";
import { truncateHex } from "@/lib/format";
import { NETWORK, CHAIN_ID } from "@/lib/proofforge";

const NAV = [
  { href: "/", label: "Board" },
  { href: "/reviews", label: "Reviews" },
  { href: "/disputes", label: "Disputes" },
  { href: "/profiles", label: "Reputation" },
];

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { wallet, connect, connecting, wrongNetwork, hasWallet } = useWallet();
  const { toasts, dismiss } = useData();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6">
          <Link href="/" className="shrink-0"><ProofForgeLogo /></Link>
          <span className="hidden text-xs text-muted sm:inline">Deliverable verification protocol</span>
          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {NAV.map((n) => {
              const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
              return (
                <Link key={n.href} href={n.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${active ? "bg-forgeSoft text-forge" : "text-muted hover:bg-surface hover:text-ink"}`}>
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <span className="hidden items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1 text-xs font-medium text-forge lg:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-forge" /> {NETWORK} · {CHAIN_ID}
            </span>
            {!hasWallet ? (
              <span className="chip border-line bg-surface text-muted">no wallet</span>
            ) : wallet ? (
              <span className={`chip ${wrongNetwork ? "border-amber/50 bg-amber/10 text-[#9a5a05]" : "border-forge/40 bg-forge/10 text-forge"}`}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: wrongNetwork ? "#D97706" : "#245C4A" }} />
                <span className="mono">{truncateHex(wallet.address, 5, 4)}</span>
              </span>
            ) : (
              <button onClick={connect} disabled={connecting} className="btn btn-primary btn-xs">
                {connecting ? <Spinner className="h-3.5 w-3.5" /> : <Icon name="hammer" className="h-3.5 w-3.5" />} Connect
              </button>
            )}
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-line px-3 py-2 md:hidden">
          {NAV.map((n) => {
            const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${active ? "bg-forgeSoft text-forge" : "text-muted"}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">{children}</main>

      <footer className="mx-auto max-w-7xl px-4 pb-10 pt-2 text-xs text-muted md:px-6">
        ProofForge runs on GenLayer Studionet. Reviews, challenges and appeals are decided by
        validator consensus over live web evidence - informational, not legal or financial advice.
      </footer>

      <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={`pointer-events-auto flex animate-fadeUp items-start gap-2 rounded-md border bg-surface px-3 py-2.5 text-sm shadow-pop ${t.kind === "ok" ? "border-forge/40 text-forge" : "border-danger/40 text-danger"}`}>
            <Icon name={t.kind === "ok" ? "check" : "x"} className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1 text-ink/80">{t.msg}</span>
            <button onClick={() => dismiss(t.id)} className="text-muted hover:text-ink"><Icon name="x" className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
