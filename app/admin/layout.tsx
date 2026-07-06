import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { currentUserIsSuperAdmin } from "@/lib/plans";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!(await currentUserIsSuperAdmin())) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="border-b border-ink/10 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 shadow-md">
              <span className="font-display text-lg font-extrabold text-white">E</span>
            </div>
            <div>
              <p className="font-display text-base font-extrabold tracking-tight leading-none">
                Emlak<span className="text-brand-600">Flow</span>
              </p>
              <p className="text-[9px] font-mono font-semibold uppercase tracking-wider text-ink/40">
                Super Admin
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-4 text-sm">
            <span className="hidden text-ink/50 sm:block">
              {session?.name}
            </span>
            <Link 
              href="/dashboard" 
              className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md"
            >
              Uygulamaya dön
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
