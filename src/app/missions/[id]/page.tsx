"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import { useData } from "@/components/DataProvider";
import { AuditTimeline } from "@/components/AuditTimeline";
import { Icon, Spinner, Banner, StatusChip, ScorePill, Hex, Empty, Skeleton } from "@/components/ui";
import { hasContract, getMission, getMissionSubmissions, getAuditTrail, getChallenge, getAppeal } from "@/lib/proofforge";
import { hostOf, explorerAddr, explorerContract } from "@/lib/format";
import { CONTRACT } from "@/lib/proofforge";
import type { Mission, Submission, AuditRecord, Challenge, Appeal } from "@/lib/types";

export default function MissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const configured = hasContract();
  const { wallet } = useWallet();
  const { run, pending, stats } = useData();
  const [m, setM] = useState<Mission | null | "missing">(null);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [audit, setAudit] = useState<AuditRecord[]>([]);
  const [disputes, setDisputes] = useState<{ ch: Challenge[]; ap: Appeal[] }>({ ch: [], ap: [] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!configured) { setLoading(false); return; }
    setLoading(true);
    try {
      const mission = await getMission(id);
      if (!mission) { setM("missing"); setLoading(false); return; }
      setM(mission);
      const [s, a] = await Promise.all([getMissionSubmissions(id), getAuditTrail(id)]);
      setSubs(s); setAudit(a);
      const chIds = s.flatMap((x) => x.challengeIds);
      const apIds = s.flatMap((x) => x.appealIds);
      const [ch, ap] = await Promise.all([
        Promise.all(chIds.map((c) => getChallenge(c))),
        Promise.all(apIds.map((p) => getAppeal(p))),
      ]);
      setDisputes({ ch: ch.filter(Boolean) as Challenge[], ap: ap.filter(Boolean) as Appeal[] });
    } finally { setLoading(false); }
  }, [configured, id]);

  useEffect(() => { void load(); }, [load, stats?.clock]);

  const isCreator = !!wallet && m && m !== "missing" && m.creator.toLowerCase() === wallet.address.toLowerCase();

  return (
    <div className="space-y-5">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink"><Icon name="external" className="h-3 w-3 rotate-180" /> Mission board</Link>

      {!configured ? <Banner tone="error" icon="warn" title="No contract configured">Set the contract address in .env.local.</Banner>
      : loading || m === null ? <div className="panel"><Skeleton rows={5} /></div>
      : m === "missing" ? <div className="panel"><Empty title={`Mission #${id} not found`} hint="It may not exist in the protocol yet." /></div>
      : (
        <>
          <div className="panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="mono text-xs text-muted">mission #{m.missionId}</span>
                <StatusChip status={m.status} />
                <span className="chip border-line bg-bg text-muted">{m.category}</span>
              </div>
              {isCreator && (
                <div className="flex gap-2">
                  {!["finalized", "archived", "draft"].includes(m.status) && (
                    <button onClick={() => run("finalize_mission", [m.missionId], "Mission finalized")} disabled={pending === "finalize_mission"} className="btn btn-primary btn-xs">
                      {pending === "finalize_mission" ? <Spinner className="h-3.5 w-3.5" /> : <Icon name="check" className="h-3.5 w-3.5" />} Finalize
                    </button>
                  )}
                  {m.status === "finalized" && (
                    <button onClick={() => run("archive_mission", [m.missionId], "Mission archived")} disabled={pending === "archive_mission"} className="btn btn-ghost btn-xs">Archive</button>
                  )}
                </div>
              )}
            </div>
            <h1 className="mt-2.5 text-xl font-bold tracking-tight text-ink">{m.title}</h1>
            <p className="mt-1 text-sm text-muted">{m.brief}</p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <span className="label">Acceptance criteria</span>
                <ul className="mt-1.5 space-y-1 text-sm text-ink">{m.acceptanceCriteria.map((c, i) => <li key={i} className="flex gap-1.5"><Icon name="check" className="mt-0.5 h-3.5 w-3.5 text-forge" /> {c}</li>)}</ul>
              </div>
              <div className="space-y-3">
                <div><span className="label">Required proof types</span><div className="mt-1 flex flex-wrap gap-1">{m.requiredProofTypes.map((p, i) => <span key={i} className="chip border-line bg-bg text-ink">{p}</span>)}</div></div>
                {m.referenceUrls.length > 0 && <div><span className="label">Reference URLs</span><ul className="mt-1 space-y-0.5 text-xs">{m.referenceUrls.map((u, i) => <li key={i}><a href={u} target="_blank" rel="noreferrer" className="text-blue hover:underline">{hostOf(u)}</a></li>)}</ul></div>}
                <div className="flex gap-4 text-xs text-muted">
                  <span>Pass ≥ <b className="mono text-ink">{m.minScoreToPass}</b></span>
                  <span>Max <b className="mono text-ink">{m.maxSubmissions}</b></span>
                  {m.selectedSubmissionId !== "" && <span>Selected <b className="mono text-forge">#{m.selectedSubmissionId}</b></span>}
                </div>
                <div className="text-xs text-muted">Creator <Hex value={m.creator} lead={6} tail={4} /></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
            {/* submissions + disputes */}
            <div className="space-y-5">
              <section className="panel overflow-hidden">
                <div className="border-b border-line px-4 py-3"><h2 className="text-sm font-bold text-ink">Submissions ({subs.length})</h2></div>
                {subs.length === 0 ? <Empty icon="clipboard" title="No submissions yet" /> : (
                  <ul className="divide-y divide-line">
                    {subs.map((s) => (
                      <li key={s.submissionId} className="px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="mono text-xs text-muted">#{s.submissionId}</span>
                            <StatusChip status={s.status} />
                            {s.verdict && <ScorePill score={s.score} pass={s.score >= m.minScoreToPass} />}
                          </div>
                          <Hex value={s.contributor} lead={5} tail={4} />
                        </div>
                        {s.proofSummary && <p className="mt-1.5 text-sm text-ink">{s.proofSummary}</p>}
                        <div className="mt-1 flex flex-wrap gap-2 text-xs">{s.proofUrls.map((u, i) => <a key={i} href={u} target="_blank" rel="noreferrer" className="text-blue hover:underline">{hostOf(u)}</a>)}</div>
                        {s.reviewSummary && <p className="mt-1.5 rounded-md bg-bg px-2.5 py-1.5 text-xs text-muted">{s.reviewSummary}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {(disputes.ch.length > 0 || disputes.ap.length > 0) && (
                <section className="panel p-4">
                  <h2 className="text-sm font-bold text-ink">Challenges &amp; appeals</h2>
                  <div className="mt-2 space-y-2">
                    {disputes.ch.map((c) => (
                      <div key={"c" + c.challengeId} className="rounded-md border border-line bg-bg px-3 py-2">
                        <div className="flex items-center justify-between"><span className="mono text-xs text-muted">challenge #{c.challengeId} · sub #{c.submissionId}</span><StatusChip status={c.status} /></div>
                        <p className="mt-0.5 text-xs text-ink">{c.reason}</p>
                      </div>
                    ))}
                    {disputes.ap.map((a) => (
                      <div key={"a" + a.appealId} className="rounded-md border border-line bg-bg px-3 py-2">
                        <div className="flex items-center justify-between"><span className="mono text-xs text-muted">appeal #{a.appealId} · sub #{a.submissionId}</span><StatusChip status={a.status} /></div>
                        <p className="mt-0.5 text-xs text-ink">{a.reason}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* audit trail */}
            <section className="panel p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-ink">Audit trail</h2>
                <a href={explorerContract(CONTRACT)} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue hover:underline">contract ↗</a>
              </div>
              <div className="mt-3">{audit.length === 0 ? <Empty title="No audit records" /> : <AuditTimeline records={audit} />}</div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
