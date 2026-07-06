import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";
import type { Role } from "@prisma/client";

// ── Session tip genişletmesi ──
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tenantId: string;
      role: Role;
      tenantName: string;
      vertical: string;
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
          include: { tenant: true },
        });
        if (!user || !user.isActive) return null;

        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          tenantId: user.tenantId,
          role: user.role,
          tenantName: user.tenant.name,
          vertical: user.tenant.vertical,
        };
      },
    }),
  ],
});

/**
 * API route'ları ve server component'ler için minimum oturum sözleşmesi:
 * { tenantId, userId, role } — iskeletteki tüm kod buna bağlanır.
 */
export async function getSession() {
  const session = await auth();
  if (!session?.user) return null;
  return {
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    name: session.user.name ?? "",
    tenantName: session.user.tenantName,
    vertical: session.user.vertical ?? "REAL_ESTATE",
  };
}
