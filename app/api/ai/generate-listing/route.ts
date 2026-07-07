import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

/**
 * POST /api/ai/generate-listing
 * Body: { prompt: string }
 * Danışmanın kısa açıklamasından (ör. "Kadıköy Moda 3+1 deniz manzaralı 150m2")
 * yapay zeka ile eksiksiz ilan verileri üretir.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });
  }

  const { prompt } = (await req.json()) as { prompt?: string };
  if (!prompt || prompt.trim().length < 5) {
    return NextResponse.json(
      { error: "En az 5 karakter içeren bir açıklama girin." },
      { status: 400 },
    );
  }

  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: `Sen deneyimli bir Türk emlak danışmanısın. Kullanıcının kısa notunu profesyonel, güven veren ve satış odaklı bir ilana dönüştür.

Kurallar:
- Türkçe yaz; abartılı süperlatiflerden kaçın ("eşsiz fırsat" gibi klişeler yok)
- Başlık: konum + oda + tip + ayırt edici özellik, max 75 karakter
- Açıklama: 120-220 kelime; giriş cümlesi konumu net söylesin, gövde özellikleri madde gibi akıtsın, kapanış net CTA içersin
- Fiyat: 2025 Türkiye piyasasına uygun, gerçekçi tahmin (belirsizse null)
- Bilinmeyen alanları uydurma; null bırak

SADECE aşağıdaki JSON formatında yanıt ver:
{
  "title": "...",
  "description": "...",
  "purpose": "SALE veya RENT",
  "type": "APARTMENT | HOUSE | VILLA | LAND | COMMERCIAL | OFFICE",
  "city": "...",
  "district": "...",
  "neighborhood": "... veya null",
  "rooms": "... veya null",
  "grossArea": sayı veya null,
  "netArea": sayı veya null,
  "price": sayı veya null,
  "heating": "... veya null",
  "buildingAge": sayı veya null,
  "creditEligible": true/false,
  "furnished": true/false,
  "inSite": true/false,
  "features": ["...", "..."]
}`,
      prompt: prompt.trim(),
      temperature: 0.5,
      maxOutputTokens: 1200,
    });

    // JSON parse — AI bazen markdown code fence kullanabiliyor
    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const listing = JSON.parse(cleaned);

    return NextResponse.json({ listing });
  } catch (err: unknown) {
    console.error("[AI Generate Listing]", err);
    const message =
      err instanceof Error ? err.message : "AI servisine ulaşılamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
