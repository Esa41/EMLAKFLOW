"use client";

import { useState } from "react";
import { Plus, Building2, Handshake, Copy, Check } from "lucide-react";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  _count: { listings: number; deals: number };
}

const ROLE_TR: Record<string, string> = {
  OWNER: "Ofis Sahibi",
  BROKER: "Broker",
  AGENT: "Danışman",
  ASSISTANT: "Asistan",
};
const ROLE_BADGE: Record<string, string> = {
  OWNER: "bg-brand-50 text-brand-700",
  BROKER: "bg-violet-50 text-violet-700",
  AGENT: "bg-emerald-50 text-emerald-700",
  ASSISTANT: "bg-ink/[0.05] text-ink/65",
};

const sel =
  "rounded-xl border border-ink/20 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/40 disabled:bg-ink/[0.04] disabled:text-ink/45";

export function TeamManager({
  initialUsers,
  isOwner,
  currentUserId,
}: {
  initialUsers: TeamMember[];
  isOwner: boolean;
  currentUserId: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [error, setError] = useState<string | null>(null);

  async function patch(id: string, data: Record<string, unknown>) {
    setError(null);
    const res = await fetch(`/api/team/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "Güncellenemedi.");
      return;
    }
    setUsers((xs) => xs.map((u) => (u.id === id ? body.user : u)));
  }

  return (
    <div className="max-w-3xl space-y-6">
      {isOwner && (
        <AddMember onAdded={(u) => setUsers((xs) => [...xs, u])} />
      )}
      {!isOwner && (
        <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          Ekip düzenlemeyi yalnız ofis sahibi yapabilir — görüntüleme modundasın.
        </p>
      )}

      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">{error}</p>
      )}

      <div className="space-y-3">
        {users.map((u) => (
          <article
            key={u.id}
            className={`flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 border border-ink/15 ${
              !u.isActive ? "opacity-60" : ""
            }`}
          >
            <div className="btn-selvi flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white">
              {u.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{u.name}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_BADGE[u.role]}`}>
                  {ROLE_TR[u.role]}
                </span>
                {u.id === currentUserId && (
                  <span className="rounded-full bg-ink/[0.05] px-2 py-0.5 text-[10px] font-semibold text-ink/55">
                    sen
                  </span>
                )}
                {!u.isActive && (
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
                    pasif
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-xs text-ink/55">
                {u.email}
                {u.phone && ` · ${u.phone}`}
              </p>
              <p className="mt-1 flex items-center gap-3 text-xs text-ink/45">
                <span className="flex items-center gap-1">
                  <Building2 size={12} /> {u._count.listings} aktif ilan
                </span>
                <span className="flex items-center gap-1">
                  <Handshake size={12} /> {u._count.deals} açık fırsat
                </span>
              </p>
            </div>

            {isOwner && (
              <div className="flex items-center gap-2">
                <select
                  className={sel}
                  value={u.role}
                  onChange={(e) => patch(u.id, { role: e.target.value })}
                >
                  {Object.entries(ROLE_TR).map(([k, l]) => (
                    <option key={k} value={k}>{l}</option>
                  ))}
                </select>
                <button
                  onClick={() => patch(u.id, { isActive: !u.isActive })}
                  disabled={u.id === currentUserId}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-40 ${
                    u.isActive
                      ? "bg-white text-rose-500 ring-1 ring-rose-200 hover:bg-rose-50"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  {u.isActive ? "Pasife al" : "Aktifleştir"}
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

// ── Üye ekleme formu ──
function AddMember({ onAdded }: { onAdded: (u: TeamMember) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("AGENT");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function generatePassword() {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
    const arr = new Uint32Array(10);
    crypto.getRandomValues(arr);
    setPassword([...arr].map((n) => chars[n % chars.length]).join(""));
  }

  async function copyPassword() {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function create() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, role, password }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Eklenemedi.");
      return;
    }
    onAdded(data.user);
    setOpen(false);
    setName(""); setEmail(""); setPhone(""); setPassword(""); setRole("AGENT");
  }

  const input =
    "w-full rounded-xl border border-ink/20 bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/40";

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); generatePassword(); }}
        className="btn-selvi flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
      >
        <Plus size={16} /> Danışman ekle
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl bg-white p-5 border border-ink/15">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input className={input} placeholder="Ad Soyad *" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={input} type="email" placeholder="E-posta *" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={input} placeholder="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <select className={input} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="AGENT">Danışman</option>
          <option value="BROKER">Broker</option>
          <option value="ASSISTANT">Asistan</option>
          <option value="OWNER">Ofis Sahibi</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink/65">
          Geçici şifre (danışmana ilet)
        </label>
        <div className="flex gap-2">
          <input className={`${input} font-mono`} value={password} onChange={(e) => setPassword(e.target.value)} />
          <button
            onClick={copyPassword}
            className="shrink-0 rounded-xl bg-white px-3 text-ink/55 ring-1 ring-ink/20 hover:bg-ink/[0.04]"
            aria-label="Şifreyi kopyala"
          >
            {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-600">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={create}
          disabled={saving || !name || !email || password.length < 8}
          className="btn-selvi rounded-xl px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Ekleniyor…" : "Ekle"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-xl bg-ink/[0.05] px-5 py-2 text-sm font-semibold text-ink/65"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}
