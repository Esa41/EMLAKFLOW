import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VitrinInbox } from "@/components/vitrin-inbox";
import { SohbetTabs } from "@/components/sohbet-tabs";
import { EmailCenter } from "@/components/email-center";

// Vitrin ziyaretçileriyle canlı sohbet — ajan (gelen kutusu) tarafı.
// Ziyaretçiler rastgele "v_..." oturum kimliğiyle yazar; burada ofisin
// tüm ziyaretçi oturumları listelenir ve yanıtlanır.
export default async function SohbetPage() {
  const session = (await getSession())!;

  const rows = await prisma.message.findMany({
    where: { tenantId: session.tenantId, sessionId: { startsWith: "v_" } },
    orderBy: { createdAt: "desc" },
    select: {
      sessionId: true,
      senderId: true,
      senderName: true,
      senderPhone: true,
      body: true,
      createdAt: true,
    },
  });

  // Ziyaretçi izi: bu sohbet oturumlarının vitrinde baktığı ilanlar + kalma süresi
  const sessionIds = [
    ...new Set(rows.map((r) => r.sessionId).filter(Boolean)),
  ] as string[];
  const trailEvents = sessionIds.length
    ? await prisma.listingEvent.findMany({
        where: {
          tenantId: session.tenantId,
          sessionId: { in: sessionIds },
          type: "VIEW",
          listingId: { not: null },
        },
        orderBy: { createdAt: "desc" },
        take: 300,
        select: {
          sessionId: true,
          listingId: true,
          durationMs: true,
          createdAt: true,
          listing: { select: { refCode: true, title: true } },
        },
      })
    : [];

  // Oturum → ilan bazında en uzun süre (aynı ilana birden çok bakışta tekilleştir)
  const trails = new Map<
    string,
    Array<{
      listingId: string;
      refCode: string;
      title: string;
      durationMs: number;
      at: Date;
    }>
  >();
  for (const e of trailEvents) {
    if (!e.sessionId || !e.listingId || !e.listing) continue;
    const list = trails.get(e.sessionId) ?? [];
    const existing = list.find((x) => x.listingId === e.listingId);
    if (existing) {
      existing.durationMs = Math.max(existing.durationMs, e.durationMs ?? 0);
    } else {
      list.push({
        listingId: e.listingId,
        refCode: e.listing.refCode,
        title: e.listing.title,
        durationMs: e.durationMs ?? 0,
        at: e.createdAt,
      });
    }
    trails.set(e.sessionId, list);
  }

  // En yeni mesaj başta olacak şekilde oturumlara indirge.
  const map = new Map<
    string,
    {
      sessionId: string;
      visitorName: string | null;
      visitorPhone: string | null;
      lastBody: string;
      lastAt: Date;
      awaitingReply: boolean;
    }
  >();
  for (const m of rows) {
    if (!m.sessionId) continue;
    if (!map.has(m.sessionId)) {
      // Sorgu "desc" sıralı geldiği için bir oturum için ilk karşılaşılan
      // satır o oturumun en son mesajıdır → senderId boşsa yanıt bekliyor demektir.
      map.set(m.sessionId, {
        sessionId: m.sessionId,
        visitorName: null,
        visitorPhone: null,
        lastBody: m.body,
        lastAt: m.createdAt,
        awaitingReply: !m.senderId,
      });
    }
    const s = map.get(m.sessionId)!;
    // Ziyaretçi adı / telefon = en yeni danışman-olmayan gönderenin bilgisi.
    if (!m.senderId) {
      if (!s.visitorName && m.senderName) s.visitorName = m.senderName;
      if (!s.visitorPhone && m.senderPhone) s.visitorPhone = m.senderPhone;
    }
  }
  const sessions = [...map.values()];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[27px] font-extrabold tracking-tight">
          İletişim Merkezi
        </h1>
        <p className="mt-1 text-sm text-ink/55">
          Vitrin ziyaretçileriyle canlı sohbet ({sessions.length} oturum) ve
          müşterilere giden e-postalar — tek yerden.
        </p>
      </div>
      <SohbetTabs
        chat={
          <VitrinInbox
            tenantId={session.tenantId}
            sessions={sessions}
            trails={Object.fromEntries(trails)}
          />
        }
        mails={<EmailCenter />}
      />
    </div>
  );
}
