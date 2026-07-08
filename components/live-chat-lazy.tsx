"use client";

import dynamic from "next/dynamic";

export const LiveChatWidgetLazy = dynamic(
  () => import("@/components/live-chat-widget").then((m) => m.LiveChatWidget),
  { ssr: false },
);
