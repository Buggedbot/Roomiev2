"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crown, LogOut, UserPlus, Users } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { Avatar } from "@/components/avatar";

type TeamMemberView = {
  userId: string;
  name: string;
  photoUrl: string | null;
  isCaptain: boolean;
};

type TeamView = {
  id: string;
  captainId: string;
  members: TeamMemberView[];
  size: number;
  maxSize: number;
};

type PendingInvite = {
  id: string;
  team: TeamView;
};

type TeamsResponse = {
  listingType: "HAS_ROOM" | "NEEDS_ROOM" | null;
  team: TeamView | null;
  isCaptain: boolean;
  pendingInvites: PendingInvite[];
  invitableMatches: { userId: string; name: string; photoUrl: string | null }[];
};

export default function TeamsPage() {
  const [data, setData] = useState<TeamsResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch("/api/teams")
      .then((res) => res.json())
      .then(setData);
  }

  useEffect(load, []);

  async function withBusy(fn: () => Promise<Response>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Something went wrong");
        return;
      }
      load();
    } finally {
      setBusy(false);
    }
  }

  function createTeam() {
    void withBusy(() => fetch("/api/teams", { method: "POST" }));
  }

  function leaveTeam() {
    void withBusy(() => fetch("/api/teams/leave", { method: "POST" }));
  }

  function invite(toUserId: string) {
    void withBusy(() =>
      fetch("/api/teams/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId }),
      })
    );
  }

  function respondToInvite(inviteId: string, accept: boolean) {
    void withBusy(() =>
      fetch(`/api/teams/invites/${inviteId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept }),
      })
    );
  }

  if (!data) {
    return <div className="flex flex-1 items-center justify-center text-muted">Loading…</div>;
  }

  if (data.listingType !== "NEEDS_ROOM") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
        <Users className="h-8 w-8 text-muted" />
        <p className="text-lg font-medium">Teams are for people looking for a room together</p>
        <p className="max-w-sm text-sm text-muted">
          Set your profile to &quot;I need a room too&quot; to form a team with people you&apos;ve
          matched with and search together.
        </p>
        <Link href="/profile/setup" className="text-sm font-medium text-primary">
          Update your profile
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold">Your team</h1>
      <p className="mt-1 text-sm text-muted">
        Team up with people you&apos;ve matched with to search for a room together. HAS_ROOM
        listers will see your team as one combined card.
      </p>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      {!data.team && (
        <Card className="mt-6 p-6 text-center">
          <p className="text-sm text-muted">You&apos;re not in a team yet.</p>
          <Button onClick={createTeam} disabled={busy} className="mt-4">
            <Users className="h-4 w-4" /> Create a team
          </Button>
        </Card>
      )}

      {data.pendingInvites.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-muted">Invites for you</h2>
          <div className="mt-2 space-y-2">
            {data.pendingInvites.map((invite) => (
              <Card key={invite.id} className="flex items-center gap-3 p-4">
                <div className="flex -space-x-2">
                  {invite.team.members.map((m) => (
                    <Avatar
                      key={m.userId}
                      name={m.name}
                      photoUrl={m.photoUrl}
                      className="h-9 w-9 border-2 border-card text-sm"
                    />
                  ))}
                </div>
                <p className="flex-1 text-sm">
                  {invite.team.members.map((m) => m.name).join(", ")} invited you to team up
                </p>
                <Button
                  onClick={() => respondToInvite(invite.id, true)}
                  disabled={busy}
                  className="px-3 py-1.5 text-xs"
                >
                  Accept
                </Button>
                <Button
                  variant="outline"
                  onClick={() => respondToInvite(invite.id, false)}
                  disabled={busy}
                  className="px-3 py-1.5 text-xs"
                >
                  Decline
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {data.team && (
        <Card className="mt-6 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">
              Members ({data.team.size}/{data.team.maxSize})
            </h2>
            <Button variant="outline" onClick={leaveTeam} disabled={busy} className="px-3 py-1.5 text-xs">
              <LogOut className="h-3.5 w-3.5" /> {data.isCaptain ? "Disband team" : "Leave team"}
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {data.team.members.map((m) => (
              <div key={m.userId} className="flex items-center gap-3">
                <Avatar name={m.name} photoUrl={m.photoUrl} className="h-10 w-10 text-sm" />
                <p className="flex-1 text-sm font-medium">{m.name}</p>
                {m.isCaptain && (
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    <Crown className="h-3 w-3" /> Captain
                  </span>
                )}
              </div>
            ))}
          </div>

          {data.isCaptain && (
            <div className="mt-6 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-muted">Invite from your matches</h3>
              {data.team.size >= data.team.maxSize ? (
                <p className="mt-2 text-sm text-muted">Your team is full.</p>
              ) : data.invitableMatches.length === 0 ? (
                <p className="mt-2 text-sm text-muted">
                  No eligible matches to invite yet — match with someone who also needs a room
                  first.
                </p>
              ) : (
                <div className="mt-2 space-y-2">
                  {data.invitableMatches.map((match) => (
                    <div key={match.userId} className="flex items-center gap-3">
                      <Avatar name={match.name} photoUrl={match.photoUrl} className="h-9 w-9 text-sm" />
                      <p className="flex-1 text-sm">{match.name}</p>
                      <Button
                        variant="outline"
                        onClick={() => invite(match.userId)}
                        disabled={busy}
                        className="px-3 py-1.5 text-xs"
                      >
                        <UserPlus className="h-3.5 w-3.5" /> Invite
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
