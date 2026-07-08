import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { BLOG_PILLARS, BLOG_POSTS, getPost, relatedPosts } from "@/lib/blog";
import { breadcrumbJsonLd } from "@/lib/seo";
import { getBaseUrl } from "@/lib/url";

const BASE_URL = getBaseUrl();

type Params = Promise<{ slug: string }>;

/** Tüm yazılar build'de statik üretilir; kayıt dışı slug 404. */
export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const canonical = `${BASE_URL}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: canonical,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

const tarihFmt = new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" });

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const canonical = `${BASE_URL}/blog/${post.slug}`;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.h1,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    inLanguage: "tr",
    mainEntityOfPage: canonical,
    author: { "@type": "Organization", name: "EmlakFlow", url: BASE_URL },
    publisher: { "@type": "Organization", name: "EmlakFlow", url: BASE_URL },
  };
  const crumbs = breadcrumbJsonLd([
    { name: "EmlakFlow", url: BASE_URL },
    { name: "Blog", url: `${BASE_URL}/blog` },
    { name: post.h1, url: canonical },
  ]);
  const related = relatedPosts(post);

  return (
    <div className="min-h-screen bg-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />

      <header className="border-b border-ink/10">
        <div className="mx-auto max-w-3xl px-5 py-5">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/50 transition-colors hover:text-ink"
          >
            <ArrowLeft size={15} /> Tüm yazılar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12">
        <article>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand-600">
            {BLOG_PILLARS[post.pillar]}
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            {post.h1}
          </h1>
          <p className="mt-4 flex items-center gap-3 font-mono text-[11px] uppercase tracking-wider text-ink/40">
            <span>{tarihFmt.format(new Date(post.publishedAt))}</span>
            <span className="flex items-center gap-1">
              <Clock size={11} /> {post.readingMinutes} dk okuma
            </span>
          </p>

          <div className="makale mt-8">
            <post.Content />
          </div>
        </article>

        {/* Dönüşüm kutusu — her yazının altında ürüne köprü */}
        <aside className="mt-12 rounded-[10px] border border-brand-600/25 bg-brand-50 p-6">
          <h2 className="font-display text-lg font-extrabold tracking-tight">
            Portföyünüzü sistemle yönetin
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink/65">
            EmlakFlow; portföy takibi, alıcı eşleştirme, harita vitrini ve
            komisyon paylaşımını tek panelde toplar. Kurulum 10 dakika,
            başlangıç planı ücretsiz.
          </p>
          <Link
            href="/register"
            className="btn-selvi mt-4 inline-block rounded-lg px-5 py-2.5 text-sm font-bold text-white"
          >
            Ücretsiz deneyin
          </Link>
        </aside>

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="bolum">İlgili yazılar</h2>
            <div className="mt-4 space-y-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="group block rounded-[10px] border border-ink/15 bg-white p-4 transition-colors hover:border-ink/40"
                >
                  <p className="font-semibold group-hover:text-brand-700">
                    {r.h1}
                  </p>
                  <p className="mt-1 line-clamp-1 text-sm text-ink/55">
                    {r.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
