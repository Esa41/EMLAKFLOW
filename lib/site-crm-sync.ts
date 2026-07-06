import { prisma } from "@/lib/prisma";

type SiteUserInput = {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone?: string | null;
};

/** Vitrin üyesini CRM'de Contact olarak oluşturur veya mevcut kaydı bağlar. */
export async function syncSiteUserToContact(input: SiteUserInput): Promise<string> {
  const { id, tenantId, name, email, phone } = input;

  const siteUser = await prisma.siteUser.findUnique({
    where: { id },
    select: { contactId: true },
  });

  if (siteUser?.contactId) {
    await prisma.contact.update({
      where: { id: siteUser.contactId },
      data: { fullName: name, email, phone: phone ?? null },
    });
    return siteUser.contactId;
  }

  const or: Array<{ email?: { equals: string; mode: "insensitive" }; phone?: string }> = [];
  if (email) or.push({ email: { equals: email, mode: "insensitive" } });
  if (phone && phone.replace(/\D/g, "").length >= 10) or.push({ phone });

  const matched = or.length
    ? await prisma.contact.findFirst({
        where: { tenantId, OR: or },
        select: { id: true },
      })
    : null;

  let contactId = matched?.id;
  if (!contactId) {
    const created = await prisma.contact.create({
      data: {
        tenantId,
        fullName: name,
        email,
        phone: phone ?? null,
        type: "BUYER",
        note: "Vitrin üyesi — otomatik oluşturuldu",
      },
      select: { id: true },
    });
    contactId = created.id;
  } else {
    await prisma.contact.update({
      where: { id: contactId },
      data: { fullName: name, email, phone: phone ?? null },
    });
  }

  await prisma.siteUser.update({
    where: { id },
    data: { contactId },
  });

  return contactId;
}
