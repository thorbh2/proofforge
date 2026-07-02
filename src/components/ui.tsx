"use client";

import { useState, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCopy, faCheck, faArrowUpRightFromSquare, faCircleNotch, faXmark, faCircleInfo,
  faTriangleExclamation, faClipboardCheck, faGavel, faScaleBalanced, faLink, faPlus, faHammer,
} from "@fortawesome/free-solid-svg-icons";
import { truncateHex, explorerAddr, explorerTx, explorerContract } from "@/lib/format";

export const ICONS = { copy: faCopy, check: faCheck, external: faArrowUpRightFromSquare, spinner: faCircleNotch, x: faXmark, info: faCircleInfo, warn: faTriangleExclamation, clipboard: faClipboardCheck, gavel: faGavel, scale: faScaleBalanced, link: faLink, plus: faPlus, hammer: faHammer };
export function Icon({ name, className }: { name: keyof typeof ICONS; className?: string }) {
  return <FontAwesomeIcon icon={ICONS[name]} className={className} />;
}
export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return <FontAwesomeIcon icon={faCircleNotch} className={`${className} animate-spin`} />;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "#667085", open: "#245C4A", reviewing: "#2563EB", challenged: "#D97706",
  appealed: "#D97706", finalized: "#245C4A", archived: "#667085",
  submitted: "#2563EB", accepted: "#245C4A", revision_requested: "#D97706",
  rejected: "#B91C1C", upheld: "#B91C1C", dismissed: "#245C4A", denied: "#B91C1C",
};
export function StatusChip({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? "#667085";
  return (
    <span className="chip" style={{ color: c, borderColor: `${c}55`, backgroundColor: `${c}14` }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c }} />
      {String(status).replace(/_/g, " ")}
    </span>
  );
}

export function ScorePill({ score, pass }: { score: number; pass?: boolean }) {
  const c = pass === false ? "#B91C1C" : score >= 60 ? "#245C4A" : score > 0 ? "#D97706" : "#667085";
  return <span className="mono text-sm font-bold" style={{ color: c }}>{score}</span>;
}

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" aria-label={label} title={done ? "Copied" : label}
      onClick={async () => { try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1100); } catch {} }}
      className="inline-flex h-6 w-6 items-center justify-center rounded text-muted transition-colors hover:bg-bg hover:text-ink">
      <FontAwesomeIcon icon={done ? faCheck : faCopy} className={`h-3 w-3 ${done ? "text-forge" : ""}`} />
    </button>
  );
}
export function Hex({ value, kind = "address", lead = 6, tail = 4 }: { value: string; kind?: "address" | "contract" | "tx"; lead?: number; tail?: number }) {
  if (!value) return <span className="text-muted">-</span>;
  const href = kind === "tx" ? explorerTx(value) : kind === "contract" ? explorerContract(value) : explorerAddr(value);
  return (
    <span className="inline-flex items-center gap-1">
      <span className="mono text-[0.8125rem] text-ink" title={value}>{truncateHex(value, lead, tail)}</span>
      <CopyButton value={value} label={`Copy ${kind}`} />
      <a href={href} target="_blank" rel="noreferrer" title="Explorer" className="inline-flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-bg hover:text-blue">
        <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-3 w-3" />
      </a>
    </span>
  );
}

export function Banner({ tone, icon, title, children }: { tone: "info" | "warn" | "error" | "ok"; icon?: keyof typeof ICONS; title: string; children?: ReactNode }) {
  const t = {
    info: "border-blue/30 bg-blue/[0.05] text-blue",
    warn: "border-amber/40 bg-amber/10 text-[#9a5a05]",
    error: "border-danger/40 bg-danger/[0.06] text-danger",
    ok: "border-forge/40 bg-forge/[0.07] text-forge",
  }[tone];
  return (
    <div className={`flex items-start gap-2.5 rounded-md border px-3.5 py-2.5 text-sm ${t}`}>
      {icon && <FontAwesomeIcon icon={ICONS[icon]} className="mt-0.5 h-4 w-4 shrink-0" />}
      <div><p className="font-semibold">{title}</p>{children && <div className="mt-0.5 text-[0.8125rem] opacity-90">{children}</div>}</div>
    </div>
  );
}
export function Empty({ title, hint, icon = "clipboard" }: { title: string; hint?: string; icon?: keyof typeof ICONS }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-md border border-line bg-bg text-muted"><Icon name={icon} className="h-4 w-4" /></span>
      <p className="text-sm font-medium text-ink">{title}</p>
      {hint && <p className="max-w-sm text-xs text-muted">{hint}</p>}
    </div>
  );
}
export function Skeleton({ rows = 3 }: { rows?: number }) {
  return <div className="space-y-2 p-4">{Array.from({ length: rows }).map((_, i) => <div key={i} className="h-11 animate-pulse rounded bg-bg" />)}</div>;
}
