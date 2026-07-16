import type { Profile } from "@/generated/prisma/client";

export type CompatibilityFactor = {
  factor: string;
  weight: number;
  score: number; // 0-1
  reason: string;
};

export type CompatibilityResult = {
  score: number; // 0-100
  breakdown: CompatibilityFactor[];
};

const WEIGHTS = {
  budget: 20,
  cleanliness: 15,
  sleepSchedule: 15,
  smoking: 15,
  food: 10,
  area: 10,
  languages: 5,
  interests: 5,
  studyHabits: 5,
} as const;

// Roommates need to actually be able to live together in the same place —
// these aren't "nice to have" match signals, they gate whether a profile
// is shown at all.
export function passesHardFilters(me: Profile, other: Profile): boolean {
  if (me.city.trim().toLowerCase() !== other.city.trim().toLowerCase()) {
    return false;
  }
  const meAccepts =
    me.genderPreference === "ANY" || me.genderPreference === other.gender;
  const otherAccepts =
    other.genderPreference === "ANY" || other.genderPreference === me.gender;
  return meAccepts && otherAccepts;
}

function ordinalScore(a: number, b: number, max: number): number {
  return 1 - Math.abs(a - b) / max;
}

function jaccard(a: string[], b: string[]): number {
  const setA = new Set(a.map((s) => s.toLowerCase()));
  const setB = new Set(b.map((s) => s.toLowerCase()));
  if (setA.size === 0 && setB.size === 0) return 0.5;
  const intersection = [...setA].filter((x) => setB.has(x));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0.5 : intersection.length / union.size;
}

function budgetScore(me: Profile, other: Profile): number {
  const overlap =
    Math.min(me.budgetMax, other.budgetMax) -
    Math.max(me.budgetMin, other.budgetMin);
  if (overlap >= 0) return 1;
  const gap = Math.abs(overlap);
  return Math.max(0, 1 - gap / 5000);
}

const CLEANLINESS_ORDER = { RELAXED: 0, MODERATE: 1, VERY_CLEAN: 2 };
const HABIT_ORDER = { NEVER: 0, SOMETIMES: 1, REGULARLY: 2 };
const STUDY_ORDER = { QUIET: 0, MODERATE: 1, SOCIAL: 2 };
const FOOD_GROUP: Record<string, string> = {
  VEG: "plant",
  VEGAN: "plant",
  EGGETARIAN: "mixed",
  NON_VEG: "mixed",
};

function sleepScore(me: Profile, other: Profile): number {
  if (me.sleepSchedule === other.sleepSchedule) return 1;
  if (me.sleepSchedule === "FLEXIBLE" || other.sleepSchedule === "FLEXIBLE") {
    return 0.85;
  }
  return 0.2; // EARLY_BIRD vs NIGHT_OWL
}

function foodScore(me: Profile, other: Profile): number {
  if (me.foodPreference === other.foodPreference) return 1;
  return FOOD_GROUP[me.foodPreference] === FOOD_GROUP[other.foodPreference]
    ? 0.7
    : 0.3;
}

function areaScore(me: Profile, other: Profile): number {
  if (!me.preferredArea || !other.preferredArea) return 0.6;
  return me.preferredArea.trim().toLowerCase() ===
    other.preferredArea.trim().toLowerCase()
    ? 1
    : 0.3;
}

export function computeCompatibility(
  me: Profile,
  other: Profile
): CompatibilityResult {
  const factors: CompatibilityFactor[] = [
    {
      factor: "Budget",
      weight: WEIGHTS.budget,
      score: budgetScore(me, other),
      reason:
        Math.min(me.budgetMax, other.budgetMax) -
          Math.max(me.budgetMin, other.budgetMin) >=
        0
          ? "Your budget ranges overlap"
          : "Your budget ranges don't overlap much",
    },
    {
      factor: "Cleanliness",
      weight: WEIGHTS.cleanliness,
      score: ordinalScore(
        CLEANLINESS_ORDER[me.cleanliness],
        CLEANLINESS_ORDER[other.cleanliness],
        2
      ),
      reason:
        me.cleanliness === other.cleanliness
          ? "You have the same cleanliness standards"
          : "Your cleanliness standards differ somewhat",
    },
    {
      factor: "Sleep schedule",
      weight: WEIGHTS.sleepSchedule,
      score: sleepScore(me, other),
      reason:
        me.sleepSchedule === other.sleepSchedule
          ? "You keep the same hours"
          : "Your sleep schedules may clash",
    },
    {
      factor: "Smoking",
      weight: WEIGHTS.smoking,
      score: ordinalScore(
        HABIT_ORDER[me.smoking],
        HABIT_ORDER[other.smoking],
        2
      ),
      reason:
        me.smoking === other.smoking
          ? "You have matching smoking habits"
          : "Your smoking habits differ",
    },
    {
      factor: "Food",
      weight: WEIGHTS.food,
      score: foodScore(me, other),
      reason:
        me.foodPreference === other.foodPreference
          ? "Same food preference"
          : "Different food preferences",
    },
    {
      factor: "Preferred area",
      weight: WEIGHTS.area,
      score: areaScore(me, other),
      reason:
        me.preferredArea &&
        other.preferredArea &&
        me.preferredArea.toLowerCase() === other.preferredArea.toLowerCase()
          ? "You want to live in the same area"
          : "Preferred areas differ or are flexible",
    },
    {
      factor: "Languages",
      weight: WEIGHTS.languages,
      score: jaccard(me.languages, other.languages),
      reason: "Based on shared languages",
    },
    {
      factor: "Interests",
      weight: WEIGHTS.interests,
      score: jaccard(me.interests, other.interests),
      reason: "Based on shared interests",
    },
    {
      factor: "Study habits",
      weight: WEIGHTS.studyHabits,
      score: ordinalScore(
        STUDY_ORDER[me.studyHabits],
        STUDY_ORDER[other.studyHabits],
        2
      ),
      reason:
        me.studyHabits === other.studyHabits
          ? "You study the same way"
          : "Study habits differ somewhat",
    },
  ];

  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const weightedScore = factors.reduce(
    (sum, f) => sum + f.score * f.weight,
    0
  );
  const score = Math.round((weightedScore / totalWeight) * 100);

  return { score, breakdown: factors.sort((a, b) => b.weight - a.weight) };
}
