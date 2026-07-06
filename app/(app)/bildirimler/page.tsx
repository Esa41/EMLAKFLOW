import { redirect } from "next/navigation";

/** Eski URL — Bildirim & Faaliyet Merkezi'ne (/merkez) taşındı. */
export default function BildirimlerRedirect() {
  redirect("/merkez");
}
