import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { computePriceBand } from "@/lib/pricing";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const trMoney = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

/**
 * POST /api/ai/price-advice  Body: { listingId }
 * Emsal analiziyle fiyat bandı hesaplar, ardından (emsal ≥ 3 ise) OpenAI ile
 * kısa bir "fiyatlama danışmanlığı" metni üretir. Emsal yoksa AI çağrılmaz.
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

  const band = await computePriceBand(db, listing);
  if (!band) {
    return NextResponse.json({
      band: null,
      advice:
        "Bu ilan için yeterli emsal (benzer tip/bölge/metrekare) bulunamadı — fiyat bandı hesaplanamadı. Portföyünüz büyüdükçe analiz güçlenir.",
    });
  }

  const askingPrice = Number(listing.price);
  const diffPct = Math.round(((askingPrice - band.mid) / band.mid) * 100);

  let advice = "";
  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: `Sen bir Türkiye emlak piyasası fiyatlama danışmanısın. Sana bir ilanın mevcut fiyatı ve emsal analizinden çıkan piyasa bandı verilecek. 2-3 cümlelik, net ve eylem odaklı bir fiyatlama önerisi yaz (Türkçe). Fiyat bandın üstündeyse indirim öner, altındaysa değer artırma fırsatını belirt, bandın içindeyse konumunu doğrula. Sayıları tekrar tekrar yazma, yorum yap.`,
      prompt: JSON.stringify({
        ilan: {
          baslik: listing.title,
          tip: listing.type,
          bolge: `${listing.district}, ${listing.city}`,
          netM2: listing.netArea ?? listing.grossArea,
          mevcutFiyat: askingPrice,
        },
        emsalAnalizi: {
          dusuk: band.low,
          orta: band.mid,
          yuksek: band.high,
          medyanM2Fiyat: band.medianSqm,
          emsalSayisi: band.sampleSize,
          guven: band.confidence,
          mevcutFiyatFarkiYuzde: diffPct,
        },
      }),
      temperature: 0.5,
      maxOutputTokens: 300,
    });
    advice = text.trim();
  } catch {
    // AI düşerse deterministik özet ile devam et (özellik asla tamamen kırılmaz)
    advice =
      diffPct > 8
        ? `Fiyatınız emsal ortalamasının %${diffPct} üzerinde. Piyasa bandına (${trMoney.format(band.low)}–${trMoney.format(band.high)}) çekmek yayın süresini kısaltabilir.`
        : diffPct < -8
          ? `Fiyatınız emsal ortalamasının %${Math.abs(diffPct)} altında — değeri ${trMoney.format(band.mid)} seviyesine taşıma fırsatı var.`
          : `Fiyatınız piyasa bandının içinde, konumlandırma isabetli görünüyor.`;
  }

  return NextResponse.json({ band, advice, diffPct });
}
