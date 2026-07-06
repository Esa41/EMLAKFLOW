import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

/**
 * Edge-uyumlu temel config. Middleware bunu kullanır — Prisma/bcrypt İÇERMEZ.
 * Provider'lar (DB erişimi gerektiren kısım) lib/auth.ts içinde eklenir.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [], // lib/auth.ts dolduruyor
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as {
          tenantId: string;
          role: string;
          tenantName: string;
          vertical: string;
        };
        token.tenantId = u.tenantId;
        token.role = u.role;
        token.tenantName = u.tenantName;
        token.vertical = u.vertical;
      }
      return token;
    },
    session({ session, token }) {
      // Tam tip genişletmesi lib/auth.ts'te — burada Edge-uyumlu geniş cast.
      const u = session.user as typeof session.user & {
        tenantId: string;
        role: string;
        tenantName: string;
        vertical: string;
      };
      u.id = token.sub as string;
      u.tenantId = token.tenantId as string;
      u.role = token.role as Role;
      u.tenantName = token.tenantName as string;
      u.vertical = (token.vertical as string) ?? "REAL_ESTATE";
      return session;
    },
  },
} satisfies NextAuthConfig;
