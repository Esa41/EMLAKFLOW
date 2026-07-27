"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";

/**
 * Landing görsel etki bileşenleri — monokrom kimliğe zenginlik katar.
 *
 * Kurallar:
 * - Yalnız transform/opacity animasyonu (compositor; layout tetiklemez)
 * - Tek rAF döngüsü, passive listener; scroll'da iş yapılmaz
 * - prefers-reduced-motion: hepsi kapanır, içerik TAM görünür kalır
 * - LCP güvenliği: ekranın üstündeki metin JS'e bağlı DEĞİL (bkz. Kinetic)
 */

function prefersReduced() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/* ── Kinetik başlık — kelime kelime maskeli açılış ──
   Saf CSS keyframe ile çalışır; JS yüklenmese bile metin görünür olur
   (animasyon `forwards` ile bitiş durumunda kalır). LCP riski yok. */
export function Kinetic({
  text,
  className = "",
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className="fx-kinetic">
          <span style={{ animationDelay: `${delay + i * 55}ms` }}>{w}</span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

/* ── Bulanıktan netleşen giriş ── */
export function Rise({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (prefersReduced()) {
      setOn(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`fx-rise ${on ? "fx-rise-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ── İmleç ışığı — bölüm içinde yumuşak gri hâle ── */
export function Spotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReduced()) return;
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host) return;

    let raf = 0;
    let x = 0;
    let y = 0;

    const apply = () => {
      raf = 0;
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
    };
    const onMove = (ev: PointerEvent) => {
      const r = host.getBoundingClientRect();
      x = ev.clientX - r.left;
      y = ev.clientY - r.top;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const on = () => el.classList.add("fx-spotlight-on");
    const off = () => el.classList.remove("fx-spotlight-on");

    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerenter", on);
    host.addEventListener("pointerleave", off);
    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerenter", on);
      host.removeEventListener("pointerleave", off);
    };
  }, []);

  return <div ref={ref} className="fx-spotlight" aria-hidden />;
}

/* ── 3B eğim — kart imlece göre hafifçe döner ── */
export function Tilt({
  children,
  className = "",
  max = 5,
  style,
}: {
  children: ReactNode;
  className?: string;
  /** Maksimum dönüş açısı (derece) */
  max?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReduced()) return;
    const el = ref.current;
    if (!el) return;
    // Dokunmatikte eğim yok — parmakla "hover" yok, sadece maliyet olur
    if (!window.matchMedia("(hover: hover)").matches) return;

    let raf = 0;
    let rx = 0;
    let ry = 0;

    const apply = () => {
      raf = 0;
      el.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
    };
    const onMove = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (ev.clientX - r.left) / r.width - 0.5;
      const py = (ev.clientY - r.top) / r.height - 0.5;
      ry = px * max * 2;
      rx = -py * max * 2;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const enter = () => el.classList.add("fx-tilt-lift");
    const leave = () => {
      el.classList.remove("fx-tilt-lift");
      rx = 0;
      ry = 0;
      apply();
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
    };
  }, [max]);

  return (
    <div ref={ref} className={`fx-tilt ${className}`} style={style}>
      {children}
    </div>
  );
}

/* ── Okuma ilerleme çizgisi — sayfanın üstünde ince mürekkep ── */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      el.style.setProperty("--p", h > 0 ? String(window.scrollY / h) : "0");
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return <div ref={ref} className="fx-progress" aria-hidden />;
}

/* ── Sonsuz şerit — içerik iki kez basılır, %50 kaydırılır ── */
export function Marquee({ items }: { items: string[] }) {
  const row = (
    <div className="flex shrink-0 items-center">
      {items.map((t, i) => (
        <span key={`${t}-${i}`} className="flex items-center whitespace-nowrap">
          <span className="px-6 font-display text-[13px] font-semibold uppercase tracking-[0.14em] text-ink/40">
            {t}
          </span>
          <span className="h-1 w-1 rounded-full bg-ink/20" />
        </span>
      ))}
    </div>
  );
  return (
    <div className="fx-marquee" aria-hidden>
      <div className="fx-marquee-track">
        {row}
        {row}
      </div>
    </div>
  );
}
