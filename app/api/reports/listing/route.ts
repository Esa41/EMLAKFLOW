import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { buildWeeklyReport } from "@/lib/report";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

/**
 * POST /api/reports/listing  Body: { listingId }
 * Mülk sahibi için haftalık "ilgi + pazar durumu" raporu üretir:
 * deterministik istatistik + OpenAI ile 2-3 cümlelik sıcak, bilgilendirici özet.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { listingId } = (await req.json().catch(() => ({}))) as {
    listingId?: string;
  };
  if (!listingId)
    return NextResponse.json({ error: "listingId gerekli." }, { status: 400 });

  const db = forTenant(session.tenantId);
  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing)
    return NextResponse.json({ error: "İlan bulunamadı." }, { status: 404 });

  const report = await buildWeeklyReport(db, session.tenantId, listing);

  let summary = "";
  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: `Sen bir emlak danışmanısın ve mülk sahibine ilanının bu haftaki durumunu özetleyen kısa, sıcak ve profesyonel bir mesaj yazıyorsun (Türkçe, 2-3 cümle). Verilere dayan, abartma. WhatsApp'tan gönderilecek — samimi ama güven veren bir ton kullan. Rakamları anlamlandır (ör. "geçen haftaya göre ilgi arttı").`,
      prompt: JSON.stringify(report),
      temperature: 0.6,
      maxOutputTokens: 260,
    });
    summary = text.trim();
  } catch {
    summary = `${report.listingTitle} ilanınız bu hafta ${report.views} kez detaylı incelendi, ${report.contacts} iletişim talebi aldı. İlan ${report.domDays} gündür yayında.`;
  }

  return NextResponse.json({ report, summary });
}
