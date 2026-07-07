"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { NewAppointment, type AgendaItem, type Option } from "@/components/agenda";
import { AgendaWeekGrid } from "@/components/agenda-week-grid";
import { AgendaDayList, type DayGroup } from "@/components/agenda-day-list";
import type { TaskRow } from "@/components/task-list";
import {
  addDays,
  dateKey,
  dateKeyFromIso,
  formatWeekRange,
  isToday,
  parseDateKey,
  shortDayLabel,
  startOfWeek,
  weekDays,
} from "@/lib/agenda-dates";

type ViewMode = "week" | "list";
type ShowFilter = "all" | "appointments" | "tasks";

export function AgendaHub({
  initialAppointments,
  initialTasks,
  contacts,
  listings,
  agents,
  currentUserId,
  canFilterTeam,
  defaultAgentId,
}: {
  initialAppointments: AgendaItem[];
  initialTasks: TaskRow[];
  contacts: Option[];
  listings: Option[];
  agents: Option[];
  currentUserId: string;
  canFilterTeam: boolean;
  defaultAgentId: string;
}) {
  const searchParams = useSearchParams();
  const [appointments, setAppointments] = useState(initialAppointments);
  const [tasks, setTasks] = useState(initialTasks);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [view, setView] = useState<ViewMode>("week");
  const [showFilter, setShowFilter] = useState<ShowFilter>("all");
  const [agentId, setAgentId] = useState(defaultAgentId);
  const [listDay, setListDay] = useState(() => dateKey(new Date()));
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNewAppt, setShowNewAppt] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");

  // Mobilde varsayılan liste görünümü
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    if (mq.matches) setView("list");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Bildirim deep link: ?date= & ?id=
  useEffect(() => {
    const dateParam = searchParams.get("date");
    const idParam = searchParams.get("id");
    if (dateParam) {
      const d = parseDateKey(dateParam);
      setWeekStart(startOfWeek(d));
      setListDay(dateParam);
      if (window.matchMedia("(min-width: 769px)").matches) setView("week");
    }
    if (idParam) {
      setHighlightId(idParam);
      const t = window.setTimeout(() => setHighlightId(null), 3000);
      requestAnimationFrame(() => {
        document.getElementById(`agenda-${idParam}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
      });
      return () => window.clearTimeout(t);
    }
  }, [searchParams]);

  const filteredAppts = useMemo(() => {
    if (!canFilterTeam || agentId === "all") return appointments;
    return appointments.filter((a) => a.agent?.id === agentId);
  }, [appointments, agentId, canFilterTeam]);

  const filteredTasks = useMemo(() => {
    if (!canFilterTeam || agentId === "all") return tasks;
    return tasks.filter((t) => t.assignee?.id === agentId);
  }, [tasks, agentId, canFilterTeam]);

  const visibleAppts =
    showFilter === "tasks" ? [] : filteredAppts;
  const visibleTasks =
    showFilter === "appointments" ? [] : filteredTasks;

  const weekApptCount = useMemo(() => {
    const keys = new Set(weekDays(weekStart).map(dateKey));
    return visibleAppts.filter((a) => keys.has(dateKeyFromIso(a.startsAt))).length;
  }, [visibleAppts, weekStart]);

  const weekTaskCount = useMemo(() => {
    const keys = new Set(weekDays(weekStart).map(dateKey));
    return visibleTasks.filter((t) => t.dueAt && keys.has(dateKeyFromIso(t.dueAt))).length;
  }, [visibleTasks, weekStart]);

  const listGroups = useMemo((): DayGroup[] => {
    const map = new Map<string, DayGroup>();
    const ensure = (key: string) => {
      if (!map.has(key)) map.set(key, { key, appointments: [], tasks: [] });
      return map.get(key)!;
    };

    for (const a of visibleAppts) {
      ensure(dateKeyFromIso(a.startsAt)).appointments.push(a);
    }
    for (const t of visibleTasks) {
      if (t.dueAt) ensure(dateKeyFromIso(t.dueAt)).tasks.push(t);
    }

    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, g]) => ({
        ...g,
        appointments: g.appointments.sort((x, y) => x.startsAt.localeCompare(y.startsAt)),
      }));
  }, [visibleAppts, visibleTasks]);

  const listGroupsForDay = useMemo(() => {
    if (view !== "list" || !isMobile) return listGroups;
    const g = listGroups.find((x) => x.key === listDay);
    return g ? [g] : [{ key: listDay, appointments: [], tasks: [] }];
  }, [listGroups, listDay, view, isMobile]);

  const undatedTasks = useMemo(
    () => visibleTasks.filter((t) => !t.dueAt && t.status === "OPEN"),
    [visibleTasks],
  );

  const setStatus = useCallback(async (id: string, status: string) => {
    const prev = appointments;
    setAppointments((xs) => xs.map((x) => (x.id === id ? { ...x, status } : x)));
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setAppointments(prev);
      setError("Durum güncellenemedi.");
    }
  }, [appointments]);

  const removeAppt = useCallback(async (id: string) => {
    const prev = appointments;
    setAppointments((xs) => xs.filter((x) => x.id !== id));
    const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setAppointments(prev);
      setError("Randevu silinemedi.");
    }
  }, [appointments]);

  const toggleTask = useCallback(async (id: string, done: boolean) => {
    const prev = tasks;
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status: done ? "DONE" : "OPEN" } : t)));
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: done ? "DONE" : "OPEN" }),
    });
    if (!res.ok) setTasks(prev);
  }, [tasks]);

  async function addTask() {
    if (!taskTitle.trim()) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: taskTitle.trim(),
        dueAt: taskDue || undefined,
        assigneeId: agentId === "all" ? currentUserId : agentId,
      }),
    });
    if (!res.ok) return;
    const { task } = await res.json();
    setTasks((ts) => [
      {
        id: task.id,
        title: task.title,
        note: task.note,
        status: task.status,
        priority: task.priority,
        dueAt: task.dueAt,
        assignee: task.assignee,
        listing: task.listing,
      },
      ...ts,
    ]);
    setTaskTitle("");
    setTaskDue("");
  }

  const todayStats = useMemo(() => {
    const today = dateKey(new Date());
    const ap = visibleAppts.filter((a) => dateKeyFromIso(a.startsAt) === today).length;
    const tk = visibleTasks.filter((t) => t.dueAt && dateKeyFromIso(t.dueAt) === today).length;
    return { ap, tk };
  }, [visibleAppts, visibleTasks]);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="dash-surface flex flex-wrap items-center justify-between gap-3 p-3">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            className="rounded-xl p-2 text-ink/40 transition hover:bg-ink/[0.04] hover:text-ink/70"
            aria-label="Önceki hafta"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => {
              const now = startOfWeek(new Date());
              setWeekStart(now);
              setListDay(dateKey(new Date()));
            }}
            className="rounded-xl px-3 py-1.5 text-[13px] font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            Bugün
          </button>
          <button
            type="button"
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            className="rounded-xl p-2 text-ink/40 transition hover:bg-ink/[0.04] hover:text-ink/70"
            aria-label="Sonraki hafta"
          >
            <ChevronRight size={18} />
          </button>
          <span className="ml-2 text-[14px] font-semibold text-ink">{formatWeekRange(weekStart)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="dash-segmented">
            <button
              type="button"
              onClick={() => setView("week")}
              className={`dash-segmented-btn ${view === "week" ? "dash-segmented-btn-active" : ""}`}
            >
              Hafta
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={`dash-segmented-btn ${view === "list" ? "dash-segmented-btn-active" : ""}`}
            >
              Liste
            </button>
          </div>

          {canFilterTeam && (
            <select
              className="dash-select text-[12px]"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
            >
              <option value="all">Tüm ekip</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          )}

          <select
            className="dash-select text-[12px]"
            value={showFilter}
            onChange={(e) => setShowFilter(e.target.value as ShowFilter)}
          >
            <option value="all">Randevu + Görev</option>
            <option value="appointments">Yalnız randevu</option>
            <option value="tasks">Yalnız görev</option>
          </select>
        </div>
      </div>

      {/* Mobil hafta şeridi (liste modunda) */}
      {view === "list" && (
        <div className="flex gap-1 overflow-x-auto pb-1 md:hidden">
          {weekDays(weekStart).map((day) => {
            const key = dateKey(day);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setListDay(key)}
                className={`shrink-0 rounded-xl px-3 py-2 text-[12px] font-semibold transition ${
                  listDay === key
                    ? "bg-brand-600 text-white"
                    : isToday(day)
                      ? "bg-brand-50 text-brand-700"
                      : "bg-ink/[0.04] text-ink/55"
                }`}
              >
                {shortDayLabel(day)}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <p className="rounded-xl bg-rose-500/8 px-4 py-2.5 text-[13px] text-rose-600">{error}</p>
      )}

      {view === "week" ? (
        <AgendaWeekGrid
          weekStart={weekStart}
          appointments={visibleAppts}
          tasks={visibleTasks.filter((t) => t.status === "OPEN")}
          highlightId={highlightId}
          onDayClick={(day) => {
            setListDay(dateKey(day));
            setView("list");
          }}
        />
      ) : (
        <>
          <AgendaDayList
            groups={listGroupsForDay}
            highlightId={highlightId}
            onSetStatus={setStatus}
            onRemove={removeAppt}
            onToggleTask={toggleTask}
          />
          {undatedTasks.length > 0 && (
            <section>
              <h2 className="mb-2 text-[13px] font-semibold text-ink/45">
                Vadesiz görevler
              </h2>
              <AgendaDayList
                groups={[{ key: "undated", appointments: [], tasks: undatedTasks }]}
                highlightId={highlightId}
                onSetStatus={setStatus}
                onRemove={removeAppt}
                onToggleTask={toggleTask}
              />
            </section>
          )}
        </>
      )}

      {/* Alt bar: hızlı ekle + özet */}
      <div className="dash-surface flex flex-wrap items-end justify-between gap-4 p-4">
        <div className="text-[13px] text-ink/50">
          Bu hafta: <strong className="text-ink">{weekApptCount}</strong> randevu ·{" "}
          <strong className="text-ink">{weekTaskCount}</strong> görev
          {todayStats.ap + todayStats.tk > 0 && (
            <>
              {" "}
              · Bugün: {todayStats.ap} randevu, {todayStats.tk} görev
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {showNewAppt ? (
            <div className="w-full min-w-[280px] max-w-lg">
              <NewAppointment
                contacts={contacts}
                listings={listings}
                agents={agents}
                currentUserId={currentUserId}
                defaultOpen
                onClose={() => setShowNewAppt(false)}
                onCreated={(a) => {
                  setAppointments((xs) =>
                    [...xs, a].sort((p, q) => p.startsAt.localeCompare(q.startsAt)),
                  );
                  setShowNewAppt(false);
                }}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowNewAppt(true)}
              className="dash-btn-primary"
            >
              <Plus size={15} /> Randevu
            </button>
          )}

          <input
            className="dash-input w-auto min-w-[140px]"
            placeholder="Yeni görev…"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />
          <input
            type="date"
            className="dash-input w-auto"
            value={taskDue}
            onChange={(e) => setTaskDue(e.target.value)}
          />
          <button
            type="button"
            onClick={addTask}
            className="dash-btn-secondary"
          >
            Görev ekle
          </button>
        </div>
      </div>
    </div>
  );
}
