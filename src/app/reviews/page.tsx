"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useData } from "@/components/DataProvider";
import { Icon, Spinner, Banner, StatusChip, ScorePill, Hex, Empty, Skeleton } from "@/components/ui";
import { getMissionSubmissions } from "@/lib/proofforge";
import { hostOf } from "@/lib/format";
import type { Submission } from "@/lib/types";

export default function ReviewsPage() {
  const { configured, missions, loading, run, pending, stats } = useData();
  const [subs, setSubs] = useState<Submission[] | null>(null);
  const [tab, setTab] = useState<"pending" | "reviewed">("pending");

  useEffect(() => {
    if (!configured || !missions) return;
    let cancelled = false;
    Promise.all(missions.map((m) => getMissionSubmissions(m.missionId)))
      .then((lists) => { if (!cancelled) setSubs(lists.flat()); })
      .catch(() => { if (!cancelled) setSubs([]); });
    return () => { cancelled = true; };
  }, [configured, missions, stats?.submissions, stats?.clock]);

  const missionTitle = (id: string) => missions?.find((m) => m.missionId === id)?.title ?? `Mission #${id}`;
  const pendingSubs = useMemo(() => (subs ?? []).filter((s) => s.status === "submitted" || s.status === "revision_requested" && s.verdict === ""), [subs]);
  const reviewed = useMemo(() => (subs ?? []).filter((s) => s.verdict !== ""), [subs]);
  const list = tab === "pending" ? pendingSubs : reviewed;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Review queue</h1>
          <p className="text-sm text-muted">Run the GenLayer reviewer over submitted work, or inspect finalized review results.</p>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setTab("pending")} className={`chip ${tab === "pending" ? "border-forge bg-forge text-white" : "border-line bg-surface text-ink"}`}>Awaiting review {subs && <span className="mono opacity-70">{pendingSubs.length}</span>}</button>
          <button onClick={() => setTab("reviewed")} className={`chip ${tab === "reviewed" ? "border-forge bg-forge text-white" : "border-line bg-surface text-ink"}`}>Reviewed {subs && <span className="mono opacity-70">{reviewed.length}</span>}</button>
        </div>
      </div>

      {!configured ? <Banner tone="error" icon="warn" title="No contract configured">Set the contract address in .env.local.</Banner>
      : loading || subs === null ? <div className="panel"><Skeleton rows={4} /></div>
      : list.length === 0 ? (
        <div className="panel"><Empty icon="clipboard" title={tab === "pending" ? "Review queue is empty" : "No reviews yet"} hint={tab === "pending" ? "Submissions awaiting review will appear here." : "Reviewed submissions will appear here once the reviewer runs."} /></div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {list.map((s) => (
            <div key={s.submissionId} className="panel p-4 animate-fadeUp">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="mono text-xs text-muted">sub #{s.submissionId}</span>
                  <StatusChip status={s.status} />
                </div>
                {s.verdict ? <ScorePill score={s.score} /> : <span className="text-xs text-muted">unscored</span>}
              </div>
              <Link href={`/missions/${s.missionId}`} className="mt-1.5 block text-sm font-semibold text-ink hover:text-forge">{missionTitle(s.missionId)}</Link>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted"><Icon name="link" className="h-3 w-3" /> {s.proofUrls.map(hostOf).join(", ")}</div>
              {s.proofSummary && <p className="mt-2 line-clamp-2 text-xs text-muted">{s.proofSummary}</p>}

              {s.verdict ? (
                <div className="mt-3 border-t border-line pt-3">
                  <p className="text-sm text-ink">{s.reviewSummary}</p>
                  {s.strengths.length > 0 && <Pills label="Strengths" items={s.strengths} tone="forge" />}
                  {s.weaknesses.length > 0 && <Pills label="Weaknesses" items={s.weaknesses} tone="amber" />}
                  {s.riskFlags.length > 0 && <Pills label="Risk flags" items={s.riskFlags} tone="danger" />}
                </div>
              ) : (
                <div className="mt-3 border-t border-line pt-3">
                  <button onClick={() => run("review_submission", [s.missionId, s.submissionId], "Review")} disabled={pending === "review_submission"} className="btn btn-primary btn-xs w-full">
                    {pending === "review_submission" ? <Spinner className="h-3.5 w-3.5" /> : <Icon name="scale" className="h-3.5 w-3.5" />}
                    {pending === "review_submission" ? "Reviewing (web + LLM, ~60-120s)…" : "Run review"}
                  </button>
                  <p className="mt-1.5 text-center text-[0.625rem] text-muted">Reviewer fetches proof + reference URLs and decides under validator consensus.</p>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between text-[0.625rem] text-muted">
                <span>by <Hex value={s.contributor} lead={5} tail={4} /></span>
                <Link href={`/missions/${s.missionId}`} className="font-semibold text-blue hover:underline">mission →</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Pills({ label, items, tone }: { label: string; items: string[]; tone: "forge" | "amber" | "danger" }) {
  const c = tone === "forge" ? "#245C4A" : tone === "amber" ? "#9a5a05" : "#B91C1C";
  return (
    <div className="mt-2">
      <span className="label">{label}</span>
      <div className="mt-1 flex flex-wrap gap-1">
        {items.map((it, i) => <span key={i} className="chip" style={{ color: c, borderColor: `${c}40`, backgroundColor: `${c}10` }}>{it}</span>)}
      </div>
    </div>
  );
}
