"use client";

import { useState } from "react";
import { trMoney } from "@/lib/labels";
import { paymentStatus } from "@/lib/rentals";

export interface RentalRow {
  id: string;
  title: string;
  status: string;
  period: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  paymentDueDay: number;
  contact: { id: string; fullName: string; phone: string | null };
  listing: { id: string; refCode: string; title: string } | null;
  payments: Array<{
    id: string;
    periodLabel: string;
    dueDate: string;
    amount: number;
    paidAt: string | null;
  }>;
  /** Taranmış/imzalı belgeler — Contract kayıtları */
  contracts?: Array<{
    id: string;
    fileUrl: string | null;
    fileName: string | null;
    type: string;
  }>;
}

const STATUS_BADGE: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700",
  OVERDUE: "bg-rose-50 text-rose-700",
  UPCOMING: "bg-amber-50 text-amber-800",
  DUE: "bg-slate-100 text-slate-600",
};

const STATUS_TR: Record<string, string> = {
  PAID: "Ödendi",
  OVERDUE: "Gecikti",
  UPCOMING: "Yaklaşıyor",
  DUE: "Bekliyor",
};


/** Etiketli alan sarmalayıcı — eski formda yalnız placeholder vardı, alan
    doldurulunca ne olduğu anlaşılmıyordu (tarih kutuları özellikle). */
function Field({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="flex items-baseline gap-1.5 text-[12px] font-semibold text-ink/60">
        {label}
        {required && <span className="text-[--color-danger]">*</span>}
        {hint && <span className="font-normal text-ink/35">· {hint}</span>}
      </span>
      {children}
      {error && (
        <span className="block text-[12px] font-medium text-[--color-danger]">
          {error}
        </span>
      )}
    </label>
  );
}

function inputCls(error?: string) {
  return `w-full rounded-xl border px-3 py-2 text-sm ${
    error ? "border-[--color-danger]" : "border-ink/15"
  }`;
}

