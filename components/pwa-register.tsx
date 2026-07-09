"use client";

import { useEffect } from "react";

/**
 * Service worker kaydı — load + idle sonrası.
 * İlk ziyarette FCP/LCP ile precache yarışmasını önler.
 */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        /* sessiz — PWA opsiyonel */
      });
    };

    const afterLoad = () => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(register, { timeout: 5000 });
      } else {
        setTimeout(register, 3500);
      }
    };

    if (document.readyState === "complete") afterLoad();
    else window.addEventListener("load", afterLoad, { once: true });
  }, []);

  return null;
}
