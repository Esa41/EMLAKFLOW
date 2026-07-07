"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Map, LayoutDashboard, CheckCircle2, ArrowRight } from "lucide-react";

export function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if the user has already completed the onboarding
    const completed = localStorage.getItem("emlakflow_onboarding_completed");
    if (!completed) {
      // Small delay to make it feel smooth
      const timer = setTimeout(() => setIsOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("emlakflow_onboarding_completed", "true");
    setIsOpen(false);
  };

  const steps = [
    {
      title: "EmlakFlow'a Hoş Geldiniz! 🚀",
      description: "Ofisinizin ve danışmanlığınızın yeni dijital işletim sistemi hazır. Sizi 3 adımda hızlıca gezdirelim.",
      icon: <Sparkles className="h-10 w-10 text-brand-600 animate-pulse" />,
      content: (
        <div className="space-y-2 text-center text-sm text-ink/65">
          <p>EmlakFlow ile Excel tablolarını, kaybolan müşteri telefonlarını ve demode web sitelerini geride bırakıyorsunuz.</p>
          <p className="font-semibold text-brand-600">Hadi, işinizi büyütmeye başlayalım!</p>
        </div>
      ),
    },
    {
      title: "1. Premium İlan Vitrininiz",
      description: "Eklediğiniz her portföy, ofisinizin harita tabanlı vitrininde anında sergilenir.",
      icon: <Map className="h-10 w-10 text-brand-600" />,
      content: (
        <div className="space-y-3 text-sm text-ink/65">
          <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3 text-xs leading-relaxed">
            ✨ Müşterileriniz harita üzerinde gezinirken, kartların üzerine geldiğinde ilanlar vurgulanır. Tıpkı Airbnb şıklığında!
          </div>
          <p>Yandaki menüden <strong className="text-ink">Portföy</strong> sekmesine giderek ilk ilanınızı hemen ekleyebilirsiniz.</p>
        </div>
      ),
    },
    {
      title: "2. Müşteri & Kanban Panosu",
      description: "Müşteri adaylarınızı ve teklif süreçlerinizi sürükle-bırak yöntemiyle yönetin.",
      icon: <LayoutDashboard className="h-10 w-10 text-brand-600" />,
      content: (
        <div className="space-y-3 text-sm text-ink/65">
          <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3 text-xs leading-relaxed">
            🤝 Yeni bir fırsatı "Yeni" aşamasından "Kazanıldı" durumuna kadar adım adım takip edin. İşlemler bittiğinde "Kazanılanlar" sekmesinde toplanır.
          </div>
          <p>Soldaki menüden <strong className="text-ink">Fırsatlar</strong> (veya Müşteriler) sekmesinden bu panoyu görebilirsiniz.</p>
        </div>
      ),
    },
    {
      title: "Harikasınız, Her Şey Hazır!",
      description: "Artık emlak işinizi dijital olarak büyütmeye tamamen hazırsınız.",
      icon: <CheckCircle2 className="h-10 w-10 text-emerald-600" />,
      content: (
        <div className="space-y-3 text-sm text-ink/65 text-center">
          <p>Kasa hesabı, randevular ve danışman hak edişleri de arka planda otomatik olarak hesaplanacaktır.</p>
          <p className="font-semibold text-brand-600">Şimdi ilk portföyünüzü ekleme veya ayarlarınızı tamamlama zamanı!</p>
        </div>
      ),
    },
  ];

  if (!isOpen) return null;

  const currentStep = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md transform rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-hover)] p-6 shadow-2xl transition-all animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink/40">
            Adım {step + 1} / {steps.length}
          </span>
          <button onClick={handleClose} className="rounded-full bg-ink/5 p-1.5 text-ink/50 hover:bg-ink/10 hover:text-ink">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-50 shadow-inner">
            {currentStep.icon}
          </div>
          <h2 className="font-display text-xl font-extrabold text-ink">{currentStep.title}</h2>
          <p className="mt-2 text-sm text-ink/50">{currentStep.description}</p>
          
          <div className="mt-6 w-full text-left">
            {currentStep.content}
          </div>
        </div>

        {/* Step Indicator dots */}
        <div className="mt-8 flex items-center justify-center gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-brand-600" : "w-1.5 bg-ink/15"
              }`}
            />
          ))}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 rounded-xl border border-ink/20 py-3 text-center text-sm font-semibold text-ink/70 hover:border-ink/40"
            >
              Geri
            </button>
          )}
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="btn-selvi flex-1 flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold text-white shadow-sm"
            >
              İlerle
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="btn-selvi flex-1 rounded-xl py-3 text-sm font-bold text-white shadow-sm"
            >
              Başlayalım!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
