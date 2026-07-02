"use client";

import type { AuditRecord } from "@/lib/types";
import { StatusChip } from "./ui";
import { truncateHex } from "@/lib/format";

const ACTION_LABEL: Record<string, string> = {
  create_mission: "Mission created", open_mission: "Mission opened", submit_work: "Work submitted",
  review_submission: "Reviewed", challenge_submission: "Challenged", resolve_challenge: "Challenge resolved",
  file_appeal: "Appeal filed", resolve_appeal: "Appeal resolved", finalize_mission: "Finalized", archive_mission: "Archived",
};

export function AuditTimeline({ records }: { records: AuditRecord[] }) {
  if (!records.length) return null;
  const sorted = [...records].sort((a, b) => b.at - a.at);
  return (
    <ol className="relative ml-2 border-l border-line">
      {sorted.map((r) => (
        <li key={r.auditId} className="relative pb-4 pl-5 last:pb-0">
          <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-forge" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-ink">{ACTION_LABEL[r.action] ?? r.action}</span>
            <StatusChip status={r.statusAfter} />
            <span className="mono text-[0.625rem] text-muted">#{r.at}</span>
          </div>
          {r.summary && <p className="mt-0.5 text-xs text-muted">{r.summary}</p>}
          <p className="mt-0.5 text-[0.625rem] text-muted">
            by <span className="mono">{truncateHex(r.actor, 6, 4)}</span>
            {r.submissionId ? ` · submission #${r.submissionId}` : ""}
            {r.challengeId ? ` · challenge #${r.challengeId}` : ""}
            {r.appealId ? ` · appeal #${r.appealId}` : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}
