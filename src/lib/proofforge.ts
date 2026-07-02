"use client";

import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus, type TransactionHash } from "genlayer-js/types";
import type { Mission, Submission, Challenge, Appeal, Profile, AuditRecord, PublicStats } from "./types";

export const CONTRACT = (
  process.env.NEXT_PUBLIC_PROOFFORGE_ADDRESS ?? "0x2b07227D8440693A7940e81b84332Df6bf431B2d"
).trim();
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID ?? 61999);
export const NETWORK = process.env.NEXT_PUBLIC_GENLAYER_NETWORK ?? "studionet";

export function hasContract(): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(CONTRACT);
}

let _read: ReturnType<typeof createClient> | null = null;
function rc() {
  if (!_read) _read = createClient({ chain: studionet, account: createAccount() });
  return _read;
}
const A = CONTRACT as `0x${string}`;

function parseObj<T>(raw: unknown): T | null {
  if (typeof raw !== "string" || !raw.trim() || raw.trim() === "{}") return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}
function parseArr<T>(raw: unknown): T[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try { const a = JSON.parse(raw); return Array.isArray(a) ? (a as T[]) : []; } catch { return []; }
}
async function call(fn: string, args: unknown[] = []) {
  return rc().readContract({ address: A, functionName: fn, args: args as never[] });
}

export const getPublicStats = async (): Promise<PublicStats | null> => parseObj<PublicStats>(await call("get_public_stats"));
export const getRecentMissions = async (limit = 30): Promise<Mission[]> => parseArr<Mission>(await call("get_recent_missions", [limit]));
export const getMission = async (id: string): Promise<Mission | null> => parseObj<Mission>(await call("get_mission", [id]));
export const getSubmission = async (id: string): Promise<Submission | null> => parseObj<Submission>(await call("get_submission", [id]));
export const getChallenge = async (id: string): Promise<Challenge | null> => parseObj<Challenge>(await call("get_challenge", [id]));
export const getAppeal = async (id: string): Promise<Appeal | null> => parseObj<Appeal>(await call("get_appeal", [id]));
export const getProfile = async (addr: string): Promise<Profile | null> => parseObj<Profile>(await call("get_profile", [addr]));
export const getMissionSubmissions = async (id: string): Promise<Submission[]> => parseArr<Submission>(await call("get_mission_submissions", [id]));
export const getCreatorMissions = async (addr: string): Promise<Mission[]> => parseArr<Mission>(await call("get_creator_missions", [addr]));
export const getContributorSubmissions = async (addr: string): Promise<Submission[]> => parseArr<Submission>(await call("get_contributor_submissions", [addr]));
export const getOpenChallenges = async (limit = 50): Promise<Challenge[]> => parseArr<Challenge>(await call("get_open_challenges", [limit]));
export const getOpenAppeals = async (limit = 50): Promise<Appeal[]> => parseArr<Appeal>(await call("get_open_appeals", [limit]));
export const getAuditTrail = async (id: string): Promise<AuditRecord[]> => parseArr<AuditRecord>(await call("get_audit_trail", [id]));

/* ── wallet ── */
export interface Wallet { address: `0x${string}`; chainId: number }
function eth(): any { return typeof window === "undefined" ? undefined : (window as any).ethereum; }
export function hasWallet(): boolean { return !!eth(); }
export async function connectWallet(): Promise<Wallet> {
  const p = eth();
  if (!p) throw new Error("no_wallet");
  const accounts: string[] = await p.request({ method: "eth_requestAccounts" });
  const chainHex: string = await p.request({ method: "eth_chainId" });
  return { address: accounts[0] as `0x${string}`, chainId: parseInt(chainHex, 16) };
}
export async function currentWallet(): Promise<Wallet | null> {
  const p = eth();
  if (!p) return null;
  try {
    const accounts: string[] = await p.request({ method: "eth_accounts" });
    if (!accounts.length) return null;
    const chainHex: string = await p.request({ method: "eth_chainId" });
    return { address: accounts[0] as `0x${string}`, chainId: parseInt(chainHex, 16) };
  } catch { return null; }
}

/* ── writes ── */
export async function writeMethod(address: `0x${string}`, fn: string, args: unknown[]): Promise<`0x${string}`> {
  const client = createClient({ chain: studionet, account: address });
  await client.connect(NETWORK as never);
  const hash = await client.writeContract({ address: A, functionName: fn, args: args as never[], value: 0n });
  return hash as `0x${string}`;
}
export async function waitAccepted(address: `0x${string}`, hash: `0x${string}`): Promise<void> {
  const client = createClient({ chain: studionet, account: address });
  await client.waitForTransactionReceipt({ hash: hash as unknown as TransactionHash, status: TransactionStatus.ACCEPTED, interval: 5000, retries: 80 });
}
