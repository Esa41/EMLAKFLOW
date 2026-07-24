// Kredi birimi geçişi: eski "1 kredi = 1 sahne" → yeni "100 kredi = 1 video"
// Tüm mevcut video kredisi bakiyeleri ×20 çarpılır (5 eski kredi = 1 video
// = 100 yeni kredi hizası). Her ofis için CreditLog kaydı düşülür.
//
// ÖNEMLİ: Bu script yeni birimli kodun DEPLOY'U İLE AYNI ANDA çalıştırılmalı.
// Eski kod canlıdayken çalıştırılırsa kullanıcılar şişmiş bakiyeyle eski
// (ucuz) tarifeden üretim yapar; yeni kod deploy edilip bakiye taşınmazsa
// da herkesin bakiyesi 20 kat değersizleşir.
//
// Çalıştır: npx tsx scripts/migrate-credits-x20.ts
// İdempotent: CreditLog'daki geçiş kaydı görülürse ikinci kez uygulamaz.
import { config } from "dotenv";
config();
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const MULTIPLIER = 20;
const REASON = "Kredi birimi geçişi (100 kredi = 1 video, ×20)";

async function main() {
  const done = await prisma.creditLog.findFirst({
    where: { reason: REASON },
    select: { id: true },
  });
  if (done) {
    console.log("Geçiş zaten uygulanmış — çıkılıyor.");
    return;
  }

  const tenants = await prisma.tenant.findMany({
    where: { aiVideoCredits: { gt: 0 } },
    select: { id: true, name: true, aiVideoCredits: true },
  });

  for (const t of tenants) {
    const next = t.aiVideoCredits * MULTIPLIER;
    await prisma.$transaction([
      prisma.tenant.update({
        where: { id: t.id },
        data: { aiVideoCredits: next },
      }),
      prisma.creditLog.create({
        data: {
          tenantId: t.id,
          kind: "video",
          delta: next - t.aiVideoCredits,
          reason: REASON,
          changedBy: "sistem",
        },
      }),
    ]);
    console.log(`✅ ${t.name}: ${t.aiVideoCredits} → ${next}`);
  }

  console.log(`\n${tenants.length} ofis taşındı.`);
}

main()
  .catch((err) => {
    console.error("Hata:", err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
