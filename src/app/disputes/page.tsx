"use client";

import { useState } from "react";
import Link from "next/link";
import { useData } from "@/components/DataProvider";
import { useWallet } from "@/components/WalletProvider";
import { ListInput } from "@/components/ListInput";
import { Icon, Spinner, Banner, StatusChip, Hex, Empty, Skeleton } from "@/components/ui";
import { getSubmission } from "@/lib/proofforge";
import { isHttpUrl } from "@/lib/format";

export default function DisputesPage() {
  const { configured, openChallenges, openAppeals, loading, run, pending } = useData();
  const { wallet, connect } = useWallet();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Disputes</h1>
        <p className="text-sm text-muted">Open a challenge against a review, or appeal an outcome. The protocol re-evaluates evidence under consensus.</p>
      </div>

      {!configured ? <Banner tone="error" icon="warn" title="No contract configured">Set the contract address in .env.local.</Banner> : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Challenges */}
          <section className="space-y-4">
            <div className="panel overflow-hidden">
              <div className="border-b border-line px-4 py-3"><h2 className="text-sm font-bold text-ink">Open challenges</h2></div>
              {loading || !openChallenges ? <Skeleton rows={2} /> : openChallenges.length === 0 ? (
                <Empty icon="gavel" title="No open challenges" hint="Challenges awaiting resolution will appear here." />
              ) : (
                <ul className="divide-y divide-line">
                  {openChallenges.map((c) => (
                    <li key={c.challengeId} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="mono text-xs text-muted">challenge #{c.challengeId} · sub #{c.submissionId}</span>
                        <StatusChip status={c.status} />
                      </div>
                      <p className="mt-1 text-sm text-ink">{c.reason}</p>
                      <div className="mt-1 text-[0.625rem] text-muted">by <Hex value={c.challenger} lead={5} tail={4} /> · {c.evidenceUrls.length} evidence url(s)</div>
                      <button onClick={() => run("resolve_challenge", [c.challengeId], "Challenge resolved")} disabled={pending === "resolve_challenge"} className="btn btn-blue btn-xs mt-2 w-full">
                        {pending === "resolve_challenge" ? <Spinner className="h-3.5 w-3.5" /> : <Icon name="scale" className="h-3.5 w-3.5" />} Resolve (consensus)
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <FileForm kind="challenge" run={run} pending={pending} wallet={!!wallet} connect={connect} />
          </section>

          {/* Appeals */}
          <section className="space-y-4">
            <div className="panel overflow-hidden">
              <div className="border-b border-line px-4 py-3"><h2 className="text-sm font-bold text-ink">Open appeals</h2></div>
              {loading || !openAppeals ? <Skeleton rows={2} /> : openAppeals.length === 0 ? (
                <Empty icon="scale" title="No open appeals" hint="Appeals awaiting resolution will appear here." />
              ) : (
                <ul className="divide-y divide-line">
                  {openAppeals.map((a) => (
                    <li key={a.appealId} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="mono text-xs text-muted">appeal #{a.appealId} · sub #{a.submissionId}</span>
                        <StatusChip status={a.status} />
                      </div>
                      <p className="mt-1 text-sm text-ink">{a.reason}</p>
                      <div className="mt-1 text-[0.625rem] text-muted">by <Hex value={a.appellant} lead={5} tail={4} /> · {a.evidenceUrls.length} evidence url(s)</div>
                      <button onClick={() => run("resolve_appeal", [a.appealId], "Appeal resolved")} disabled={pending === "resolve_appeal"} className="btn btn-blue btn-xs mt-2 w-full">
                        {pending === "resolve_appeal" ? <Spinner className="h-3.5 w-3.5" /> : <Icon name="scale" className="h-3.5 w-3.5" />} Resolve (consensus)
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <FileForm kind="appeal" run={run} pending={pending} wallet={!!wallet} connect={connect} />
          </section>
        </div>
      )}
    </div>
  );
}

function FileForm({ kind, run, pending, wallet, connect }: { kind: "challenge" | "appeal"; run: (fn: string, args: unknown[], msg: string) => Promise<boolean>; pending: string | null; wallet: boolean; connect: () => void }) {
  const [subId, setSubId] = useState("");
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState<string[]>([""]);
  const [missionId, setMissionId] = useState<string | null>(null);
  const [lookupErr, setLookupErr] = useState<string | null>(null);
  const fn = kind === "challenge" ? "challenge_submission" : "file_appeal";
  const cleanEv = evidence.map((e) => e.trim()).filter(Boolean);
  const evValid = cleanEv.every(isHttpUrl) && new Set(cleanEv).size === cleanEv.length;
  const valid = missionId !== null && reason.trim() !== "" && evValid;

  const lookup = async (v: string) => {
    setMissionId(null); setLookupErr(null);
    if (!v.trim()) return;
    const s = await getSubmission(v.trim());
    if (!s) setLookupErr("No submission with that id.");
    else setMissionId(s.missionId);
  };

  const submit = async () => {
    if (missionId === null) return;
    const ok = await run(fn, [missionId, subId.trim(), reason.trim(), cleanEv], kind === "challenge" ? "Challenge filed" : "Appeal filed");
    if (ok) { setSubId(""); setReason(""); setEvidence([""]); setMissionId(null); }
  };

  return (
    <div className="panel p-4">
      <h2 className="text-sm font-bold text-ink">File {kind === "challenge" ? "a challenge" : "an appeal"}</h2>
      <p className="mb-2.5 mt-0.5 text-xs text-muted">{kind === "challenge" ? "Dispute a reviewed submission with new evidence." : "Request re-evaluation of a rejected, revision-requested or challenged submission."}</p>
      <div className="space-y-2.5">
        <div>
          <label className="label mb-1 block">Submission id</label>
          <input className="field" value={subId} onChange={(e) => { setSubId(e.target.value); }} onBlur={(e) => lookup(e.target.value)} placeholder="e.g. 0" />
          {missionId !== null && <p className="mt-0.5 text-[0.625rem] text-forge">Found · mission #{missionId}</p>}
          {lookupErr && <p className="mt-0.5 text-[0.625rem] text-danger">{lookupErr}</p>}
        </div>
        <div><label className="label mb-1 block">Reason</label><textarea className="field min-h-[52px]" maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why should this be re-examined?" /></div>
        <div><label className="label mb-1 block">Evidence URLs</label><ListInput items={evidence} setItems={setEvidence} placeholder="https://evidence.example" min={1} max={6} url addLabel="evidence" /></div>
        {wallet ? (
          <button onClick={submit} disabled={!valid || pending === fn} className="btn btn-amber btn-xs w-full">
            {pending === fn ? <Spinner className="h-3.5 w-3.5" /> : <Icon name="plus" className="h-3.5 w-3.5" />} File {kind}
          </button>
        ) : (
          <button onClick={connect} className="btn btn-ghost btn-xs w-full">Connect wallet to file</button>
        )}
      </div>
    </div>
  );
}
