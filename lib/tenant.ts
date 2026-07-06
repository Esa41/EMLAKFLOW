import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

// tenantId taşıyan modeller — Tenant kökü ve ListingMedia (listing üzerinden izole) hariç.
const TENANT_MODELS = new Set([
  "User",
  "Contact",
  "Lead",
  "Listing",
  "Deal",
  "Appointment",
  "Contract",
  "Commission",
  "Activity",
  "Notification",
  "ListingEvent",
  "ListingDailyStat",
  "Insight",
  "RentalAgreement",
  "RentPayment",
  "Task",
  "SocialAccount",
  "SocialPost",
  "TeamChatRead",
]);

/**
 * Tenant-scoped Prisma client.
 * Tüm okuma/yazma/güncelleme/silme sorgularına otomatik `tenantId` basar.
 * Elle `where: { tenantId }` yazmaya gerek kalmaz; başka ofisin verisine
 * yanlışlıkla erişim riski kökten kapanır.
 *
 * Kullanım:
 *   const db = forTenant(session.tenantId);
 *   const listings = await db.listing.findMany();
 */
export function forTenant(tenantId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !TENANT_MODELS.has(model)) return query(args);

          const a = args as Record<string, unknown>;

          // Okuma / güncelleme / silme → where'e tenantId enjekte et
          if (
            [
              "findMany",
              "findFirst",
              "findFirstOrThrow",
              "count",
              "aggregate",
              "groupBy",
              "updateMany",
              "deleteMany",
            ].includes(operation)
          ) {
            a.where = { ...(a.where as object), tenantId };
          }

          // Tekil bulma → sonucu tenant'a göre doğrula.
          // `select` kullanılıp `tenantId` istenmemişse doğrulama için zorla ekleriz,
          // yoksa sonuçta `tenantId` alanı bulunmadığından kontrol her zaman başarısız olur.
          if (["findUnique", "findUniqueOrThrow"].includes(operation)) {
            const originalSelect = a.select as
              Record<string, unknown> | undefined;
            const injectedTenantId =
              !!originalSelect && !originalSelect.tenantId;
            if (injectedTenantId) {
              a.select = { ...originalSelect, tenantId: true };
            }
            const result = await query(args);
            if (
              result &&
              (result as { tenantId?: string }).tenantId !== tenantId
            ) {
              return operation === "findUniqueOrThrow"
                ? Promise.reject(
                    new Prisma.PrismaClientKnownRequestError("Not found", {
                      code: "P2025",
                      clientVersion: Prisma.prismaVersion.client,
                    }),
                  )
                : null;
            }
            if (result && injectedTenantId) {
              const { tenantId: _drop, ...rest } = result as Record<
                string,
                unknown
              >;
              return rest;
            }
            return result;
          }

          // Oluşturma → data'ya tenantId bas
          if (operation === "create") {
            a.data = { ...(a.data as object), tenantId };
          }
          if (operation === "createMany") {
            const d = a.data;
            a.data = Array.isArray(d)
              ? d.map((row) => ({ ...row, tenantId }))
              : { ...(d as object), tenantId };
          }

          // update / delete / upsert → önce aidiyet kontrolü
          if (["update", "delete", "upsert"].includes(operation)) {
            const where = a.where as { id?: string };
            if (where?.id) {
              const modelKey = (model.charAt(0).toLowerCase() +
                model.slice(1)) as keyof typeof prisma;
              const existing = await (
                prisma[modelKey] as unknown as {
                  findUnique: (
                    q: object,
                  ) => Promise<{ tenantId?: string } | null>;
                }
              ).findUnique({
                where: { id: where.id },
                select: { tenantId: true },
              });
              if (!existing || existing.tenantId !== tenantId) {
                throw new Prisma.PrismaClientKnownRequestError("Not found", {
                  code: "P2025",
                  clientVersion: Prisma.prismaVersion.client,
                });
              }
            }
          }

          return query(args);
        },
      },
    },
  });
}

export type TenantClient = ReturnType<typeof forTenant>;
