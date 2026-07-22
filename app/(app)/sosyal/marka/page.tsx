import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BrandKitForm } from "@/components/social/brand-kit-form";

export default async function MarkaPage() {
  const session = (await getSession())!;
  const brand = await prisma.brandKit.findUnique({
    where: { tenantId: session.tenantId },
  });

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink/55">
        Marka kiti, AI üretiminde otomatik uygulanır. Logo ve renkler Ayarlar →
        Vitrin üzerinden yönetilir.
      </p>
      <BrandKitForm
        initial={
          brand
            ? {
                voice: brand.voice,
                mission: brand.mission,
                vision: brand.vision,
                photographyStyle: brand.photographyStyle,
                emojiPolicy: brand.emojiPolicy,
                tonePresets: brand.tonePresets,
                values: brand.values,
                forbiddenPhrases: brand.forbiddenPhrases,
                quietHoursStart: brand.quietHoursStart,
                quietHoursEnd: brand.quietHoursEnd,
                timezone: brand.timezone,
              }
            : null
        }
      />
    </div>
  );
}
