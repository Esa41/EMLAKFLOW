import { getSession } from "@/lib/auth";
import { listStudioVideosForSocial } from "@/lib/social-os/studio-media";
import { MediaLibrary } from "@/components/social/media-library";

export default async function MedyaPage() {
  const session = (await getSession())!;
  const items = await listStudioVideosForSocial(session.tenantId, { take: 48 });

  return <MediaLibrary items={items} />;
}
