"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@/components/WalletProvider";
import { ReputationChart } from "@/components/ReputationChart";
import { Icon, Banner, StatusChip, ScorePill, Hex, Empty, Skeleton } from "@/components/ui";
import { hasContract, getProfile, getContributorSubmissions } from "@/lib/proofforge";
import { hostOf } from "@/lib/format";
import type { Profile, Submission } from "@/lib/types";

export default function ProfilesPage() {
  const configured = hasContract();
  const { wallet } = useWallet();
  const [input, setInput] = useState("");
  const [address, setAddress] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subs, setSubs] = useState<Submission[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // initial address from ?address= or connected wallet
  useEffect(() => {
    const q = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("address") : null;
    const initial = q || wallet?.address || null;
    if (initial) { setAddress(initial); setInput(initial); }
  }, [wallet]);

  const loadProfile = useCallback(() => {
    if (!configured || !address) return;
    setLoading(true); setErr(null);
    Promise.all([getProfile(address), getContributorSubmissions(address)])
      .then(([p, s]) => { setProfile(p); setSubs(s); })
      .catch((e) => { setErr(e instanceof Error && /busy/i.test(e.message) ? "The GenLayer node is busy. Please retry in a moment." : "Could not load this profile."); })
      .finally(() => setLoading(false));
  }, [configured, address]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Contributor reputation</h1>
        <p className="text-sm text-muted">Look up any address to see its protocol reputation and submission history.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input className="field max-w-md" value={input} onChange={(e) => setInput(e.target.value)} placeholder="0x… contributor address" />
        <button onClick={() => setAddress(input.trim())} disabled={!/^0x[0-9a-fA-F]{40}$/.test(input.trim())} className="btn btn-primary btn-xs">Look up</button>
        {wallet && <button onClick={() => { setInput(wallet.address); setAddress(wallet.address); }} className="btn btn-ghost btn-xs">My profile</button>}
      </div>

      {!configured ? <Banner tone="error" icon="warn" title="No contract configured">Set the contract address in .env.local.</Banner>
      : !address ? <div className="panel"><Empty icon="hammer" title="No address selected" hint="Enter an address or connect your wallet." /></div>
      : loading ? <div className="panel"><Skeleton rows={4} /></div>
      : err ? <div className="panel p-4"><Banner tone="warn" icon="warn" title="Could not load profile">{err} <button onClick={loadProfile} className="ml-1 font-semibold underline">Retry</button></Banner></div>
      : !profile ? <div className="panel"><Empty icon="hammer" title="No profile found" /></div>
      : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
          <section className="space-y-4">
            <div className="panel p-5">
              <span className="label">Address</span>
              <div className="mt-1"><Hex value={profile.address} lead={10} tail={6} /></div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="label">Reputation</span>
                <span className="text-[0.625rem] text-muted">range 0-1000</span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="mono text-3xl font-bold text-forge">{profile.reputationScore}</span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-forge transition-[width] duration-500" style={{ width: `${profile.reputationScore / 10}%` }} /></div>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <Cell k="Submissions" v={profile.submissions} />
                <Cell k="Accepted" v={profile.accepted} c="#245C4A" />
                <Cell k="Rejected" v={profile.rejected} c="#B91C1C" />
                <Cell k="Challenges won" v={profile.challengesWon} c="#2563EB" />
                <Cell k="Challenges lost" v={profile.challengesLost} c="#D97706" />
                <Cell k="Appeals won" v={profile.appealsWon} c="#2563EB" />
                <Cell k="Appeals lost" v={profile.appealsLost} c="#D97706" />
              </dl>
            </div>
            <div className="panel p-5">
              <span className="label">Outcomes</span>
              <div className="mt-2"><ReputationChart profile={profile} /></div>
            </div>
          </section>

          <section className="panel overflow-hidden">
            <div className="border-b border-line px-4 py-3"><h2 className="text-sm font-bold text-ink">Submission history</h2></div>
            {!subs || subs.length === 0 ? (
              <Empty icon="clipboard" title="No submissions" hint="This address has not submitted work yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-line"><th className="th">#</th><th className="th">Mission</th><th className="th">Proof</th><th className="th">Score</th><th className="th">Status</th></tr></thead>
                  <tbody className="divide-y divide-line">
                    {subs.map((s) => (
                      <tr key={s.submissionId} className="hover:bg-bg">
                        <td className="px-3 py-2.5 mono text-xs text-muted">#{s.submissionId}</td>
                        <td className="px-3 py-2.5"><Link href={`/missions/${s.missionId}`} className="font-medium text-ink hover:text-forge">mission #{s.missionId}</Link></td>
                        <td className="px-3 py-2.5 text-xs text-muted">{s.proofUrls.map(hostOf).join(", ")}</td>
                        <td className="px-3 py-2.5"><ScorePill score={s.score} /></td>
                        <td className="px-3 py-2.5"><StatusChip status={s.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function Cell({ k, v, c }: { k: string; v: number; c?: string }) {
  return <div><dt className="text-muted text-xs">{k}</dt><dd className="mono font-bold" style={{ color: c ?? "#111827" }}>{v}</dd></div>;
}
