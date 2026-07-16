import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const profileSchema = z.object({
  name: z.string().min(1).max(80),
  bio: z.string().max(500).default(""),
  age: z.coerce.number().int().min(16).max(100),
  gender: z.enum(["MALE", "FEMALE", "NON_BINARY", "OTHER"]),
  genderPreference: z.enum(["MALE", "FEMALE", "ANY"]).default("ANY"),

  college: z.string().min(1).max(120),
  course: z.string().max(120).optional().or(z.literal("")),
  year: z.coerce.number().int().min(1).max(8).optional(),

  city: z.string().min(1).max(80),
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
}).refine((data) => data.budgetMax >= data.budgetMin, {
  message: "Budget max must be greater than or equal to budget min",
  path: ["budgetMax"],
});

export const swipeSchema = z.object({
  toUserId: z.string().min(1),
  action: z.enum(["LIKE", "SUPER_LIKE", "PASS"]),
});

export const messageSchema = z.object({
  content: z.string().min(1).max(2000),
});
