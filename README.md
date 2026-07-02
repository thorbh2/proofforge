# ProofForge

ProofForge is a GenLayer deliverable-verification protocol for missions, proof submissions, rubric review, contributor reputation, challenges and appeals.

Creators publish missions, contributors submit proof URLs, and GenLayer evaluates the evidence against acceptance criteria before the record can be challenged or finalized.

## Live System

| Surface | Link |
| --- | --- |
| App | https://proofforge.vercel.app |
| GitHub | https://github.com/thorbh2/proofforge |
| Contract | https://explorer-studio.genlayer.com/contracts/0x2b07227D8440693A7940e81b84332Df6bf431B2d |
| Network | GenLayer Studionet |

## What Ships

- Product frontend with wallet-gated write actions and public read views.
- GenLayer contract source in `contracts/ProofForge.py`.
- Deployment metadata in `deployment.json`.
- Frontend contract client in `src/lib/proofforge.ts`.
- Public contract address pinned as a fallback and documented in `.env.local.example`.

## Contract Model

This is not a one-call demo contract. The on-chain package keeps lifecycle state, evidence records, review outputs, challenge and appeal records, indexed read methods and audit-friendly public views.

Verification record: 10 write methods exercised, 13 read methods verified.

## Run Locally

```powershell
npm install
npm run dev
```

Open the URL printed by Next.js. The public contract address is already present as a fallback; local env files are optional for normal read-only review.

## Public Environment

```text
NEXT_PUBLIC_PROOFFORGE_ADDRESS=0x2b07227D8440693A7940e81b84332Df6bf431B2d
NEXT_PUBLIC_GENLAYER_RPC=https://studio.genlayer.com/api
NEXT_PUBLIC_GENLAYER_EXPLORER=https://explorer-studio.genlayer.com
NEXT_PUBLIC_GENLAYER_CHAIN_ID=61999
```

## Deploy

```powershell
npx --yes vercel@latest --prod --yes
```

## Security

- No private keys, vault files, local dashboard data or decrypted wallet material belong in this repository.
- The frontend receives only public `NEXT_PUBLIC_*` values.
- Write actions require a connected wallet confirmation.
- `.env.local`, `.vercel/`, build output and local state are ignored.
