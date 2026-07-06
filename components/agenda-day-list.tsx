"use client";

import Link from "next/link";
import {
  Phone,
  Trash2,
  CheckCircle2,
  XCircle,
  UserX,
  RotateCcw,
  Circle,
  CheckSquare,
} from "lucide-react";
import type { AgendaItem } from "@/components/agenda";
import type { TaskRow } from "@/components/task-list";
import { dayLabelTr } from "@/lib/agenda-dates";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  SCHEDULED: { label: "Planlandı", cls: "bg-brand-50 text-brand-700" },
  DONE: { label: "Yapıldı", cls: "bg-emerald-50 text-emerald-700" },
  CANCELLED: { label: "İptal", cls: "bg-ink/[0.05] text-ink/55" },
  NO_SHOW: { label: "Gelmedi", cls: "bg-rose-50 text-rose-600" },
};

export type DayGroup = {
  key: string;
  appointments: AgendaItem[];
  tasks: TaskRow[];
};

export function AgendaDayList({
  groups,
  highlightId,
  onSetStatus,
  onRemove,
  onToggleTask,
}: {
  groups: DayGroup[];
  highlightId: string | null;
  onSetStatus: (id: string, status: string) => void;
  onRemove: (id: string) => void;
  onToggleTask: (id: string, done: boolean) => void;
}) {
  const hasAny = groups.some((g) => g.appointments.length > 0 || g.tasks.length > 0);

  if (!hasAny) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/25 bg-white/70 p-12 text-center text-sm text-ink/55">
        Bu aralıkta randevu veya görev yok. Üstten yeni ekleyebilirsiniz.
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {groups.map(({ key, appointments, tasks }) => {
        if (!appointments.length && !tasks.length) return null;
        return (
          <section key={key}>
            {key !== "undated" && (
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink/45">
                {dayLabelTr(key)}
              </h2>
            )}
            <div className="space-y-2">
              {appointments.map((a) => (
                <AppointmentCard
                  key={a.id}
                  item={a}
                  highlighted={highlightId === a.id}
                  onSetStatus={onSetStatus}
                  onRemove={onRemove}
                />
              ))}
              {tasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  highlighted={highlightId === t.id}
                  onToggle={onToggleTask}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function highlightCls(on: boolean) {
  return on ? "ring-2 ring-brand-500 ring-offset-2" : "";
}

function AppointmentCard({
  item: a,
  highlighted,
  onSetStatus,
  onRemove,
}: {
  item: AgendaItem;
  highlighted: boolean;
  onSetStatus: (id: string, status: string) => void;
  onRemove: (id: string) => void;
}) {
  const meta = STATUS_META[a.status] ?? STATUS_META.SCHEDULED;
  const past = new Date(a.startsAt).getTime() < Date.now();

  return (
    <article
      id={`agenda-${a.id}`}
      className={`flex flex-wrap items-start gap-3 rounded-2xl border border-ink/15 bg-white p-4 transition-shadow ${highlightCls(highlighted)}`}
    >
      <span className="rounded-lg bg-brand-50 px-2 py-1 font-mono text-xs font-bold text-brand-700">
        {new Date(a.startsAt).toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`font-semibold ${a.status === "CANCELLED" ? "text-ink/45 line-through" : ""}`}>
            {a.title}
          </p>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.cls}`}>
            {meta.label}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-ink/55">
          {a.contact ? (
            <Link href={`/kisiler/${a.contact.id}`} className="hover:text-brand-600">
              {a.contact.fullName}
            </Link>
          ) : (
            "—"
          )}
          {a.listing && (
            <>
              {" · "}
              <Link href={`/portfoy/${a.listing.id}`} className="hover:text-brand-600">
                <span className="font-mono text-[10px] text-ink/45">{a.listing.refCode}</span>{" "}
                {a.listing.title}
              </Link>
            </>
          )}
          {a.agent && <> · {a.agent.name}</>}
        </p>
        {a.note && <p className="mt-1 text-xs text-ink/45">{a.note}</p>}
      </div>

      <div className="flex items-center gap-1">
        {a.contact?.phone && (
          <a
            href={`tel:${a.contact.phone}`}
            className="rounded-lg p-2 text-ink/45 hover:bg-brand-50 hover:text-brand-600"
            aria-label="Ara"
          >
            <Phone size={15} />
          </a>
        )}
        {a.status === "SCHEDULED" ? (
          <>
            {past && (
              <>
                <button
                  onClick={() => onSetStatus(a.id, "DONE")}
                  className="rounded-lg p-2 text-ink/45 hover:bg-emerald-50 hover:text-emerald-600"
                  aria-label="Yapıldı"
                  title="Yapıldı"
                >
                  <CheckCircle2 size={15} />
                </button>
                <button
                  onClick={() => onSetStatus(a.id, "NO_SHOW")}
                  className="rounded-lg p-2 text-ink/45 hover:bg-rose-50 hover:text-rose-500"
                  aria-label="Gelmedi"
                  title="Gelmedi"
                >
                  <UserX size={15} />
                </button>
              </>
            )}
            <button
              onClick={() => onSetStatus(a.id, "CANCELLED")}
              className="rounded-lg p-2 text-ink/45 hover:bg-ink/[0.05]"
              aria-label="İptal"
              title="İptal"
            >
              <XCircle size={15} />
            </button>
          </>
        ) : (
          <button
            onClick={() => onSetStatus(a.id, "SCHEDULED")}
            className="rounded-lg p-2 text-ink/45 hover:bg-brand-50 hover:text-brand-600"
            aria-label="Geri al"
            title="Geri al"
          >
            <RotateCcw size={15} />
          </button>
        )}
        <button
          onClick={() => onRemove(a.id)}
          className="rounded-lg p-2 text-ink/25 hover:bg-rose-50 hover:text-rose-500"
          aria-label="Sil"
          title="Sil"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </article>
  );
}

function TaskCard({
  task: t,
  highlighted,
  onToggle,
}: {
  task: TaskRow;
  highlighted: boolean;
  onToggle: (id: string, done: boolean) => void;
}) {
  const overdue =
    t.status === "OPEN" && t.dueAt && new Date(t.dueAt).getTime() < Date.now() - 86400000;

  return (
    <article
      id={`agenda-${t.id}`}
      className={`flex items-start gap-3 rounded-2xl border bg-white p-4 transition-shadow ${
        overdue ? "border-rose-300" : "border-amber-200/80"
      } ${highlightCls(highlighted)}`}
    >
      <CheckSquare size={16} className="mt-0.5 shrink-0 text-amber-600" />
      <div className="min-w-0 flex-1">
        <p className={`font-semibold ${t.status === "DONE" ? "text-ink/45 line-through" : ""}`}>
          {t.title}
        </p>
        <p className="mt-0.5 text-xs text-ink/55">
          Görev
          {t.dueAt && (
            <> · Vade {new Date(t.dueAt).toLocaleDateString("tr-TR")}</>
          )}
          {t.assignee && <> · {t.assignee.name}</>}
          {t.listing && (
            <>
              {" · "}
              <Link href={`/portfoy/${t.listing.id}`} className="font-mono text-brand-600">
                {t.listing.refCode}
              </Link>
            </>
          )}
        </p>
      </div>
      <button
        onClick={() => onToggle(t.id, t.status !== "DONE")}
        className="rounded-lg p-2 text-ink/35 hover:text-emerald-600"
        aria-label={t.status === "DONE" ? "Geri al" : "Tamamlandı"}
      >
        {t.status === "DONE" ? <CheckCircle2 size={16} /> : <Circle size={16} />}
      </button>
    </article>
  );
}
