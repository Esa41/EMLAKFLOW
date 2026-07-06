"use client";

import { useState } from "react";
import Link from "next/link";
import { Instagram, Plus, ExternalLink } from "lucide-react";

export interface SocialPostRow {
  id: string;
  platform: string;
  url: string;
  kind: string;
  caption: string | null;
  views: number;
  likes: number;
  comments: number;
  reach: number;
  publishedAt: string | null;
  listing: { id: string; refCode: string; title: string } | null;
}

export function SocialContentPanel({
  initialPosts,
  listings,
  accounts,
  connected,
  error,
}: {
  initialPosts: SocialPostRow[];
  listings: Array<{ id: string; refCode: string; title: string }>;
  accounts: Array<{ id: string; platform: string; username: string | null }>;
  connected?: boolean;
  error?: string | null;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [form, setForm] = useState({ url: "", caption: "", listingId: "" });
  const [connecting, setConnecting] = useState(false);

  async function connectInstagram() {
    setConnecting(true);
    const res = await fetch("/api/social/connect");
    const data = await res.json();
    setConnecting(false);
    if (data.url) window.location.href = data.url;
  }

  async function addManual() {
    if (!form.url.trim()) return;
    const res = await fetch("/api/social/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: form.url,
        caption: form.caption || undefined,
        listingId: form.listingId || undefined,
        kind: "video",
      }),
    });
    if (!res.ok) return;
    const { post } = await res.json();
    setPosts((ps) => [
      {
        id: post.id,
        platform: post.platform,
        url: post.url,
        kind: post.kind,
        caption: post.caption,
        views: post.views ?? 0,
        likes: post.likes ?? 0,
        comments: post.comments ?? 0,
        reach: post.reach ?? 0,
        publishedAt: post.publishedAt,
        listing: post.listing,
      },
      ...ps,
    ]);
    setForm({ url: "", caption: "", listingId: "" });
  }

  async function linkListing(postId: string, listingId: string) {
    const res = await fetch(`/api/social/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: listingId || null }),
    });
    if (!res.ok) return;
    const { post } = await res.json();
    setPosts((ps) =>
      ps.map((p) =>
        p.id === postId ? { ...p, listing: post.listing } : p,
      ),
    );
  }

  return (
    <div className="space-y-6">
      {connected && (
        <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          Instagram hesabı bağlandı.
        </p>
      )}
      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
          Bağlantı hatası: {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-ink/55">
          {accounts.length > 0 ? (
            accounts.map((a) => (
              <span key={a.id} className="mr-3 font-semibold text-ink/70">
                @{a.username ?? a.platform}
              </span>
            ))
          ) : (
            "Henüz bağlı sosyal hesap yok."
          )}
        </div>
        <button
          onClick={connectInstagram}
          disabled={connecting}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Instagram size={16} />
          {connecting ? "Yönlendiriliyor…" : "Instagram bağla"}
        </button>
      </div>

      <div className="rounded-2xl border border-ink/15 bg-white p-5 space-y-3">
        <h2 className="text-sm font-bold">Video / içerik ekle</h2>
        <input
          className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
          placeholder="Instagram / TikTok / YouTube linki"
          value={form.url}
          onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
        />
        <input
          className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
          placeholder="Açıklama (opsiyonel)"
          value={form.caption}
          onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
        />
        <select
          className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
          value={form.listingId}
          onChange={(e) => setForm((f) => ({ ...f, listingId: e.target.value }))}
        >
          <option value="">İlan/araç bağla (opsiyonel)</option>
          {listings.map((l) => (
            <option key={l.id} value={l.id}>{l.refCode} — {l.title}</option>
          ))}
        </select>
        <button
          onClick={addManual}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus size={16} /> Ekle
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <div key={p.id} className="rounded-xl border border-ink/15 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <span className="rounded bg-ink/[0.06] px-2 py-0.5 text-[10px] font-bold uppercase text-ink/50">
                {p.platform}
              </span>
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink/40 hover:text-brand-600"
              >
                <ExternalLink size={14} />
              </a>
            </div>
            <p className="mt-2 line-clamp-2 text-sm font-medium">
              {p.caption ?? p.url}
            </p>
            <div className="mt-3 grid grid-cols-4 gap-1 text-center text-[10px]">
              <div>
                <p className="font-bold text-ink">{p.views.toLocaleString("tr-TR")}</p>
                <p className="text-ink/40">İzlenme</p>
              </div>
              <div>
                <p className="font-bold text-ink">{p.likes.toLocaleString("tr-TR")}</p>
                <p className="text-ink/40">Beğeni</p>
              </div>
              <div>
                <p className="font-bold text-ink">{p.comments.toLocaleString("tr-TR")}</p>
                <p className="text-ink/40">Yorum</p>
              </div>
              <div>
                <p className="font-bold text-ink">{p.reach.toLocaleString("tr-TR")}</p>
                <p className="text-ink/40">Erişim</p>
              </div>
            </div>
            <select
              className="mt-3 w-full rounded-lg border border-ink/10 px-2 py-1.5 text-xs"
              value={p.listing?.id ?? ""}
              onChange={(e) => linkListing(p.id, e.target.value)}
            >
              <option value="">İlan bağlantısı yok</option>
              {listings.map((l) => (
                <option key={l.id} value={l.id}>{l.refCode}</option>
              ))}
            </select>
            {p.listing && (
              <Link
                href={`/portfoy/${p.listing.id}`}
                className="mt-1 block text-xs font-semibold text-brand-600 hover:underline"
              >
                {p.listing.refCode} — {p.listing.title}
              </Link>
            )}
          </div>
        ))}
      </div>
      {posts.length === 0 && (
        <p className="rounded-xl border border-dashed border-ink/20 py-12 text-center text-sm text-ink/45">
          Paylaştığınız videoları buradan takip edin.
        </p>
      )}
    </div>
  );
}
