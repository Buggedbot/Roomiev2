import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const MAX_TEAM_SIZE = 3;

export const teamInclude = {
  members: {
    orderBy: { joinedAt: "asc" },
    include: {
      user: {
        include: {
          profile: true,
          photos: { orderBy: { position: "asc" }, take: 1 },
        },
      },
    },
  },
} satisfies Prisma.TeamInclude;

export type TeamWithMembers = Prisma.TeamGetPayload<{ include: typeof teamInclude }>;

export async function getActiveTeamForUser(userId: string): Promise<TeamWithMembers | null> {
  const membership = await prisma.teamMember.findFirst({
    where: { userId, team: { status: "ACTIVE" } },
    include: { team: { include: teamInclude } },
  });
  return membership?.team ?? null;
}

export function formatTeamName(names: string[]): string {
  if (names.length === 0) return "Team";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

export function serializeTeam(team: TeamWithMembers) {
  return {
    id: team.id,
    captainId: team.captainId,
    members: team.members.map((m) => ({
      userId: m.userId,
      name: m.user.profile?.name ?? "Unknown",
      photoUrl: m.user.photos[0]?.url ?? null,
      isCaptain: m.userId === team.captainId,
    })),
    size: team.members.length,
    maxSize: MAX_TEAM_SIZE,
  };
}
