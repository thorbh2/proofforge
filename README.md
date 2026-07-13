# ProofForge

ProofForge is a GenLayer deliverable-verification protocol for missions, proof submissions, rubric review, contributor reputation, challenges and appeals.

Creators publish missions, contributors submit proof URLs, and GenLayer evaluates the evidence against acceptance criteria before the record can be challenged or finalized.

## Live System

| Surface | Link |
| --- | --- |
| App | https://proofforge-iota.vercel.app |
| GitHub | https://github.com/thorbh2/proofforge |
| Contract | https://explorer-studio.genlayer.com/contracts/0x2e076A8f005289398800B48595A97b7DeB765c8c |
| Deploy tx | https://explorer-studio.genlayer.com/tx/0x6d89a2a3b8fcd91ad59edc3d893191017aa99be80b07beb877c71179f1f3400a |
| Vercel inspect | https://vercel.com/aspros-projects-07dbbeb8/proofforge/8CLV5U2fzo7WDDBno2TjyXyfGW7h |
| Network | GenLayer Studionet |

## Dispute Completion

ProofForge keeps its current pinned GenVM dependency and exposes challenge, appeal, resolution and finalization writes through the app. Review resolution is limited to the mission creator or protocol reviewer; contributors can appeal their own submissions. Upheld challenges and accepted appeals update score, verdict and mission state consistently, while any open dispute prevents finalization. `tests/test_submission_invariants.py` covers the dependency and all of these transitions.

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
NEXT_PUBLIC_PROOFFORGE_ADDRESS=0x2e076A8f005289398800B48595A97b7DeB765c8c
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
