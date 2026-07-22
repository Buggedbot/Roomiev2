import { prisma } from "@/lib/prisma";

export async function assertParticipant(matchId: string, userId: string) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return null;
  if (match.userAId === userId || match.userBId === userId) return match;

  if (match.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: match.teamId, userId } },
    });
    if (membership) return match;
  }

  return null;
}
