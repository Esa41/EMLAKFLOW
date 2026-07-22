import { forTenant } from "@/lib/tenant";
import { TEMPLATES, type TemplateKey } from "@/lib/studio-templates";

export type StudioMediaItem = {
  id: string;
  kind: "project" | "job";
  videoUrl: string;
  title: string;
  listingId: string;
  listingRef: string;
  listingTitle: string;
  templateKey: string | null;
  templateLabel: string | null;
  aspectRatio: string | null;
  createdAt: string;
};

export async function listStudioVideosForSocial(
  tenantId: string,
  opts?: { listingId?: string; take?: number },
): Promise<StudioMediaItem[]> {
  const db = forTenant(tenantId);
  const take = opts?.take ?? 40;
  const listingFilter = opts?.listingId ? { listingId: opts.listingId } : {};

  const [projects, jobs] = await Promise.all([
    db.studioProject.findMany({
      where: {
        ...listingFilter,
        finalVideoUrl: { not: null },
      },
      orderBy: { updatedAt: "desc" },
      take,
      select: {
        id: true,
        title: true,
        finalVideoUrl: true,
        templateKey: true,
        aspectRatio: true,
        listingId: true,
        createdAt: true,
        listing: { select: { refCode: true, title: true } },
      },
    }),
    db.studioJob.findMany({
      where: {
        ...listingFilter,
        status: "COMPLETED",
        outputUrl: { not: null },
        type: { in: ["VIDEO_GENERATE", "VIDEO_MERGE"] },
      },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        outputUrl: true,
        videoConceptKey: true,
        listingId: true,
        createdAt: true,
        projectId: true,
        listing: { select: { refCode: true, title: true } },
      },
    }),
  ]);

  const projectIdsWithFinal = new Set(
    projects.filter((p) => p.finalVideoUrl).map((p) => p.id),
  );

  const fromProjects: StudioMediaItem[] = projects
    .filter((p): p is typeof p & { finalVideoUrl: string } => !!p.finalVideoUrl)
    .map((p) => {
      const tk = p.templateKey as TemplateKey | null;
      const tpl = tk && tk in TEMPLATES ? TEMPLATES[tk] : null;
      return {
        id: p.id,
        kind: "project" as const,
        videoUrl: p.finalVideoUrl,
        title: p.title || "Stüdyo videosu",
        listingId: p.listingId,
        listingRef: p.listing.refCode,
        listingTitle: p.listing.title,
        templateKey: p.templateKey,
        templateLabel: tpl?.label ?? null,
        aspectRatio: p.aspectRatio,
        createdAt: p.createdAt.toISOString(),
      };
    });

  // Merge job'ları proje final'i yoksa göster (eski tekil video işleri)
  const fromJobs: StudioMediaItem[] = jobs
    .filter(
      (j) =>
        j.outputUrl &&
        (!j.projectId || !projectIdsWithFinal.has(j.projectId)),
    )
    .map((j) => ({
      id: j.id,
      kind: "job" as const,
      videoUrl: j.outputUrl!,
      title: j.videoConceptKey
        ? `Video · ${j.videoConceptKey}`
        : "Stüdyo videosu",
      listingId: j.listingId,
      listingRef: j.listing.refCode,
      listingTitle: j.listing.title,
      templateKey: j.videoConceptKey,
      templateLabel: j.videoConceptKey,
      aspectRatio: null,
      createdAt: j.createdAt.toISOString(),
    }));

  return [...fromProjects, ...fromJobs]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, take);
}

export function studioTemplateHint(templateKey: TemplateKey | string | null) {
  if (!templateKey || !(templateKey in TEMPLATES)) return null;
  const t = TEMPLATES[templateKey as TemplateKey];
  return {
    key: t.key,
    label: t.label,
    subtitle: t.subtitle,
    description: t.description,
    aspectRatio: t.aspectRatio,
    badge: t.badge,
  };
}
