export type MissionStatus = "draft" | "open" | "reviewing" | "challenged" | "appealed" | "finalized" | "archived";
export type SubmissionStatus = "submitted" | "accepted" | "revision_requested" | "rejected" | "challenged" | "appealed" | "finalized";
export type ReviewVerdict = "accepted" | "revision_requested" | "rejected" | "";

export interface Mission {
  missionId: string; creator: string; title: string; brief: string; category: string;
  acceptanceCriteria: string[]; requiredProofTypes: string[]; referenceUrls: string[];
  maxSubmissions: number; minScoreToPass: number; status: MissionStatus; createdAt: number;
  selectedSubmissionId: string; auditTrailIds: string[]; submissionIds: string[];
}
export interface Submission {
  submissionId: string; missionId: string; contributor: string; proofUrls: string[];
  proofSummary: string; score: number; verdict: ReviewVerdict; reviewSummary: string;
  strengths: string[]; weaknesses: string[]; riskFlags: string[]; status: SubmissionStatus;
  createdAt: number; challengeIds: string[]; appealIds: string[]; rawReviewJson: string;
}
export interface Challenge {
  challengeId: string; missionId: string; submissionId: string; challenger: string;
  reason: string; evidenceUrls: string[]; status: "open" | "upheld" | "dismissed";
  reviewJson: string; createdAt: number;
}
export interface Appeal {
  appealId: string; missionId: string; submissionId: string; appellant: string;
  reason: string; evidenceUrls: string[]; status: "open" | "accepted" | "denied";
  reviewJson: string; createdAt: number;
}
export interface Profile {
  address: string; submissions: number; accepted: number; rejected: number;
  challengesWon: number; challengesLost: number; appealsWon: number; appealsLost: number;
  reputationScore: number; lastActivity: number;
}
export interface AuditRecord {
  auditId: string; action: string; actor: string; missionId: string; submissionId: string;
  challengeId: string; appealId: string; summary: string; statusAfter: string; at: number;
}
export interface PublicStats {
  missions: number; submissions: number; challenges: number; appeals: number;
  auditRecords: number; openChallenges: number; openAppeals: number; clock: number;
}

export const PROOF_TYPE_PRESETS = ["repository URL", "README URL", "live demo URL", "documentation URL", "screenshot URL", "test report URL"];
export type Phase = "idle" | "submitting" | "sent" | "finalizing" | "done" | "failed";
