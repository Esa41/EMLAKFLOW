"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { FileText, Upload, Trash2, Loader2, ExternalLink } from "lucide-react";
import { CONTRACT_TYPE_TR } from "@/lib/labels";

type ContractType =
  "AUTHORIZATION" | "VIEWING_FORM" | "SALE_CONTRACT" | "RENT_CONTRACT";

const TYPES: ContractType[] = [
  "AUTHORIZATION",
  "VIEWING_FORM",
  "SALE_CONTRACT",
  "RENT_CONTRACT",
];

type ContractRow = {
  id: string;
  type: ContractType;
  fileUrl: string | null;
  signedAt: string | null;
  createdAt: string;
  listing: { refCode: string; title: string } | null;
  contact: { fullName: string; phone: string | null } | null;
  deal: { id: string; stage: string } | null;
};

export interface ContractPanelProps {
  scope: { listingId?: string; contactId?: string; dealId?: string };
  /** contactId scope'ta yoksa gösterilecek müşteri seçim listesi */
  contactOptions?: Array<{
    id: string;
    fullName: string;
    phone: string | null;
  }>;
  /** listingId varsa gösterim için ("EF-2026-0012 — Park Oran 3+1" gibi) */
  listingLabel?: string;
}

const btnBase =
  "rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 disabled:opacity-50";

export function ContractPanel({
  scope,
  contactOptions,
  listingLabel,
}: ContractPanelProps) {
  const [type, setType] = useState<ContractType>("AUTHORIZATION");
  const [contactId, setContactId] = useState(
    scope.contactId ?? contactOptions?.[0]?.id ?? "",
  );
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const query = new URLSearchParams();
  if (scope.listingId) query.set("listingId", scope.listingId);
  if (scope.contactId) query.set("contactId", scope.contactId);
  if (scope.dealId) query.set("dealId", scope.dealId);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/contracts?${query.toString()}`)
      .then((r) => r.json())
      .then((d) => setContracts(Array.isArray(d.contracts) ? d.contracts : []))
      .catch(() => setError("Sözleşmeler yüklenemedi."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope.listingId, scope.contactId, scope.dealId]);

  useEffect(() => {
    load();
  }, [load]);

  function draftUrl() {
    const q = new URLSearchParams({ type, contactId });
    if (scope.listingId) q.set("listingId", scope.listingId);
    if (scope.dealId) q.set("dealId", scope.dealId);
    return `/api/contracts/draft?${q.toString()}`;
  }

  function handleDraft() {
    if (!contactId) {
      setError("Taslak oluşturmak için önce müşteri seçin.");
      return;
    }
    setError(null);
    window.open(draftUrl(), "_blank");
  }

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    if (!contactId) {
      setError("Belge yüklemek için önce müşteri seçin.");
      return;
    }
    const file = files[0];
    setUploading(true);
    setError(null);

    try {
      // 1. Presigned URL al
      const presign = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          folder: "contracts",
        }),
      });
      if (!presign.ok) {
        const d = await presign.json().catch(() => ({}));
        throw new Error(d.error ?? "Yükleme URL'si alınamadı.");
      }
      const { uploadUrl, key } = await presign.json();

      // 2. Doğrudan R2'ye PUT
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) throw new Error("Dosya R2'ye yüklenemedi.");

      // 3. Sözleşme kaydını oluştur — fileUrl sunucuda fileKey'den türetilir
      const reg = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          contactId,
          listingId: scope.listingId,
          dealId: scope.dealId,
          fileKey: key,
          signedAt: new Date().toISOString(),
        }),
      });
      if (!reg.ok) throw new Error("Sözleşme kaydedilemedi.");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yükleme başarısız.");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleDelete(id: string) {
    const prev = contracts;
    setContracts((c) => c.filter((x) => x.id !== id));
    const res = await fetch(`/api/contracts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setContracts(prev);
      setError("Sözleşme silinemedi.");
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-ink/15 bg-white p-5">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink/45">
          <FileText size={15} /> Sözleşmeler
        </h3>
        {listingLabel && (
          <p className="mt-1 text-xs text-ink/50">{listingLabel}</p>
        )}
      </div>

      {/* Tip seçici */}
      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`${btnBase} ${
              type === t
                ? "bg-brand-600 text-white"
                : "bg-white text-ink/65 ring-1 ring-ink/20 hover:bg-ink/[0.04]"
            }`}
          >
            {CONTRACT_TYPE_TR[t]}
          </button>
        ))}
      </div>

      {/* Müşteri seçici — scope'ta contactId sabitlenmemişse */}
      {!scope.contactId && contactOptions && contactOptions.length > 0 && (
        <div>
          <label className="mb-1 block text-xs font-medium text-ink/55">
            Müşteri
          </label>
          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className="w-full max-w-sm rounded-xl border border-ink/20 bg-white px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            <option value="">Müşteri seçin…</option>
            {contactOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
                {c.phone ? ` — ${c.phone}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Eylemler */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleDraft}
          className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-700"
        >
          <FileText size={16} /> Taslak Oluştur
        </button>

        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 rounded-xl border border-ink/20 bg-white px-4 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:border-ink/50 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
        >
          {uploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Upload size={16} />
          )}
          {uploading ? "Yükleniyor…" : "İmzalı Belgeyi Yükle"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          hidden
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>
      <p className="text-xs text-ink/45">
        "Taslak Oluştur" seçilen bilgilerle otomatik dolmuş sözleşmeyi yeni
        sekmede açar — Ctrl/Cmd+P ile PDF'e çevirip yazdırabilirsiniz.
      </p>

      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-600">
          {error}
        </p>
      )}

      {/* Mevcut sözleşmeler listesi */}
      <div className="divide-y divide-ink/[0.06] border-t border-ink/10 pt-2">
        {loading ? (
          <p className="py-4 text-sm text-ink/45">Yükleniyor…</p>
        ) : contracts.length === 0 ? (
          <p className="py-4 text-sm text-ink/45">Henüz sözleşme kaydı yok.</p>
        ) : (
          contracts.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {CONTRACT_TYPE_TR[c.type]}
                  {c.listing && (
                    <span className="ml-2 font-mono text-[10px] text-ink/45">
                      {c.listing.refCode}
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-ink/55">
                  {c.contact?.fullName ?? "Müşteri belirtilmemiş"}
                  {" · "}
                  {c.signedAt ? (
                    <span className="text-emerald-700">
                      İmzalandı ·{" "}
                      {new Date(c.signedAt).toLocaleDateString("tr-TR")}
                    </span>
                  ) : (
                    <span className="text-amber-700">Taslak</span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {c.fileUrl ? (
                  <a
                    href={c.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 rounded-lg bg-ink/[0.04] px-2.5 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/[0.08]"
                  >
                    <ExternalLink size={13} /> Görüntüle
                  </a>
                ) : (
                  <span className="text-xs text-ink/40">Belge yok</span>
                )}
                <button
                  onClick={() => handleDelete(c.id)}
                  className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-400"
                  aria-label="Sözleşmeyi sil"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
