/** Ofis içi sohbet oturum kimlikleri — TEAM grubu ve DM çiftleri. */

export const TEAM_SESSION = "TEAM";

export function dmSessionId(userA: string, userB: string): string {
  const [a, b] = [userA, userB].sort();
  return `DM:${a}:${b}`;
}

export function isDmSession(sessionId: string): boolean {
  return sessionId.startsWith("DM:");
}

export function peerFromDmSession(
  sessionId: string,
  currentUserId: string,
): string | null {
  if (!isDmSession(sessionId)) return null;
  const parts = sessionId.split(":");
  if (parts.length !== 3) return null;
  const [, id1, id2] = parts;
  if (id1 === currentUserId) return id2;
  if (id2 === currentUserId) return id1;
  return null;
}

export function isInternalSession(sessionId: string | null | undefined): boolean {
  if (!sessionId) return false;
  return sessionId === TEAM_SESSION || isDmSession(sessionId);
}
