"use client";

import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";

export interface TaskRow {
  id: string;
  title: string;
  note: string | null;
  status: string;
  priority: string;
  dueAt: string | null;
  assignee: { id: string; name: string } | null;
  listing: { id: string; refCode: string; title: string } | null;
}

export function TaskList({
  initialTasks,
  agents,
  currentUserId,
}: {
  initialTasks: TaskRow[];
  agents: Array<{ id: string; name: string }>;
  currentUserId: string;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");

  async function toggle(id: string, done: boolean) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: done ? "DONE" : "OPEN" }),
    });
    if (!res.ok) return;
    setTasks((ts) =>
      ts.map((t) => (t.id === id ? { ...t, status: done ? "DONE" : "OPEN" } : t)),
    );
  }

  async function addTask() {
    if (!title.trim()) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        dueAt: dueAt || undefined,
        assigneeId: currentUserId,
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
    setTitle("");
    setDueAt("");
  }

  const open = tasks.filter((t) => t.status === "OPEN");

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-xl border border-ink/15 px-3 py-2 text-sm"
          placeholder="Yeni görev…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
        />
        <input
          type="date"
          className="rounded-xl border border-ink/15 px-3 py-2 text-sm"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
        />
        <button
          onClick={addTask}
          className="btn-selvi rounded-xl px-4 py-2 text-sm font-semibold text-white"
        >
          Ekle
        </button>
      </div>

      <ul className="space-y-2">
        {open.map((t) => (
          <li
            key={t.id}
            className="flex items-start gap-3 rounded-xl border border-ink/10 bg-white px-4 py-3"
          >
            <button
              onClick={() => toggle(t.id, true)}
              className="mt-0.5 text-ink/35 hover:text-emerald-600"
              aria-label="Tamamlandı"
            >
              <Circle size={18} />
            </button>
            <div className="flex-1">
              <p className="font-medium">{t.title}</p>
              {t.dueAt && (
                <p className="text-xs text-ink/45">
                  Vade: {new Date(t.dueAt).toLocaleDateString("tr-TR")}
                </p>
              )}
              {t.listing && (
                <p className="text-xs text-brand-600">{t.listing.refCode}</p>
              )}
            </div>
            {t.assignee && (
              <span className="text-xs text-ink/40">{t.assignee.name}</span>
            )}
          </li>
        ))}
      </ul>

      {tasks.filter((t) => t.status === "DONE").length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold text-ink/50">
            Tamamlanan ({tasks.filter((t) => t.status === "DONE").length})
          </summary>
          <ul className="mt-2 space-y-1">
            {tasks
              .filter((t) => t.status === "DONE")
              .map((t) => (
                <li key={t.id} className="flex items-center gap-2 text-ink/45 line-through">
                  <CheckCircle2 size={14} className="text-emerald-500 no-underline" />
                  {t.title}
                  <button
                    onClick={() => toggle(t.id, false)}
                    className="ml-auto text-xs no-underline hover:text-brand-600"
                  >
                    Geri al
                  </button>
                </li>
              ))}
          </ul>
        </details>
      )}
    </div>
  );
}
