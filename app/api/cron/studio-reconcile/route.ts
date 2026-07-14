import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reconcileProject } from "@/lib/studio-reconcile";

// AI Stüdyo mutabakat backstop'u (Vercel Cron → vercel.json: günlük 05:00 UTC).
// Normalde UI 15 sn polling'iyle getStudioProject Fal ile mutabakat yapar;
// kullanıcı sekmeyi kapatsa bile stüdyoyu yeniden açtığında polling devreye
// girip stuck projeyi kurtarır. Bu cron yalnızca HİÇ geri dönülmeyen stuck
// projeler için son güvenlik ağıdır: işlemdeki sahnesi ya da birleştirme işi
// olan tüm projeleri tarar (cross-tenant, oturumsuz). Polling ile çakışsa bile
// claim mantığı çift tamamlama/çift kredi iadesini engeller.
//
// NOT: Vercel Hobby planı cron'u günde bir kez ile sınırlar (sub-daily deploy'u
// kırar). Yakın-gerçek-zamanlı backstop için: Pro'ya geçip schedule'ı */15
// yapın, YA DA QStash schedule'ı bu endpoint'e (Bearer CRON_SECRET) yöneltin.

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.studioProject.findMany({
    where: {
      OR: [
        { scenes: { some: { status: "PROCESSING" } } },
        { jobs: { some: { type: "VIDEO_MERGE", status: "PROCESSING" } } },
      ],
    },
    orderBy: { updatedAt: "asc" }, // en uzun süredir bekleyen önce
    select: { id: true },
    take: 25, // maxDuration güvencesi — kalanlar sonraki tetiklemede
  });

  let reconciled = 0;
  for (const p of projects) {
    try {
      await reconcileProject(p.id);
      reconciled++;
    } catch {
      // Tek projenin hatası taramayı durdurmasın
    }
  }

  return NextResponse.json({ ok: true, pending: projects.length, reconciled });
}
