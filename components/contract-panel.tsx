"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  FileText,
  Upload,
  Trash2,
  Loader2,
  ExternalLink,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { CONTRACT_TYPE_TR } from "@/lib/labels";

type ContractType =
  | "AUTHORIZATION"
  | "VIEWING_FORM"
  | "SALE_CONTRACT"
  | "RENT_CONTRACT";

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
  expiresAt: string | null;
  createdAt: string;
  listing: { refCode: string; title: string } | null;
  contact: { fullName: string; phone: string | null } | null;
  deal: { id: string; stage: string } | null;
};

export interface ContractPanelProps {
  scope: { listingId?: string; contactId?: string; dealId?: string };
  contactOptions?: Array<{ id: string; fullName: string; phone: string | null }>;
  listingLabel?: string;
  /** Müşteri adı — scope.contactId varken başlıkta gösterilir */
  contactLabel?: string;
}

export function ContractPanel({
  scope,
  contactOptions,
  listingLabel,
  contactLabel,
}: ContractPanelProps) {
  const [type, setType] = useState<ContractType>("AUTHORIZATION");
  const [contactId, setContactId] = useState(
    scope.contactId ?? contactOptions?.[0]?.id ?? "",
  );
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState<ContractType>("AUTHORIZATION");
  const [editSignedAt, setEditSignedAt] = useState("");
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceFileRef = useRef<HTMLInputElement>(null);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);

  const effectiveContactId = scope.contactId ?? contactId;
  const hasCustomer = !!effectiveContactId;

  const query = new URLSearchParams();
  if (scope.listingId) query.set("listingId", scope.listingId);
  if (effectiveContactId) query.set("contactId", effectiveContactId);
  if (scope.dealId) query.set("dealId", scope.dealId);

  const load = useCallback(() => {
    if (!effectiveContactId && !scope.listingId && !scope.dealId) {
      setContracts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/contracts?${query.toString()}`)
      .then((r) => r.json())
      .then((d) => setContracts(Array.isArray(d.contracts) ? d.contracts : []))
      .catch(() => setError("Sözleşmeler yüklenemedi."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveContactId, scope.listingId, scope.dealId]);

  useEffect(() => {
    load();
  }, [load]);

  function draftUrl() {
    const q = new URLSearchParams({ type, contactId: effectiveContactId });
    if (scope.listingId) q.set("listingId", scope.listingId);
    if (scope.dealId) q.set("dealId", scope.dealId);
    return `/api/contracts/draft?${q.toString()}`;
  }

  function handleDraft() {
    if (!hasCustomer) {
      setError("Taslak için önce müşteri seçin.");
      return;
    }
    setError(null);
    window.open(draftUrl(), "_blank");
  }

  async function uploadFile(file: File, meta: {
    contactId: string;
    contractId?: string;
  }) {
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

    const put = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!put.ok) throw new Error("Dosya yüklenemedi.");

    if (meta.contractId) {
      const patch = await fetch(`/api/contracts/${meta.contractId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileKey: key,
          signedAt: new Date().toISOString(),
        }),
      });
      if (!patch.ok) throw new Error("Belge güncellenemedi.");
    } else {
      const reg = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          contactId: meta.contactId,
          listingId: scope.listingId,
          dealId: scope.dealId,
          fileKey: key,
          signedAt: new Date().toISOString(),
        }),
      });
      if (!reg.ok) throw new Error("Sözleşme kaydedilemedi.");
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    if (!hasCustomer) {
      setError("Yükleme için önce müşteri seçin.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      await uploadFile(files[0], { contactId: effectiveContactId });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yükleme başarısız.");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleReplaceFile(files: FileList | null) {
    if (!files?.length || !replaceTargetId) return;
    setUploading(true);
    setError(null);
    try {
      await uploadFile(files[0], {
        contactId: effectiveContactId,
        contractId: replaceTargetId,
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Belge değiştirilemedi.");
    }
    setUploading(false);
    setReplaceTargetId(null);
    if (replaceFileRef.current) replaceFileRef.current.value = "";
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

  function startEdit(c: ContractRow) {
    setEditingId(c.id);
    setEditType(c.type);
    setEditSignedAt(c.signedAt ? c.signedAt.slice(0, 10) : "");
    setEditExpiresAt(c.expiresAt ? c.expiresAt.slice(0, 10) : "");
  }

  async function saveEdit(id: string) {
    setSavingEdit(true);
    setError(null);
    const res = await fetch(`/api/contracts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: editType,
        signedAt: editSignedAt || null,
        expiresAt: editExpiresAt || null,
      }),
    });
    setSavingEdit(false);
    if (!res.ok) {
      setError("Sözleşme güncellenemedi.");
      return;
    }
    setEditingId(null);
    load();
  }

  return (
    <div className="dash-surface space-y-4 p-5">
      <div>
        <h3 className="dash-section-title flex items-center gap-2">
          <FileText size={16} className="text-brand-600" /> Sözleşmeler
        </h3>
        {contactLabel && (
          <p className="mt-1 text-[13px] text-ink/50">{contactLabel}</p>
        )}
        {listingLabel && (
          <p className="mt-0.5 text-[12px] text-ink/40">{listingLabel}</p>
        )}
      </div>

      {/* Müşteri seçimi — yalnızca scope'ta sabit değilse */}
      {!scope.contactId && contactOptions && contactOptions.length > 0 && (
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-ink/50">
            1. Müşteri seçin
          </label>
          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className="dash-select max-w-sm"
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

      {!hasCustomer ? (
        <div className="dash-empty py-8 text-[13px]">
          Sözleşme yüklemek veya taslak oluşturmak için önce bir müşteri seçin.
        </div>
      ) : (
        <>
          <div>
            <label className="mb-2 block text-[12px] font-medium text-ink/50">
              2. Sözleşme türü
            </label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`dash-filter-pill ${type === t ? "dash-filter-pill-active" : ""}`}
                >
                  {CONTRACT_TYPE_TR[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={handleDraft} className="dash-btn-secondary">
              <FileText size={15} /> Taslak oluştur
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="dash-btn-primary"
            >
              {uploading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Upload size={15} />
              )}
              {uploading ? "Yükleniyor…" : "İmzalı belge yükle"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              hidden
              onChange={(e) => handleUpload(e.target.files)}
            />
          </div>
          <p className="text-[12px] text-ink/40">
            Taslak yeni sekmede açılır — yazdırıp imzaladıktan sonra buradan
            yükleyin.
          </p>
        </>
      )}

      {error && (
        <p className="rounded-xl bg-rose-500/8 px-4 py-2 text-[13px] text-rose-600">
          {error}
        </p>
      )}

      <input
        ref={replaceFileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        hidden
        onChange={(e) => handleReplaceFile(e.target.files)}
      />

      <div className="border-t border-ink/[0.06] pt-3">
        {loading ? (
          <p className="py-4 text-[13px] text-ink/40">Yükleniyor…</p>
        ) : contracts.length === 0 ? (
          <p className="py-4 text-[13px] text-ink/40">
            {hasCustomer ? "Bu müşteri için henüz sözleşme yok." : ""}
          </p>
        ) : (
          <ul className="space-y-2">
            {contracts.map((c) => (
              <li
                key={c.id}
                className="rounded-xl bg-ink/[0.02] p-3 ring-1 ring-inset ring-ink/[0.04]"
              >
                {editingId === c.id ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {TYPES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setEditType(t)}
                          className={`dash-filter-pill text-[12px] ${editType === t ? "dash-filter-pill-active" : ""}`}
                        >
                          {CONTRACT_TYPE_TR[t]}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <label className="text-[12px] text-ink/50">
                        İmza tarihi
                        <input
                          type="date"
                          value={editSignedAt}
                          onChange={(e) => setEditSignedAt(e.target.value)}
                          className="dash-input mt-1 block"
                        />
                      </label>
                      {editType === "AUTHORIZATION" && (
                        <label className="text-[12px] text-ink/50">
                          Bitiş tarihi
                          <input
                            type="date"
                            value={editExpiresAt}
                            onChange={(e) => setEditExpiresAt(e.target.value)}
                            className="dash-input mt-1 block"
                          />
                        </label>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => saveEdit(c.id)}
                        disabled={savingEdit}
                        className="dash-btn-primary text-[12px]"
                      >
                        <Check size={14} /> {savingEdit ? "…" : "Kaydet"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="dash-btn-secondary text-[12px]"
                      >
                        <X size={14} /> Vazgeç
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold">
                        {CONTRACT_TYPE_TR[c.type]}
                        {c.listing && (
                          <span className="ml-2 text-[10px] text-ink/35">
                            {c.listing.refCode}
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-[12px] text-ink/45">
                        {c.signedAt ? (
                          <span className="text-emerald-700">
                            İmzalandı ·{" "}
                            {new Date(c.signedAt).toLocaleDateString("tr-TR")}
                          </span>
                        ) : (
                          <span className="text-amber-700">Taslak — belge bekleniyor</span>
                        )}
                        {c.expiresAt && (
                          <>
                            {" "}
                            · Bitiş{" "}
                            {new Date(c.expiresAt).toLocaleDateString("tr-TR")}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {c.fileUrl ? (
                        <a
                          href={c.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg p-2 text-ink/40 hover:bg-ink/[0.05] hover:text-brand-600"
                          title="Görüntüle"
                        >
                          <ExternalLink size={15} />
                        </a>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => startEdit(c)}
                        className="rounded-lg p-2 text-ink/40 hover:bg-ink/[0.05] hover:text-ink/70"
                        title="Düzenle"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReplaceTargetId(c.id);
                          replaceFileRef.current?.click();
                        }}
                        className="rounded-lg p-2 text-ink/40 hover:bg-ink/[0.05] hover:text-brand-600"
                        title="Belgeyi değiştir"
                      >
                        <Upload size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="rounded-lg p-2 text-ink/30 hover:bg-rose-500/8 hover:text-rose-600"
                        title="Sil"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