export function RentalManager({
  initial,
  contacts,
  listings,
  labels,
}: {
  initial: RentalRow[];
  contacts: Array<{ id: string; fullName: string }>;
  listings: Array<{ id: string; refCode: string; title: string }>;
  labels: { rentals: string; listing: string };
}) {
  const [rows, setRows] = useState(initial);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const EMPTY_FORM = {
    title: "",
    contactId: "",
    listingId: "",
    propertyAddress: "",
    startDate: "",
    endDate: "",
    rentAmount: "",
    paymentDueDay: "1",
    deposit: "",
    increaseRate: "",
    ownerName: "",
    ownerNationalId: "",
    note: "",
  };
  const EMPTY_NEW_CONTACT = { fullName: "", phone: "", nationalId: "", address: "" };

  const [form, setForm] = useState(EMPTY_FORM);
  /* Kiracı: mevcut kişiden seç ya da burada yenisini oluştur. Emlakçı
     sözleşme keserken "Müşteriler"e gidip geri dönmek zorunda kalmasın. */
  const [contactMode, setContactMode] = useState<"existing" | "new">("existing");
  const [newContact, setNewContact] = useState(EMPTY_NEW_CONTACT);
  const [contractFile, setContractFile] = useState<{
    url: string;
    key: string;
    name: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /* Alan bazlı hatalar — API artık hangi alanın eksik olduğunu söylüyor */
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function currentMonthPayment(payments: RentalRow["payments"]) {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return (
      payments.find((p) => p.periodLabel === key) ??
      payments.find((p) => !p.paidAt && new Date(p.dueDate) >= now)
    );
  }

  async function markPaid(paymentId: string, agreementId: string) {
    const res = await fetch(`/api/rentals/${agreementId}/payments/${paymentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paidAt: new Date().toISOString(), method: "nakit" }),
    });
    if (!res.ok) return;
    const { payment } = await res.json();
    setRows((rs) =>
      rs.map((r) =>
        r.id === agreementId
          ? {
              ...r,
              payments: r.payments.map((p) =>
                p.id === paymentId
                  ? { ...p, paidAt: payment.paidAt }
                  : p,
              ),
            }
          : r,
      ),
    );
  }

  /** Taranmış sözleşmeyi R2'ye yükler (presigned PUT — dosya sunucumuza uğramaz) */
  async function uploadContract(file: File) {
    setError(null);
    if (file.size > 15 * 1024 * 1024) {
      setError("Dosya 15 MB'tan büyük olamaz.");
      return;
    }
    setUploading(true);
    try {
      const sign = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          folder: "kira-sozlesme",
        }),
      });
      const signData = await sign.json();
      if (!sign.ok) throw new Error(signData.error ?? "Yükleme adresi alınamadı");

      const put = await fetch(signData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) throw new Error("Dosya yüklenemedi");

      setContractFile({
        url: signData.publicUrl ?? signData.url ?? signData.key,
        key: signData.key,
        name: file.name,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Dosya yüklenemedi");
    } finally {
      setUploading(false);
    }
  }

  async function createAgreement() {
    setError(null);
    setFieldErrors({});
    setSaving(true);
    const res = await fetch("/api/rentals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        contactId: contactMode === "existing" ? form.contactId : undefined,
        newContact: contactMode === "new" ? newContact : undefined,
        rentAmount: Number(form.rentAmount),
        deposit: form.deposit ? Number(form.deposit) : undefined,
        paymentDueDay: Number(form.paymentDueDay),
        listingId: form.listingId || undefined,
        contractFileUrl: contractFile?.url,
        contractFileKey: contractFile?.key,
        contractFileName: contractFile?.name,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Kaydedilemedi.");
      setFieldErrors(data.fieldErrors ?? {});
      return;
    }
    const a = data.agreement;
    setRows((rs) => [
      {
        id: a.id,
        title: a.title,
        status: a.status,
        period: a.period,
        startDate: a.startDate,
        endDate: a.endDate,
        rentAmount: Number(a.rentAmount),
        paymentDueDay: a.paymentDueDay,
        contact: a.contact,
        listing: a.listing,
        contracts: a.contracts ?? [],
        payments: a.payments.map(
          (p: { id: string; periodLabel: string; dueDate: string; amount: unknown; paidAt: string | null }) => ({
            id: p.id,
            periodLabel: p.periodLabel,
            dueDate: p.dueDate,
            amount: Number(p.amount),
            paidAt: p.paidAt,
          }),
        ),
      },
      ...rs,
    ]);
    setShowForm(false);
    setForm(EMPTY_FORM);
    setNewContact(EMPTY_NEW_CONTACT);
    setContractFile(null);
    setContactMode("existing");
  }

  const active = rows.filter((r) => r.status === "ACTIVE");
  const overdueCount = active.reduce((n, r) => {
    const p = currentMonthPayment(r.payments);
    if (!p) return n;
    return paymentStatus(p.paidAt ? new Date(p.paidAt) : null, new Date(p.dueDate)) === "OVERDUE"
      ? n + 1
      : n;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-4 text-sm">
          <span className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-ink/10">
            <strong>{active.length}</strong> aktif sözleşme
          </span>
          {overdueCount > 0 && (
            <span className="rounded-lg bg-rose-50 px-3 py-1.5 font-semibold text-rose-700">
              {overdueCount} geciken ödeme
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-selvi rounded-xl px-4 py-2 text-sm font-semibold text-white"
        >
          + Yeni sözleşme
        </button>
      </div>

      {showForm && (
        <div className="space-y-5 rounded-2xl border border-ink/15 bg-white p-5">
          <h2 className="font-bold">Yeni kira sözleşmesi</h2>

          {/* ── 1. Mülk ── İlan bağlamak ZORUNLU DEĞİL: ofis, portföyünde
              olmayan bir mülkün kirasını da takip edebilmeli. */}
          <fieldset className="space-y-3">
            <legend className="text-[12px] font-bold uppercase tracking-wide text-ink/40">
              Mülk
            </legend>
            <Field label="Sözleşme başlığı" required error={fieldErrors.title}>
              <input
                className={inputCls(fieldErrors.title)}
                placeholder="örn. Başiskele 2+1 daire"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label={`${labels.listing} bağla`}
                hint="Opsiyonel — portföyünüzde yoksa boş bırakın"
              >
                <select
                  className={inputCls()}
                  value={form.listingId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, listingId: e.target.value }))
                  }
                >
                  <option value="">Bağlama</option>
                  {listings.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.refCode} — {l.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Mülk adresi"
                hint={form.listingId ? "İlandan gelir" : "Sözleşmede geçecek adres"}
              >
                <input
                  className={inputCls()}
                  placeholder="Mahalle, cadde, no, daire"
                  value={form.propertyAddress}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, propertyAddress: e.target.value }))
                  }
                />
              </Field>
            </div>
          </fieldset>

          {/* ── 2. Kiracı ── mevcut kişi VEYA satır içi yeni kayıt ── */}
          <fieldset className="space-y-3 border-t border-ink/10 pt-4">
            <legend className="text-[12px] font-bold uppercase tracking-wide text-ink/40">
              Kiracı
            </legend>
            <div className="inline-flex rounded-xl border border-ink/15 p-0.5">
              {(
                [
                  ["existing", "Kayıtlı kişiden seç"],
                  ["new", "+ Yeni kişi ekle"],
                ] as const
              ).map(([mode, lbl]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setContactMode(mode)}
                  className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold transition ${
                    contactMode === mode
                      ? "bg-ink text-white"
                      : "text-ink/55 hover:text-ink"
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>

            {contactMode === "existing" ? (
              <Field label="Kiracı" required error={fieldErrors.contactId}>
                <select
                  className={inputCls(fieldErrors.contactId)}
                  value={form.contactId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contactId: e.target.value }))
                  }
                >
                  <option value="">Seçin…</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Ad soyad" required error={fieldErrors.contactId}>
                  <input
                    className={inputCls(fieldErrors.contactId)}
                    placeholder="Ahmet Yılmaz"
                    value={newContact.fullName}
                    onChange={(e) =>
                      setNewContact((c) => ({ ...c, fullName: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Telefon">
                  <input
                    className={inputCls()}
                    inputMode="tel"
                    placeholder="0532 000 00 00"
                    value={newContact.phone}
                    onChange={(e) =>
                      setNewContact((c) => ({ ...c, phone: e.target.value }))
                    }
                  />
                </Field>
                <Field label="T.C. kimlik no" hint="Sözleşmede taraf kimliği">
                  <input
                    className={inputCls()}
                    inputMode="numeric"
                    maxLength={11}
                    placeholder="11 hane"
                    value={newContact.nationalId}
                    onChange={(e) =>
                      setNewContact((c) => ({
                        ...c,
                        nationalId: e.target.value.replace(/\D/g, ""),
                      }))
                    }
                  />
                </Field>
                <Field label="Tebligat adresi">
                  <input
                    className={inputCls()}
                    placeholder="Kiracının adresi"
                    value={newContact.address}
                    onChange={(e) =>
                      setNewContact((c) => ({ ...c, address: e.target.value }))
                    }
                  />
                </Field>
                <p className="text-[12px] text-ink/45 sm:col-span-2">
                  Bu kişi Müşteriler listenize kiracı olarak eklenecek.
                </p>
              </div>
            )}
          </fieldset>

          {/* ── 3. Kiraya veren (mal sahibi) ── */}
          <fieldset className="grid gap-3 border-t border-ink/10 pt-4 sm:grid-cols-2">
            <legend className="text-[12px] font-bold uppercase tracking-wide text-ink/40">
              Kiraya veren
            </legend>
            <Field label="Ad soyad" hint="Mülk sahibi — ofis aracıysa doldurun">
              <input
                className={inputCls()}
                value={form.ownerName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ownerName: e.target.value }))
                }
              />
            </Field>
            <Field label="T.C. kimlik no">
              <input
                className={inputCls()}
                inputMode="numeric"
                maxLength={11}
                value={form.ownerNationalId}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    ownerNationalId: e.target.value.replace(/\D/g, ""),
                  }))
                }
              />
            </Field>
          </fieldset>

          {/* ── 4. Koşullar ── */}
          <fieldset className="grid gap-3 border-t border-ink/10 pt-4 sm:grid-cols-2 lg:grid-cols-3">
            <legend className="text-[12px] font-bold uppercase tracking-wide text-ink/40">
              Kira koşulları
            </legend>
            <Field label="Aylık kira (₺)" required error={fieldErrors.rentAmount}>
              <input
                type="number"
                className={inputCls(fieldErrors.rentAmount)}
                value={form.rentAmount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rentAmount: e.target.value }))
                }
              />
            </Field>
            <Field label="Depozito (₺)">
              <input
                type="number"
                className={inputCls()}
                value={form.deposit}
                onChange={(e) => setForm((f) => ({ ...f, deposit: e.target.value }))}
              />
            </Field>
            <Field label="Yıllık artış (%)" hint="Yenilemede hatırlatılır">
              <input
                type="number"
                step="0.1"
                className={inputCls()}
                value={form.increaseRate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, increaseRate: e.target.value }))
                }
              />
            </Field>
            <Field label="Başlangıç" required error={fieldErrors.startDate}>
              <input
                type="date"
                className={inputCls(fieldErrors.startDate)}
                value={form.startDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startDate: e.target.value }))
                }
              />
            </Field>
            <Field label="Bitiş" required error={fieldErrors.endDate}>
              <input
                type="date"
                className={inputCls(fieldErrors.endDate)}
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </Field>
            <Field label="Ödeme günü" hint="Ayın kaçı" error={fieldErrors.paymentDueDay}>
              <input
                type="number"
                min={1}
                max={31}
                className={inputCls(fieldErrors.paymentDueDay)}
                value={form.paymentDueDay}
                onChange={(e) =>
                  setForm((f) => ({ ...f, paymentDueDay: e.target.value }))
                }
              />
            </Field>
          </fieldset>

          {/* ── 5. Taranmış sözleşme ── */}
          <fieldset className="space-y-2 border-t border-ink/10 pt-4">
            <legend className="text-[12px] font-bold uppercase tracking-wide text-ink/40">
              İmzalı sözleşme
            </legend>
            <p className="text-[13px] text-ink/55">
              Kâğıtta imzaladığınız sözleşmeyi PDF veya fotoğraf olarak yükleyin —
              dosya kayıtta kalır, aramanıza gerek kalmaz.
            </p>
            {contractFile ? (
              <div className="flex items-center gap-3 rounded-xl border border-ink/15 bg-paper px-3 py-2.5">
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                  {contractFile.name}
                </span>
                <a
                  href={contractFile.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[13px] font-semibold text-ink/60 hover:text-ink"
                >
                  Aç
                </a>
                <button
                  type="button"
                  onClick={() => setContractFile(null)}
                  className="text-[13px] font-semibold text-[--color-danger]"
                >
                  Kaldır
                </button>
              </div>
            ) : (
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-ink/25 px-4 py-2.5 text-[13px] font-semibold text-ink/70 hover:bg-paper">
                {uploading ? "Yükleniyor…" : "Dosya seç (PDF, JPG, PNG)"}
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadContract(f);
                  }}
                />
              </label>
            )}
          </fieldset>

          <Field label="Not">
            <textarea
              rows={2}
              className={inputCls()}
              placeholder="Sözleşmeye dair hatırlatma"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </Field>

          {error && (
            <p className="text-sm font-medium text-[--color-danger]">{error}</p>
          )}
          <button
            onClick={createAgreement}
            disabled={saving || uploading}
            className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Kaydediliyor…" : "Sözleşme oluştur"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {active.map((r) => {
          const cur = currentMonthPayment(r.payments);
          const st = cur
            ? paymentStatus(cur.paidAt ? new Date(cur.paidAt) : null, new Date(cur.dueDate))
            : "DUE";
          return (
            <div key={r.id} className="rounded-xl border border-ink/15 bg-white overflow-hidden">
              <button
                className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-ink/[0.02]"
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              >
                <div>
                  <p className="font-semibold">{r.title}</p>
                  <p className="text-xs text-ink/50">
                    {r.contact.fullName} · {trMoney.format(r.rentAmount)}/ay · ödeme günü: {r.paymentDueDay}
                  </p>
                </div>
                {cur && (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_BADGE[st]}`}>
                    {STATUS_TR[st]}
                  </span>
                )}
              </button>
              {expanded === r.id && (
                <div className="border-t border-ink/10 px-4 py-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-ink/45">
                        <th className="pb-2">Dönem</th>
                        <th className="pb-2">Vade</th>
                        <th className="pb-2">Tutar</th>
                        <th className="pb-2">Durum</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {r.payments.map((p) => {
                        const ps = paymentStatus(
                          p.paidAt ? new Date(p.paidAt) : null,
                          new Date(p.dueDate),
                        );
                        return (
                          <tr key={p.id} className="border-t border-ink/5">
                            <td className="py-2">{p.periodLabel}</td>
                            <td>{new Date(p.dueDate).toLocaleDateString("tr-TR")}</td>
                            <td>{trMoney.format(p.amount)}</td>
                            <td>
                              <span className={`rounded px-1.5 py-0.5 font-semibold ${STATUS_BADGE[ps]}`}>
                                {STATUS_TR[ps]}
                              </span>
                            </td>
                            <td className="text-right">
                              {!p.paidAt && (
                                <button
                                  onClick={() => markPaid(p.id, r.id)}
                                  className="font-semibold text-brand-600 hover:underline"
                                >
                                  Ödendi
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
        {active.length === 0 && (
          <p className="rounded-xl border border-dashed border-ink/20 py-12 text-center text-sm text-ink/45">
            Henüz aktif kira sözleşmesi yok.
          </p>
        )}
      </div>
    </div>
  );
}
