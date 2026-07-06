import { redirect } from "next/navigation";

/** Eski URL — Faaliyet Merkezi /merkez sekmesine taşındı. */
export default function FaaliyetGecmisiRedirect() {
  redirect("/merkez?tab=faaliyet");
}
