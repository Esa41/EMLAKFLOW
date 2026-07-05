import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VitrinInbox } from "@/components/vitrin-inbox";

// Vitrin ziyaretçileriyle canlı sohbet — ajan (gelen kutusu) tarafı.
// Ziyaretçiler rastgele "v_..." oturum kimliğiyle yazar; burada ofisin
// tüm ziyaretçi oturumları listelenir ve yanıtlanır.
export default async function SohbetPage() {
  const session = (await getSession())!;

  const rows = await prisma.message.findMany({
    where: { tenantId: session.tenantId, sessionId: { startsWith: "v_" } },
    orderBy: { createdAt: "desc" },
    select: { sessionId: true, senderId: true, senderName: true, body: true, createdAt: true },
  });

  // En yeni mesaj başta olacak şekilde oturumlara indirge.
  const map = new Map<
    string,
    { sessionId: string; visitorName: string | null; lastBody: string; lastAt: Date }
  >();
  for (const m of rows) {
    if (!m.sessionId) continue;
    if (!map.has(m.sessionId)) {
      map.set(m.sessionId, {
        sessionId: m.sessionId,
        visitorName: null,
        lastBody: m.body,
        lastAt: m.createdAt,
      });
    }
    const s = map.get(m.sessionId)!;
    // Ziyaretçi adı = en yeni danışman-olmayan gönderenin adı.
    if (!s.visitorName && !m.senderId && m.senderName) s.visitorName = m.senderName;
  }
  const sessions = [...map.values()];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[27px] font-extrabold tracking-tight">Vitrin Sohbetleri</h1>
        <p className="mt-1 text-sm text-ink/55">
          Vitrininizi gezen ziyaretçilerden gelen canlı destek mesajları — {sessions.length} oturum.
        </p>
      </div>
      <VitrinInbox tenantId={session.tenantId} sessions={sessions} />
    </div>
  );
}
