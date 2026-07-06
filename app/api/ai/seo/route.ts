import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateListingSeo, type SeoInput } from "@/lib/seo-ai";

/**
 * POST /api/ai/seo
 * Body: ilan form verileri (title, purpose, type, city, district, ...)
 * Girilen ilan bilgilerinden AI ile SEO başlığı + meta açıklama + slug üretir.
 * Formdaki "SEO Önizleme" kartındaki yenile butonu tarafından çağrılır.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as SeoInput | null;
  if (!body?.title || !body?.district || !body?.city) {
    return NextResponse.json(
      { error: "SEO üretimi için en az başlık, il ve ilçe gerekli." },
      { status: 400 },
    );
  }

  const seo = await generateListingSeo({
    title: body.title,
    purpose: body.purpose ?? "SALE",
    type: body.type ?? "APARTMENT",
    city: body.city,
    district: body.district,
    neighborhood: body.neighborhood ?? null,
    rooms: body.rooms || null,
    netArea: body.netArea ? Number(body.netArea) : null,
    grossArea: body.grossArea ? Number(body.grossArea) : null,
    price: body.price ? Number(body.price) : null,
    buildingAge: body.buildingAge != null && body.buildingAge !== ("" as never) ? Number(body.buildingAge) : null,
    heating: body.heating || null,
    features: Array.isArray(body.features) ? body.features : [],
    description: body.description || null,
  });

  return NextResponse.json({ seo });
}
