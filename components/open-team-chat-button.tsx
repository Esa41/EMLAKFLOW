"use client";

import { MessageCircle } from "lucide-react";
import { useTeamChat } from "./team-chat-context";

/** Ekip sayfası vb. yerlerden sohbet panelini açar. */
export function OpenTeamChatButton({
  sessionId,
  label = "Ekip sohbetini aç",
  className,
}: {
  sessionId?: string;
  label?: string;
  className?: string;
}) {
  const { setOpen, openToSession } = useTeamChat();

  return (
    <button
      type="button"
      onClick={() => {
        if (sessionId) openToSession(sessionId);
        else setOpen(true);
      }}
      className={
        className ??
        "dash-btn-secondary"
      }
    >
      <MessageCircle size={15} />
      {label}
    </button>
  );
}
