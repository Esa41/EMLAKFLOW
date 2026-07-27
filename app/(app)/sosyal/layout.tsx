import { SocialSubnav } from "@/components/social/social-subnav";

export default function SosyalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-[27px] font-extrabold tracking-tight">
          Sosyal OS
        </h1>
        <p className="mt-1 text-sm text-ink/55">
          {/* "yayınla" iddiası kaldırıldı: otomatik yayın kapsam dışı —
              içerik hazırlanır, paylaşımı danışman kendi yapar. */}
          İlandan içeriğe — hazırla, planla, paylaş.
        </p>
      </div>
      <SocialSubnav />
      {children}
    </div>
  );
}
