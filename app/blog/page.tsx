import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { BLOG_PILLARS, BLOG_POSTS, type BlogPillarKey } from "@/lib/blog";
import { getBaseUrl } from "@/lib/url";

const BASE_URL = getBaseUrl();

export const metadata: Metadata = {
  title: "Emlak Ofisleri için Rehberler ve Sektör Analizleri",
  description:
    "Portföy toplama, emlak CRM seçimi, ofis kurma ve dijital pazarlama: emlak profesyonelleri için uygulanabilir rehberler — EmlakFlow Blog.",
  alternates: { canonical: `${BASE_URL}/blog` },
  openGraph: {
    title: "EmlakFlow Blog — Emlak Ofisleri için Rehberler",
    description:
      "Portföy toplama, CRM seçimi, ofis kurma ve dijital pazarlama rehberleri.",
    type: "website",
    url: `${BASE_URL}/blog`,
  },
};

const tarihFmt = new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" });

export default function BlogIndexPage() {
  // Pillar sırasına göre grupla; boş pillar'lar (henüz yazısı olmayan) gizlenir
  const groups = (Object.keys(BLOG_PILLARS) as BlogPillarKey[])
    .map((key) => ({
      key,
      name: BLOG_PILLARS[key],
      posts: BLOG_POSTS.filter((p) => p.pillar === key).sort((a, b) =>
        b.publishedAt.localeCompare(a.publishedAt),
      ),
    }))
    .filter((g) => g.posts.length > 0);

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-ink/10">
        <div className="mx-auto max-w-3xl px-5 py-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/50 transition-colors hover:text-ink"
          >
            <ArrowLeft size={15} />
            Emlak<span className="font-bold text-brand-600">Flow</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand-600">
          Blog
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Emlak ofisleri için rehberler
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink/60">
          Portföy toplama, CRM ve otomasyon, ofis kurma ve dijital pazarlama —
          sahada çalışan taktikler, pazarlama parlatması olmadan.
        </p>

        {groups.map((g) => (
          <section key={g.key} className="mt-12">
            <h2 className="bolum">{g.name}</h2>
            <div className="mt-4 space-y-4">
              {g.posts.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group block rounded-[10px] border border-ink/15 bg-white p-5 transition-colors hover:border-ink/40"
                >
                  <h3 className="font-display text-lg font-bold tracking-tight group-hover:text-brand-700">
                    {p.h1}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink/60">
                    {p.description}
                  </p>
                  <p className="mt-3 flex items-center gap-3 font-mono text-[11px] uppercase tracking-wider text-ink/40">
                    <span>{tarihFmt.format(new Date(p.publishedAt))}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {p.readingMinutes} dk
                    </span>
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>

      <footer className="border-t border-ink/10 py-8 text-center">
        <p className="text-sm text-ink/50">
          Portföyünüzü sistemle yönetmeye hazır mısınız?{" "}
          <Link
            href="/register"
            className="font-semibold text-brand-600 hover:text-brand-700"
          >
            Ücretsiz deneyin →
          </Link>
        </p>
      </footer>
    </div>
  );
}
