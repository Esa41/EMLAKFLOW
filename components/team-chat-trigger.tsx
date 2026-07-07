"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useTeamChat } from "./team-chat-context";

export function TeamChatTrigger() {
  const { toggle, open } = useTeamChat();
  const [unread, setUnread] = useState(0);

  const load = () => {
    fetch("/api/chat/team/unread")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setUnread(d.unread ?? 0))
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!open) load();
  }, [open]);

  return (
    <button
      type="button"
      onClick={toggle}
      className="relative rounded-xl p-2 text-ink/45 transition hover:bg-[var(--app-input-bg)] hover:text-ink/70"
      aria-label="Ekip sohbeti"
      title="Ekip sohbeti"
    >
      <MessageCircle size={20} strokeWidth={1.75} />
      {unread > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-brand-600 px-1 text-[9px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );
}
