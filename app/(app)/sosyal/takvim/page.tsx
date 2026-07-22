import { getSession } from "@/lib/auth";
import { forTenant } from "@/lib/tenant";
import Link from "next/link";

export default async function TakvimPage() {
  const session = (await getSession())!;
  const db = forTenant(session.tenantId);

  const items = await db.calendarItem.findMany({
    orderBy: { scheduledAt: "asc" },
    take: 100,
    include: {
      asset: {
        select: {
          id: true,
          headline: true,
          caption: true,
          listing: { select: { refCode: true, title: true } },
        },
      },
    },
  });

  const byDay = new Map<string, typeof items>();
  for (const item of items) {
    const key = item.scheduledAt.toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const list = byDay.get(key) ?? [];
    list.push(item);
    byDay.set(key, list);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink/55">
          Zamanlanmış içerik kuyruğu. Sürükle-bırak takvim bir sonraki sürümde.
        </p>
        <Link
          href="/sosyal/planlayici"
          className="text-[13px] font-semibold text-brand-600 hover:underline"
        >
          İçerik üret
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 px-5 py-10 text-center text-sm text-ink/45">
          Henüz zamanlanmış içerik yok.
        </div>
      ) : (
        <div className="space-y-5">
          {[...byDay.entries()].map(([day, dayItems]) => (
            <section key={day}>
              <h2 className="mb-2 text-[12px] font-bold uppercase tracking-wide text-ink/40">
                {day}
              </h2>
              <ul className="space-y-2">
                {dayItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-ink/10 bg-[var(--app-surface)] px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {item.asset?.headline || "İçerik"}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-ink/45">
                        {item.platform} · {item.status}
                        {item.asset?.listing
                          ? ` · ${item.asset.listing.refCode}`
                          : ""}
                      </p>
                      {item.asset?.caption && (
                        <p className="mt-1 line-clamp-2 text-[13px] text-ink/60">
                          {item.asset.caption}
                        </p>
                      )}
                    </div>
                    <time className="shrink-0 text-[12px] font-medium text-ink/45">
                      {item.scheduledAt.toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
