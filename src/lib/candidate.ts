import type { CompatibilityFactor } from "@/lib/matching";

export type CandidateMember = {
  userId: string;
  name: string;
  age: number;
  photoUrl: string | null;
};

// A Discover card. Individual candidates have a single-element `members`
// array; team candidates (2-3 NEEDS_ROOM users searching together) combine
// everyone into one card so a HAS_ROOM lister can match with the whole group.
export type Candidate = {
  id: string;
  isTeam: boolean;
  members: CandidateMember[];
  name: string;
  age: number | null;
  bio: string;
  college: string;
  course: string | null;
  listingType: "HAS_ROOM" | "NEEDS_ROOM";
  city: string;
  preferredArea: string | null;
  budgetMin: number;
  budgetMax: number;
  interests: string[];
  verified: boolean;
  photoUrl: string | null;
  compatibilityScore: number;
  compatibilityBreakdown: CompatibilityFactor[];
};
