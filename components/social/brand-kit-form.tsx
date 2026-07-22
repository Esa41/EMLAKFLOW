"use client";

import { useState, useTransition } from "react";
import { upsertBrandKit } from "@/app/actions/social-os";
import { TONE_OPTIONS } from "@/lib/social-os/prompts";

const fieldClass =
  "w-full rounded-xl border border-ink/10 bg-[var(--app-input-bg)] px-3 py-2.5 text-sm outline-none focus:border-brand-600";

type BrandKitData = {
  voice: string | null;
  mission: string | null;
  vision: string | null;
  photographyStyle: string | null;
  emojiPolicy: string;
  tonePresets: string[];
  values: string[];
  forbiddenPhrases: string[];
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
  timezone: string;
};

export function BrandKitForm({ initial }: { initial: BrandKitData | null }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [voice, setVoice] = useState(initial?.voice ?? "");
  const [mission, setMission] = useState(initial?.mission ?? "");
  const [vision, setVision] = useState(initial?.vision ?? "");
  const [photographyStyle, setPhotographyStyle] = useState(
    initial?.photographyStyle ?? "",
  );
  const [emojiPolicy, setEmojiPolicy] = useState(
    initial?.emojiPolicy ?? "moderate",
  );
  const [tones, setTones] = useState<string[]>(initial?.tonePresets ?? []);
  const [values, setValues] = useState((initial?.values ?? []).join(", "));
  const [forbidden, setForbidden] = useState(
    (initial?.forbiddenPhrases ?? []).join(", "),
  );
  const [timezone, setTimezone] = useState(
    initial?.timezone ?? "Europe/Istanbul",
  );

  function toggleTone(t: string) {
    setTones((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  }

  function save() {
    setMsg(null);
    start(async () => {
      try {
        await upsertBrandKit({
          voice,
          mission,
          vision,
          photographyStyle,
          emojiPolicy,
          tonePresets: tones,
          values: values
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          forbiddenPhrases: forbidden
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          timezone,
          quietHoursStart: initial?.quietHoursStart ?? null,
          quietHoursEnd: initial?.quietHoursEnd ?? null,
        });
        setMsg("Marka kiti kaydedildi.");
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Kayıt başarısız");
      }
    });
  }

  return (
    <div className="space-y-5 rounded-2xl border border-ink/10 bg-[var(--app-surface)] p-5">
      <Field label="Marka sesi">
        <textarea
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          rows={3}
          placeholder="Örn. Sakin, güven veren, abartısız lüks dili…"
          className={fieldClass}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Misyon">
          <textarea
            value={mission}
            onChange={(e) => setMission(e.target.value)}
            rows={2}
            className={fieldClass}
          />
        </Field>
        <Field label="Vizyon">
          <textarea
            value={vision}
            onChange={(e) => setVision(e.target.value)}
            rows={2}
            className={fieldClass}
          />
        </Field>
      </div>
      <Field label="Fotoğraf stili">
        <input
          value={photographyStyle}
          onChange={(e) => setPhotographyStyle(e.target.value)}
          placeholder="Doğal ışık, geniş açı, insan yok…"
          className={fieldClass}
        />
      </Field>
      <Field label="Tercih edilen tonlar">
        <div className="flex flex-wrap gap-2">
          {TONE_OPTIONS.map((t) => {
            const on = tones.includes(t.value);
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => toggleTone(t.value)}
                className={`rounded-full px-3 py-1 text-[12px] font-medium ${
                  on
                    ? "bg-brand-600 text-white"
                    : "bg-[var(--app-input-bg)] text-ink/60"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Değerler (virgülle)">
          <input
            value={values}
            onChange={(e) => setValues(e.target.value)}
            className={fieldClass}
          />
        </Field>
        <Field label="Yasak ifadeler (virgülle)">
          <input
            value={forbidden}
            onChange={(e) => setForbidden(e.target.value)}
            placeholder="garanti getiri, kaçırma…"
            className={fieldClass}
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Emoji politikası">
          <select
            value={emojiPolicy}
            onChange={(e) => setEmojiPolicy(e.target.value)}
            className={fieldClass}
          >
            <option value="sparse">Az</option>
            <option value="moderate">Orta</option>
            <option value="none">Yok</option>
          </select>
        </Field>
        <Field label="Saat dilimi">
          <input
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className={fieldClass}
          />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </button>
        {msg && <p className="text-sm text-ink/55">{msg}</p>}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12px] font-semibold uppercase tracking-wide text-ink/40">
        {label}
      </span>
      {children}
    </label>
  );
}
