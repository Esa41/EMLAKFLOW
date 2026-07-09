"use client";

import { useState, type ReactNode } from "react";
import { Mail, MessageCircle } from "lucide-react";

/** Sohbet sayfası sekmeleri: Canlı Sohbet | E-postalar.
 *  İki panel de mount kalır (sekme değişince sohbet durumu kaybolmaz). */
export function SohbetTabs({ chat, mails }: { chat: ReactNode; mails: ReactNode }) {
  const [tab, setTab] = useState<"chat" | "mails">("chat");

  return (
    <div>
      <div className="mb-5 inline-flex rounded-xl border border-ink/15 bg-white p-1 text-sm font-semibold">
        <button
          onClick={() => setTab("chat")}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 transition-colors ${
            tab === "chat" ? "bg-ink text-white" : "text-ink/55 hover:text-ink"
          }`}
        >
          <MessageCircle size={14} /> Canlı Sohbet
        </button>
        <button
          onClick={() => setTab("mails")}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 transition-colors ${
            tab === "mails" ? "bg-ink text-white" : "text-ink/55 hover:text-ink"
          }`}
        >
          <Mail size={14} /> E-postalar
        </button>
      </div>
      <div className={tab === "chat" ? "" : "hidden"}>{chat}</div>
      <div className={tab === "mails" ? "" : "hidden"}>{mails}</div>
    </div>
  );
}
