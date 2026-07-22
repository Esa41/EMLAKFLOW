# AI Social OS — implementation pack

Companion to [`../AI-SOCIAL-MEDIA-OS.md`](../AI-SOCIAL-MEDIA-OS.md).

| File | Purpose |
|---|---|
| `schema.fragment.prisma` | Additive Prisma models — merge then `npx prisma db push` |
| `prompt-library.ts` | 14 agents + vertical packs + image/video scaffolds |
| `examples/generate-asset.ts` | Listing → structured ContentAsset (AI SDK) |
| `examples/smart-planner.ts` | 30/60/90 slot generator |
| `examples/nav-patch.ts` | Büyüme nav group sketch |
| `examples/publish-worker.ts` | QStash publish worker sketch |

**Do not import these paths from `app/`.** Copy into `lib/social*`, `app/actions`, `components/social` when building MVP.
