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
      system: `Sen bir Türkiye emlak sektörü uzmanısın. Kullanıcı sana kısa bir açıklama verecek, sen bunu eksiksiz bir ilan verisi haline getireceksin.
SADECE aşağıdaki JSON formatında yanıt ver, başka hiçbir şey yazma:
{
  "title": "SEO uyumlu, dikkat çekici ilan başlığı (Türkçe, max 80 karakter)",
  "description": "Detaylı, etkileyici ilan açıklaması (Türkçe, 150-300 kelime, satış/kiralama odaklı)",
  "purpose": "SALE veya RENT",
  "type": "APARTMENT | HOUSE | VILLA | LAND | COMMERCIAL | OFFICE",
  "city": "İl adı",
  "district": "İlçe adı",
  "neighborhood": "Mahalle adı (eğer belirtildiyse)",
  "rooms": "Oda sayısı (ör. 3+1, 2+1)",
  "grossArea": sayı veya null,
  "netArea": sayı veya null,
  "price": tahmini fiyat (sayı, TL cinsinden),
  "heating": "Isıtma tipi (ör. Kombi, Merkezi, Yerden Isıtma)",
  "buildingAge": sayı veya null,
  "creditEligible": true veya false,
  "furnished": true veya false,
  "inSite": true veya false,
  "features": ["özellik1", "özellik2", "özellik3"]
}
Fiyat tahmin ederken Türkiye'nin 2024-2025 emlak piyasasını baz al. Bilinmeyen alanları null veya mantıklı varsayımlarla doldur.`,
      prompt: prompt.trim(),
      temperature: 0.7,
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
