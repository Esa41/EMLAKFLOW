import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import { onDealWon, onDealUnwon } from "@/lib/commission";

type Ctx = { params: Promise<{ id: string }> };

const STAGES = [
  "NEW",
  "CONTACTED",
  "VIEWING",
  "OFFER",
  "CONTRACT",
  "CLOSED_WON",
  "CLOSED_LOST",
] as const;

const STAGE_TR: Record<string, string> = {
  NEW: "Yeni",
  CONTACTED: "İletişimde",
  VIEWING: "Yer Gösterildi",
  OFFER: "Teklif",
  CONTRACT: "Sözleşme",
  CLOSED_WON: "Kazanıldı",
  CLOSED_LOST: "Kaybedildi",
};

/** Body: { stage?, value?, lostReason? } */
export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id } = await ctx.params;
  const db = forTenant(session.tenantId);

  const body = await req.json().catch(() => ({}));
  if (body.stage && !STAGES.includes(body.stage)) {
    return NextResponse.json({ error: "Geçersiz aşama." }, { status: 400 });
  }

  try {
    const isClosing = body.stage === "CLOSED_WON" || body.stage === "CLOSED_LOST";
    const deal = await db.deal.update({
      where: { id },
      data: {
        ...(body.stage !== undefined && {
          stage: body.stage,
          stageChangedAt: new Date(),
        }),
        ...(body.value !== undefined && { value: body.value === null ? null : Number(body.value) }),
        ...(body.lostReason !== undefined && { lostReason: body.lostReason || null }),
        ...(body.stage !== undefined && { closedAt: isClosing ? new Date() : null }),
      },
      include: {
        contact: { select: { id: true, fullName: true, phone: true } },
        listing: { select: { id: true, refCode: true, title: true } },
        agent: { select: { id: true, name: true } },
      },
    });

    if (body.stage !== undefined) {
      await db.activity.create({
        data: {
          tenantId: session.tenantId,
          type: "STATUS_CHANGE",
          userId: session.userId,
          entity: "deal",
          entityId: deal.id,
          body: `Fırsat "${STAGE_TR[body.stage]}" aşamasına taşındı${
            deal.contact ? ` — ${deal.contact.fullName}` : ""
          }.`,
        },
      });

      // ── Komisyon motoru ──
      if (body.stage === "CLOSED_WON") {
        const result = await onDealWon(db, session.tenantId, deal.id);
        if (result.created) {
          await db.activity.create({
            data: {
              tenantId: session.tenantId,
              type: "NOTE",
              userId: session.userId,
              entity: "deal",
              entityId: deal.id,
              body: `Komisyon oluşturuldu: brüt ₺${result.gross.toLocaleString("tr-TR")} (danışman ₺${result.agentShare.toLocaleString("tr-TR")} / ofis ₺${result.officeShare.toLocaleString("tr-TR")}).`,
            },
          });
        }
      } else {
        // Kazanılmıştan geri çekildiyse ödenmemiş komisyonu temizle
        await onDealUnwon(db, deal.id);
      }
    }

    return NextResponse.json({ deal });
  } catch {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id } = await ctx.params;

  try {
    await forTenant(session.tenantId).deal.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }
}
