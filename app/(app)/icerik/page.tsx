import { redirect } from "next/navigation";

export default async function IcerikRedirect({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  if (sp.connected) q.set("connected", sp.connected);
  if (sp.error) q.set("error", sp.error);
  const suffix = q.toString() ? `?${q}` : "";
  redirect(`/sosyal/takip${suffix}`);
}
