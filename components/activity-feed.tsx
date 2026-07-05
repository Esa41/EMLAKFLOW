import { forTenant } from "@/lib/tenant";
import { getSession } from "@/lib/auth";
import { addActivity } from "@/app/actions/activity";
import { Send } from "lucide-react";

export async function ActivityFeed({ contactId, entity }: { contactId: string, entity: string }) {
  const session = (await getSession())!;
  const db = forTenant(session.tenantId);

  const activities = await db.activity.findMany({
    where: { entityId: contactId, entity },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });

  return (
    <div className="flex h-[600px] flex-col rounded-xl border border-ink/15 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-ink/15 bg-slate-50 px-4 py-3">
        <h2 className="font-bold text-sm">Sohbet ve Not Geçmişi</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activities.length === 0 ? (
          <p className="text-center text-xs text-ink/40 mt-10">Henüz not eklenmedi.</p>
        ) : (
          activities.reverse().map(act => (
            <div key={act.id} className="rounded-lg bg-brand-50/50 p-3 text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-[11px] uppercase tracking-wider text-brand-600">
                  {act.user?.name ?? "Sistem"}
                </span>
                <span className="text-[10px] text-ink/40">
                  {act.createdAt.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-ink/80 whitespace-pre-wrap">{act.body}</p>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-ink/15 bg-slate-50 p-3">
        <form action={addActivity} className="flex gap-2">
          <input type="hidden" name="entityId" value={contactId} />
          <input type="hidden" name="entity" value={entity} />
          <textarea 
            name="body"
            placeholder="Bir not veya mesaj yazın..."
            required
            rows={1}
            className="flex-1 resize-none rounded-lg border border-ink/20 px-3 py-2 text-sm outline-none placeholder:text-ink/35 focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          />
          <button type="submit" className="flex items-center justify-center rounded-lg bg-brand-600 p-2 text-white transition-colors hover:bg-brand-700">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
