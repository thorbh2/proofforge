"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useWallet } from "@/components/WalletProvider";
import { useData } from "@/components/DataProvider";
import { ListInput } from "@/components/ListInput";
import { Icon, Spinner, Banner, StatusChip, ScorePill, Hex, Empty, Skeleton } from "@/components/ui";
import { CONTRACT, hasContract, getMissionSubmissions, getProfile } from "@/lib/proofforge";
import { isHttpUrl } from "@/lib/format";
import type { Mission, Submission, Profile } from "@/lib/types";

const CATEGORIES = ["Open Source Delivery", "Design Delivery", "Content Delivery", "Research Delivery", "Bug Bounty", "Other"];

export default function BoardPage() {
  const { configured, stats, missions, loading, error, run, pending } = useData();
  const { wallet, wrongNetwork, hasWallet, connect, connecting } = useWallet();

  const [selId, setSelId] = useState<string | null>(null);
  const [subs, setSubs] = useState<Submission[] | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // create form
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [criteria, setCriteria] = useState<string[]>(["", ""]);
  const [ptypes, setPtypes] = useState<string[]>(["repository URL"]);
  const [refs, setRefs] = useState<string[]>([""]);
  const [maxSub, setMaxSub] = useState(10);
  const [minScore, setMinScore] = useState(60);

  // submit-work form
  const [proofUrls, setProofUrls] = useState<string[]>(["", ""]);
  const [proofSummary, setProofSummary] = useState("");

  const selected = useMemo(() => missions?.find((m) => m.missionId === selId) ?? null, [missions, selId]);

  useEffect(() => {
    if (!selId) { setSubs(null); return; }
    setSubs(null);
    getMissionSubmissions(selId).then(setSubs).catch(() => setSubs([]));
  }, [selId, stats?.submissions]);

  useEffect(() => {
    if (wallet) getProfile(wallet.address).then(setProfile).catch(() => setProfile(null));
  }, [wallet, stats?.clock]);

  const cleanCriteria = criteria.map((c) => c.trim()).filter(Boolean);
  const cleanProof = proofUrls.map((u) => u.trim()).filter(Boolean);
  const refsValid = refs.map((u) => u.trim()).filter(Boolean).every(isHttpUrl);
  const createValid = title.trim() && brief.trim() && cleanCriteria.length >= 1 && refsValid;
  const proofValid = cleanProof.length >= 1 && cleanProof.length <= 6 && cleanProof.every(isHttpUrl) && new Set(cleanProof).size === cleanProof.length;

  const onCreate = async () => {
    const ok = await run("create_mission", [title.trim(), brief.trim(), category, cleanCriteria, ptypes.map((p) => p.trim()).filter(Boolean), refs.map((u) => u.trim()).filter(Boolean), Number(maxSub), Number(minScore)], "Mission created");
    if (ok) { setTitle(""); setBrief(""); setCriteria(["", ""]); setRefs([""]); setPtypes(["repository URL"]); }
  };
  const onSubmitWork = async () => {
    if (!selected) return;
    const ok = await run("submit_work", [selected.missionId, cleanProof, proofSummary.trim()], "Work submitted");
    if (ok) { setProofUrls(["", ""]); setProofSummary(""); }
  };

  const isCreator = !!wallet && !!selected && selected.creator.toLowerCase() === wallet.address.toLowerCase();

  return (
    <div className="space-y-5">
      {/* header strip */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Mission board</h1>
          <p className="text-sm text-muted">Publish a mission, submit proof of work, and let the protocol review, score and finalize it.</p>
        </div>
        <div className="text-right">
          <span className="label">Protocol contract</span>
          <div className="mt-0.5">{configured ? <Hex value={CONTRACT} kind="contract" /> : <span className="text-danger text-sm font-semibold">not configured</span>}</div>
        </div>
      </div>

      {!configured && <Banner tone="error" icon="warn" title="No contract configured">Set NEXT_PUBLIC_PROOFFORGE_ADDRESS in .env.local and restart.</Banner>}
      {error && <Banner tone="error" icon="warn" title="Could not read protocol state">{error}</Banner>}

      {/* stats */}
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
        {[
          ["Missions", stats?.missions], ["Submissions", stats?.submissions], ["Reviews", stats?.auditRecords],
          ["Challenges", stats?.challenges], ["Appeals", stats?.appeals], ["Open disputes", (stats ? stats.openChallenges + stats.openAppeals : undefined)],
        ].map(([k, v]) => (
          <div key={k as string} className="panel px-3 py-2.5">
            <p className="label">{k as string}</p>
            <p className="mono mt-0.5 text-lg font-bold text-ink">{v ?? "-"}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_1fr_300px]">
        {/* LEFT - create / selected */}
        <section className="space-y-4">
          {!selected ? (
            <div className="panel p-4">
              <h2 className="text-sm font-bold text-ink">Create a mission</h2>
              <p className="mb-3 mt-0.5 text-xs text-muted">Define acceptance criteria the protocol will verify against.</p>
              <div className="space-y-3">
                <div><label className="label mb-1 block">Title</label><input className="field" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Verify a public project README…" /></div>
                <div><label className="label mb-1 block">Brief</label><textarea className="field min-h-[64px]" maxLength={2000} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="What must be delivered and confirmed?" /></div>
                <div><label className="label mb-1 block">Category</label><select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
                <div><label className="label mb-1 block">Acceptance criteria</label><ListInput items={criteria} setItems={setCriteria} placeholder="repository URL is reachable" min={1} max={12} addLabel="criterion" /></div>
                <div><label className="label mb-1 block">Required proof types</label><ListInput items={ptypes} setItems={setPtypes} placeholder="repository URL" min={1} max={8} addLabel="proof type" /></div>
                <div><label className="label mb-1 block">Reference URLs <span className="font-normal normal-case text-muted">· optional, max 5</span></label><ListInput items={refs} setItems={setRefs} placeholder="https://docs.example/spec" min={1} max={5} url addLabel="reference" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label mb-1 block">Max submissions</label><input type="number" min={1} max={100} className="field" value={maxSub} onChange={(e) => setMaxSub(Number(e.target.value))} /></div>
                  <div><label className="label mb-1 block">Min score to pass</label><input type="number" min={0} max={100} className="field" value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} /></div>
                </div>
                {hasWallet && !wallet ? (
                  <button onClick={connect} disabled={connecting} className="btn btn-primary w-full">{connecting ? <Spinner /> : <Icon name="hammer" />} Connect wallet</button>
                ) : (
                  <button onClick={onCreate} disabled={!createValid || pending === "create_mission" || !configured} className="btn btn-primary w-full">
                    {pending === "create_mission" ? <Spinner /> : <Icon name="plus" />} {pending === "create_mission" ? "Creating mission…" : "Create mission (draft)"}
                  </button>
                )}
                {!hasWallet && <Banner tone="warn" icon="warn" title="No wallet detected">Install MetaMask to create missions. You can still browse the board.</Banner>}
              </div>
            </div>
          ) : (
            <div className="panel p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-ink">Selected mission</h2>
                <button onClick={() => setSelId(null)} className="text-xs font-semibold text-muted hover:text-ink">← board</button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="mono text-xs text-muted">#{selected.missionId}</span>
                <StatusChip status={selected.status} />
              </div>
              <p className="mt-1.5 text-sm font-semibold text-ink">{selected.title}</p>
              <p className="mt-1 text-xs text-muted">{selected.brief}</p>
              <div className="mt-3">
                <span className="label">Acceptance criteria</span>
                <ul className="mt-1 space-y-1 text-xs text-ink">
                  {selected.acceptanceCriteria.map((c, i) => <li key={i} className="flex gap-1.5"><Icon name="check" className="mt-0.5 h-3 w-3 text-forge" /> {c}</li>)}
                </ul>
              </div>
              {isCreator && selected.status === "draft" && (
                <button onClick={() => run("open_mission", [selected.missionId], "Mission opened")} disabled={pending === "open_mission"} className="btn btn-primary btn-xs mt-3 w-full">
                  {pending === "open_mission" ? <Spinner className="h-3.5 w-3.5" /> : <Icon name="check" className="h-3.5 w-3.5" />} Open for submissions
                </button>
              )}

              {/* submit work */}
              {["open", "reviewing", "challenged", "appealed"].includes(selected.status) && (
                <div className="mt-4 border-t border-line pt-3">
                  <span className="label">Submit work</span>
                  <div className="mt-1.5 space-y-2">
                    <ListInput items={proofUrls} setItems={setProofUrls} placeholder="https://github.com/you/project" min={1} max={6} url addLabel="proof URL" />
                    <textarea className="field min-h-[52px]" maxLength={2000} value={proofSummary} onChange={(e) => setProofSummary(e.target.value)} placeholder="Summary of the delivered work (untrusted by the reviewer)." />
                    {wallet ? (
                      <button onClick={onSubmitWork} disabled={!proofValid || pending === "submit_work"} className="btn btn-amber btn-xs w-full">
                        {pending === "submit_work" ? <Spinner className="h-3.5 w-3.5" /> : <Icon name="plus" className="h-3.5 w-3.5" />} Submit proof of work
                      </button>
                    ) : (
                      <button onClick={connect} className="btn btn-ghost btn-xs w-full">Connect wallet to submit</button>
                    )}
                  </div>
                </div>
              )}
              <Link href={`/missions/${selected.missionId}`} className="mt-3 block text-center text-xs font-semibold text-blue hover:underline">Open full mission detail →</Link>
            </div>
          )}
        </section>

        {/* CENTER - board */}
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-bold text-ink">Missions</h2>
            {wallet && wrongNetwork && <span className="chip border-amber/50 bg-amber/10 text-[#9a5a05]">wrong network</span>}
          </div>
          {!configured ? <Empty title="No contract configured" /> : loading ? <Skeleton rows={4} /> : !missions || missions.length === 0 ? (
            <Empty title="No missions yet" hint="Create the first mission from the panel on the left." icon="hammer" />
          ) : (
            <ul className="divide-y divide-line">
              {missions.map((m) => (
                <li key={m.missionId}>
                  <button onClick={() => setSelId(m.missionId)} className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg ${selId === m.missionId ? "bg-forgeSoft" : ""}`}>
                    <span className="mono w-7 shrink-0 text-xs text-muted">#{m.missionId}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{m.title}</span>
                      <span className="block truncate text-xs text-muted">{m.category} · {m.submissionIds.length}/{m.maxSubmissions} submissions · pass ≥ {m.minScoreToPass}</span>
                    </span>
                    <StatusChip status={m.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* RIGHT - reputation + stats */}
        <section className="space-y-4">
          <div className="panel p-4">
            <span className="label">Your reputation</span>
            {!wallet ? (
              <p className="mt-2 text-xs text-muted">Connect a wallet to see your contributor profile.</p>
            ) : profile ? (
              <div className="mt-2">
                <div className="flex items-baseline justify-between">
                  <span className="mono text-2xl font-bold text-forge">{profile.reputationScore}</span>
                  <span className="text-[0.625rem] text-muted">/ 1000</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-forge" style={{ width: `${profile.reputationScore / 10}%` }} /></div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  <Stat k="Submissions" v={profile.submissions} /><Stat k="Accepted" v={profile.accepted} />
                  <Stat k="Challenges won" v={profile.challengesWon} /><Stat k="Appeals won" v={profile.appealsWon} />
                </dl>
                <Link href={`/profiles?address=${wallet.address}`} className="mt-3 block text-xs font-semibold text-blue hover:underline">View full reputation →</Link>
              </div>
            ) : <div className="mt-2 h-16 animate-pulse rounded bg-bg" />}
          </div>
          <div className="panel p-4">
            <span className="label">Protocol activity</span>
            <dl className="mt-2 space-y-1.5 text-sm">
              <Row k="Total missions" v={stats?.missions} /><Row k="Total submissions" v={stats?.submissions} />
              <Row k="Open challenges" v={stats?.openChallenges} /><Row k="Open appeals" v={stats?.openAppeals} />
              <Row k="Audit records" v={stats?.auditRecords} />
            </dl>
            <div className="mt-3 flex gap-2">
              <Link href="/reviews" className="btn btn-ghost btn-xs flex-1">Review queue</Link>
              <Link href="/disputes" className="btn btn-ghost btn-xs flex-1">Disputes</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: number }) {
  return <div><dt className="text-muted">{k}</dt><dd className="mono font-semibold text-ink">{v}</dd></div>;
}
function Row({ k, v }: { k: string; v?: number }) {
  return <div className="flex items-center justify-between"><dt className="text-muted">{k}</dt><dd className="mono font-semibold text-ink">{v ?? "-"}</dd></div>;
}
