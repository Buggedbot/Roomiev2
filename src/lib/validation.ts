import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const phoneSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/, "Enter a valid phone number with country code"),
});

export const phoneVerificationSchema = phoneSchema.extend({
  code: z.string().regex(/^\d{4,10}$/, "Enter the verification code you received"),
});

const profileBaseSchema = z.object({
  name: z.string().min(1).max(80),
  bio: z.string().max(500).default(""),
  age: z.coerce.number().int().min(16).max(100),
  gender: z.enum(["MALE", "FEMALE", "NON_BINARY", "OTHER"]),
  genderPreference: z.enum(["MALE", "FEMALE", "ANY"]).default("ANY"),
  listingType: z.enum(["HAS_ROOM", "NEEDS_ROOM"]),

  college: z.string().min(1).max(120),
  course: z.string().max(120).optional().or(z.literal("")),
  year: z.coerce.number().int().min(1).max(8).optional(),

  city: z.string().min(1).max(80),
  state: z.string().max(80).optional().or(z.literal("")),
  country: z.string().max(80).optional().or(z.literal("")),
  placeId: z.string().max(200).optional().or(z.literal("")),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  preferredArea: z.string().max(120).optional().or(z.literal("")),
  budgetMin: z.coerce.number().int().min(0),
  budgetMax: z.coerce.number().int().min(0),

  languages: z.array(z.string()).default([]),
  foodPreference: z.enum(["VEG", "NON_VEG", "VEGAN", "EGGETARIAN"]),
  smoking: z.enum(["NEVER", "SOMETIMES", "REGULARLY"]).default("NEVER"),
  drinking: z.enum(["NEVER", "SOMETIMES", "REGULARLY"]).default("NEVER"),
  sleepSchedule: z.enum(["EARLY_BIRD", "NIGHT_OWL", "FLEXIBLE"]),
  cleanliness: z.enum(["RELAXED", "MODERATE", "VERY_CLEAN"]),
  pets: z.coerce.boolean().default(false),
  studyHabits: z.enum(["QUIET", "MODERATE", "SOCIAL"]).default("MODERATE"),
  interests: z.array(z.string()).default([]),

  moveInDate: z.coerce.date().optional(),
});

// Used for the final "Find my matches" submission — every field required.
export const profileSchema = profileBaseSchema.refine((data) => data.budgetMax >= data.budgetMin, {
  message: "Budget max must be greater than or equal to budget min",
  path: ["budgetMax"],
});

// Used for autosaving in-progress sections of the onboarding form — every
// field optional, so a partial draft can be persisted before the profile is complete.
export const profileDraftSchema = profileBaseSchema.partial();

export const swipeSchema = z
  .object({
    toUserId: z.string().min(1).optional(),
    toTeamId: z.string().min(1).optional(),
    action: z.enum(["LIKE", "SUPER_LIKE", "PASS"]),
  })
  .refine((data) => Boolean(data.toUserId) !== Boolean(data.toTeamId), {
    message: "Provide exactly one of toUserId or toTeamId",
  });

export const messageSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const editMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});
