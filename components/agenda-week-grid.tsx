"use client";

import Link from "next/link";
import { Calendar, CheckSquare } from "lucide-react";
import type { AgendaItem } from "@/components/agenda";
import type { TaskRow } from "@/components/task-list";
import {
  addDays,
  dateKey,
  isToday,
  shortDayLabel,
  weekDays,
} from "@/lib/agenda-dates";

const STATUS_DOT: Record<string, string> = {
  SCHEDULED: "bg-brand-500",
  DONE: "bg-emerald-500",
  CANCELLED: "bg-ink/25",
  NO_SHOW: "bg-rose-500",
};

export function AgendaWeekGrid({
  weekStart,
  appointments,
  tasks,
  highlightId,
  onDayClick,
}: {
  weekStart: Date;
  appointments: AgendaItem[];
  tasks: TaskRow[];
  highlightId: string | null;
  onDayClick?: (day: Date) => void;
}) {
  const days = weekDays(weekStart);

  return (
    <div className="dash-surface overflow-hidden">
      <div className="grid grid-cols-7 border-b border-ink/[0.06] bg-ink/[0.02]">
        {days.map((day) => (
          <button
            key={dateKey(day)}
            type="button"
            onClick={() => onDayClick?.(day)}
            className={`border-r border-ink/[0.06] px-2 py-3 text-center last:border-r-0 transition ${
              isToday(day) ? "bg-brand-50/60" : "hover:bg-ink/[0.02]"
            }`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/40">
              {day.toLocaleDateString("tr-TR", { weekday: "short" })}
            </p>
            <p
              className={`mt-0.5 text-[17px] font-bold tabular-nums ${
                isToday(day) ? "text-brand-700" : "text-ink"
              }`}
            >
              {day.getDate()}
            </p>
          </button>
        ))}
      </div>

      <div className="grid min-h-[420px] grid-cols-7 divide-x divide-ink/[0.06]">
        {days.map((day) => {
          const key = dateKey(day);
          const dayAppts = appointments
            .filter((a) => dateKey(new Date(a.startsAt)) === key)
            .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
          const dayTasks = tasks
            .filter((t) => t.dueAt && dateKey(new Date(t.dueAt)) === key)
            .sort((a, b) => (a.dueAt ?? "").localeCompare(b.dueAt ?? ""));

          return (
            <div
              key={key}
              className={`flex flex-col gap-1.5 p-1.5 sm:p-2 ${isToday(day) ? "bg-brand-50/30" : ""}`}
            >
              {dayAppts.map((a) => (
                <EventBlock
                  key={a.id}
                  id={a.id}
                  highlighted={highlightId === a.id}
                  kind="appointment"
                  title={a.title}
                  time={new Date(a.startsAt).toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  subtitle={a.contact?.fullName}
                  status={a.status}
                  href={a.contact ? `/kisiler/${a.contact.id}` : undefined}
                />
              ))}
              {dayTasks.map((t) => {
                const overdue =
                  t.status === "OPEN" &&
                  t.dueAt &&
                  new Date(t.dueAt).getTime() < Date.now() - 86400000;
                return (
                  <EventBlock
                    key={t.id}
                    id={t.id}
                    highlighted={highlightId === t.id}
                    kind="task"
                    title={t.title}
                    subtitle={t.assignee?.name ?? "Görev"}
                    overdue={overdue}
                  />
                );
              })}
              {dayAppts.length === 0 && dayTasks.length === 0 && (
                <p className="hidden px-1 py-4 text-center text-[10px] text-ink/25 sm:block">—</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-ink/[0.06] px-4 py-2.5 text-[11px] text-ink/45">
        <span className="flex items-center gap-1.5">
          <Calendar size={12} className="text-brand-600" /> Randevu
        </span>
        <span className="flex items-center gap-1.5">
          <CheckSquare size={12} className="text-amber-600" /> Görev
        </span>
        <span className="ml-auto hidden sm:inline">{shortDayLabel(weekStart)} – {shortDayLabel(addDays(weekStart, 6))}</span>
      </div>
    </div>
  );
}

function EventBlock({
  id,
  highlighted,
  kind,
  title,
  time,
  subtitle,
  status,
  href,
  overdue,
}: {
  id: string;
  highlighted: boolean;
  kind: "appointment" | "task";
  title: string;
  time?: string;
  subtitle?: string;
  status?: string;
  href?: string;
  overdue?: boolean;
}) {
  const inner = (
    <>
      <div className="flex items-center gap-1">
        {kind === "appointment" && status && (
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[status] ?? STATUS_DOT.SCHEDULED}`} />
        )}
        {time && (
          <span className="font-mono text-[9px] font-bold text-ink/55">{time}</span>
        )}
      </div>
      <p className="line-clamp-2 text-[11px] font-semibold leading-tight">{title}</p>
      {subtitle && <p className="truncate text-[9px] text-ink/45">{subtitle}</p>}
    </>
  );

  const cls = `block rounded-xl border p-1.5 text-left transition-shadow ${
    kind === "appointment"
      ? "border-brand-500/15 bg-brand-50/50 hover:bg-brand-50/80"
      : overdue
        ? "border-rose-400/25 bg-rose-500/6"
        : "border-amber-500/15 bg-amber-500/6 hover:bg-amber-500/10"
  } ${highlighted ? "ring-2 ring-brand-500 ring-offset-1" : ""}`;

  return (
    <div id={`agenda-${id}`} className={cls}>
      {href ? (
        <Link href={href} className="block">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </div>
  );
}
