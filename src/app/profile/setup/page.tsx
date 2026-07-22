"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Camera,
  Check,
  ChevronLeft,
  CloudAlert,
  CloudCheck,
  GraduationCap,
  KeyRound,
  Loader2,
  MapPin,
  Sparkles,
  Users,
  UserRound,
} from "lucide-react";
import { Button, Card, ErrorText, Input, Label, Select, Textarea } from "@/components/ui";
import { PhotoUploader } from "@/components/photo-uploader";
import { CityAutocomplete, type CitySelection } from "@/components/city-autocomplete";
import { AreaAutocomplete } from "@/components/area-autocomplete";

type FormState = {
  listingType: string;
  name: string;
  bio: string;
  age: string;
  gender: string;
  genderPreference: string;
  college: string;
  course: string;
  year: string;
  city: string;
  state: string;
  country: string;
  placeId: string;
  latitude: number | null;
  longitude: number | null;
  preferredArea: string;
  budgetMin: string;
  budgetMax: string;
  languages: string;
  foodPreference: string;
  smoking: string;
  drinking: string;
  sleepSchedule: string;
  cleanliness: string;
  pets: boolean;
  studyHabits: string;
  interests: string;
  moveInDate: string;
};

const initialState: FormState = {
  listingType: "",
  name: "",
  bio: "",
  age: "",
  gender: "MALE",
  genderPreference: "ANY",
  college: "",
  course: "",
  year: "",
  city: "",
  state: "",
  country: "",
  placeId: "",
  latitude: null,
  longitude: null,
  preferredArea: "",
  budgetMin: "",
  budgetMax: "",
  languages: "",
  foodPreference: "VEG",
  smoking: "NEVER",
  drinking: "NEVER",
  sleepSchedule: "FLEXIBLE",
  cleanliness: "MODERATE",
  pets: false,
  studyHabits: "MODERATE",
  interests: "",
  moveInDate: "",
};

const profileSteps = [
  {
    title: "What are you looking for?",
    shortTitle: "Intent",
    description: "Tell us whether you already have a room or you're searching for one together.",
    icon: KeyRound,
  },
  {
    title: "Add your photos",
    shortTitle: "Photos",
    description: "A friendly photo helps future roommates get to know you.",
    icon: Camera,
  },
  {
    title: "Tell us about you",
    shortTitle: "Basics",
    description: "Share the essentials that make your profile feel personal.",
    icon: UserRound,
  },
  {
    title: "Where you study",
    shortTitle: "School",
    description: "Help us find people who understand your student life.",
    icon: GraduationCap,
  },
  {
    title: "Your ideal home",
    shortTitle: "Location",
    description: "Set your city, preferred area, and comfortable budget.",
    icon: MapPin,
  },
  {
    title: "Your daily rhythm",
    shortTitle: "Lifestyle",
    description: "A few preferences make every match more compatible.",
    icon: Sparkles,
  },
];

export default function ProfileSetupPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const skipNextAutosave = useRef(true);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const step = profileSteps[currentStep];
  const StepIcon = step.icon;
  const isLastStep = currentStep === profileSteps.length - 1;

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          const profile = data.profile;
          setIsEditMode(Boolean(profile.isComplete));
          setForm({
            listingType: profile.listingType ?? "",
            name: profile.name ?? "",
            bio: profile.bio ?? "",
            age: String(profile.age ?? ""),
            gender: profile.gender ?? "MALE",
            genderPreference: profile.genderPreference ?? "ANY",
            college: profile.college ?? "",
            course: profile.course ?? "",
            year: profile.year ? String(profile.year) : "",
            city: profile.city ?? "",
            state: profile.state ?? "",
            country: profile.country ?? "",
            placeId: profile.placeId ?? "",
            latitude: profile.latitude ?? null,
            longitude: profile.longitude ?? null,
            preferredArea: profile.preferredArea ?? "",
            budgetMin: String(profile.budgetMin ?? ""),
            budgetMax: String(profile.budgetMax ?? ""),
            languages: (profile.languages ?? []).join(", "),
            foodPreference: profile.foodPreference ?? "VEG",
            smoking: profile.smoking ?? "NEVER",
            drinking: profile.drinking ?? "NEVER",
            sleepSchedule: profile.sleepSchedule ?? "FLEXIBLE",
            cleanliness: profile.cleanliness ?? "MODERATE",
            pets: profile.pets ?? false,
            studyHabits: profile.studyHabits ?? "MODERATE",
            interests: (profile.interests ?? []).join(", "),
            moveInDate: profile.moveInDate ? profile.moveInDate.slice(0, 10) : "",
          });
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  // The profile load above changes `form`, which would otherwise be mistaken
  // for a user edit by the autosave effect below — re-arm the skip guard
  // whenever `loaded` flips, so that load never triggers a spurious save.
  useEffect(() => {
    if (loaded) skipNextAutosave.current = true;
  }, [loaded]);

  useEffect(() => {
    if (!loaded) return;
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false;
      return;
    }

    setAutosaveStatus("idle");
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      void saveDraft();
    }, 1000);

    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
    // buildPayload/saveDraft are plain functions of `form`; including them would defeat the debounce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, loaded]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((currentForm) => ({ ...currentForm, [key]: value }));
  }

  function handleCityValueChange(text: string) {
    setForm((current) => ({
      ...current,
      city: text,
      placeId: "",
      latitude: null,
      longitude: null,
      preferredArea: current.city === text ? current.preferredArea : "",
    }));
  }

  function handleCitySelect(selection: CitySelection) {
    setForm((current) => ({
      ...current,
      city: selection.city,
      state: selection.state,
      country: selection.country,
      placeId: selection.placeId,
      latitude: selection.latitude,
      longitude: selection.longitude,
      preferredArea: current.city === selection.city ? current.preferredArea : "",
    }));
  }

  function blockNonNumericKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (["e", "E", "+", "-", "."].includes(event.key)) {
      event.preventDefault();
    }
  }

  function moveToStep(nextStep: number) {
    // First-time onboarding still moves forward one step at a time so
    // required fields aren't skipped; editing an already-complete profile
    // allows jumping straight to any section.
    if (!isEditMode && nextStep > currentStep) {
      if (currentStep === 0 && !form.listingType) {
        setError("Choose one of the two options to continue.");
        return;
      }
      const setupForm = document.getElementById("profile-setup-form") as HTMLFormElement | null;
      if (!setupForm?.reportValidity()) return;
    }

    setError(null);
    setCurrentStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Flush a save on every step change so progress survives an accidental
    // navigation away, instead of waiting for the debounce below to fire.
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    void saveDraft();
  }

  async function saveDraft() {
    setAutosaveStatus("saving");
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(false)),
      });
      setAutosaveStatus(response.ok ? "saved" : "error");
    } catch {
      setAutosaveStatus("error");
    }
  }

  function buildPayload(finalize: boolean) {
    const raw: Record<string, unknown> = {
      ...form,
      age: form.age ? Number(form.age) : undefined,
      year: form.year ? Number(form.year) : undefined,
      latitude: form.latitude ?? undefined,
      longitude: form.longitude ?? undefined,
      budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
      budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
      languages: form.languages
        .split(",")
        .map((language) => language.trim())
        .filter(Boolean),
      interests: form.interests
        .split(",")
        .map((interest) => interest.trim())
        .filter(Boolean),
      moveInDate: form.moveInDate || undefined,
      finalize,
    };

    // Drop empty-string fields so a partial draft doesn't trip "required"
    // validation on sections the user hasn't reached yet.
    for (const key of Object.keys(raw)) {
      if (raw[key] === "") delete raw[key];
    }
    return raw;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(true)),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      if (isEditMode) {
        setAutosaveStatus("saved");
      } else {
        router.push("/discover");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (!loaded) return null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
      <div className="text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" /> {isEditMode ? "Edit profile" : "Profile setup"}
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          {isEditMode ? "Update your roommate profile" : "Find a roommate who fits your rhythm"}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted sm:text-base">
          {isEditMode
            ? "Jump to any section below — your changes save automatically."
            : "A few thoughtful details help us introduce you to compatible people."}
        </p>
      </div>

      <div className="mt-8" aria-label="Profile setup progress">
        <div className="flex items-center justify-between text-xs font-medium text-muted">
          <span>Step {currentStep + 1} of {profileSteps.length}</span>
          <span className="flex items-center gap-3">
            {autosaveStatus === "saving" && (
              <span className="flex items-center gap-1.5 text-muted">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
              </span>
            )}
            {autosaveStatus === "saved" && (
              <span className="flex items-center gap-1.5 text-primary">
                <CloudCheck className="h-3.5 w-3.5" /> Saved
              </span>
            )}
            {autosaveStatus === "error" && (
              <span className="flex items-center gap-1.5 text-red-500">
                <CloudAlert className="h-3.5 w-3.5" /> Couldn&apos;t save
              </span>
            )}
            <span>{step.shortTitle}</span>
          </span>
        </div>
        <div className="mt-3 grid grid-cols-6 gap-2">
          {profileSteps.map((profileStep, index) => {
            const isActive = index === currentStep;
            const isComplete = index < currentStep;
            const Icon = profileStep.icon;

            return (
              <button
                key={profileStep.shortTitle}
                type="button"
                aria-label={`Go to ${profileStep.shortTitle}`}
                aria-current={isActive ? "step" : undefined}
                disabled={!isEditMode && index > currentStep}
                onClick={() => moveToStep(index)}
                className={`group flex items-center gap-2 rounded-full transition ${
                  isActive ? "text-primary" : isComplete ? "text-foreground" : "text-muted"
                } disabled:cursor-default`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                      : isComplete
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border bg-card"
                  }`}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <span className="hidden truncate text-xs sm:block">{profileStep.shortTitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      <form id="profile-setup-form" onSubmit={handleSubmit} className="mt-8">
        <Card className="overflow-hidden border-border/80 shadow-xl shadow-black/5">
          <div className="border-b border-border/80 bg-gradient-to-br from-primary/10 via-card to-card px-6 py-6 sm:px-8">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
                <StepIcon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-semibold">{step.title}</h2>
                <p className="mt-1 text-sm leading-6 text-muted">{step.description}</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {currentStep === 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => update("listingType", "HAS_ROOM")}
                  className={`flex flex-col items-start gap-3 rounded-2xl border-2 p-5 text-left transition ${
                    form.listingType === "HAS_ROOM"
                      ? "border-primary bg-primary/5 shadow-sm shadow-primary/20"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      form.listingType === "HAS_ROOM" ? "bg-primary text-primary-foreground" : "bg-foreground/5"
                    }`}
                  >
                    <KeyRound className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold">I already have a room</p>
                    <p className="mt-1 text-sm text-muted">
                      You have a place and want to find a roommate to join you.
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => update("listingType", "NEEDS_ROOM")}
                  className={`flex flex-col items-start gap-3 rounded-2xl border-2 p-5 text-left transition ${
                    form.listingType === "NEEDS_ROOM"
                      ? "border-primary bg-primary/5 shadow-sm shadow-primary/20"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      form.listingType === "NEEDS_ROOM" ? "bg-primary text-primary-foreground" : "bg-foreground/5"
                    }`}
                  >
                    <Users className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold">I need a room too</p>
                    <p className="mt-1 text-sm text-muted">
                      You're also searching, and want to match with someone to find a place together.
                    </p>
                  </div>
                </button>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-5">
                <PhotoUploader />
                <p className="rounded-xl bg-foreground/5 px-4 py-3 text-sm text-muted">
                  Start with your best photo. You can add more now or return later to update them.
                </p>
              </div>
            )}

            {currentStep === 2 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" required value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="What should roommates call you?" />
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" required min={16} max={100} value={form.age} onChange={(event) => update("age", event.target.value)} />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select id="gender" value={form.gender} onChange={(event) => update("gender", event.target.value)}>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="NON_BINARY">Non-binary</option>
                    <option value="OTHER">Other</option>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="genderPreference">Roommate gender preference</Label>
                  <Select id="genderPreference" value={form.genderPreference} onChange={(event) => update("genderPreference", event.target.value)}>
                    <option value="ANY">No preference</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" rows={4} value={form.bio} onChange={(event) => update("bio", event.target.value)} placeholder="A little about you, your routines, and what you value in a roommate…" />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="college">College / University</Label>
                  <Input id="college" required value={form.college} onChange={(event) => update("college", event.target.value)} placeholder="Your campus or university" />
                </div>
                <div>
                  <Label htmlFor="course">Course</Label>
                  <Input id="course" value={form.course} onChange={(event) => update("course", event.target.value)} placeholder="e.g. Computer Science" />
                </div>
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" type="number" min={1} max={8} value={form.year} onChange={(event) => update("year", event.target.value)} placeholder="e.g. 2" />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="city">City</Label>
                  <CityAutocomplete
                    id="city"
                    required
                    value={form.city}
                    onValueChange={handleCityValueChange}
                    onSelect={handleCitySelect}
                  />
                </div>
                <div>
                  <Label htmlFor="preferredArea">Preferred area</Label>
                  <AreaAutocomplete
                    id="preferredArea"
                    city={form.city}
                    value={form.preferredArea}
                    onValueChange={(text) => update("preferredArea", text)}
                  />
                </div>
                <div>
                  <Label htmlFor="budgetMin">Budget min (per month)</Label>
                  <Input id="budgetMin" type="number" required min={0} inputMode="numeric" pattern="[0-9]*" value={form.budgetMin} onKeyDown={blockNonNumericKey} onChange={(event) => update("budgetMin", event.target.value.replace(/[^0-9]/g, ""))} placeholder="e.g. 12000" />
                </div>
                <div>
                  <Label htmlFor="budgetMax">Budget max (per month)</Label>
                  <Input id="budgetMax" type="number" required min={0} inputMode="numeric" pattern="[0-9]*" value={form.budgetMax} onKeyDown={blockNonNumericKey} onChange={(event) => update("budgetMax", event.target.value.replace(/[^0-9]/g, ""))} placeholder="e.g. 18000" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="moveInDate">Move-in date</Label>
                  <Input id="moveInDate" type="date" value={form.moveInDate} onChange={(event) => update("moveInDate", event.target.value)} />
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="foodPreference">Food preference</Label>
                  <Select id="foodPreference" value={form.foodPreference} onChange={(event) => update("foodPreference", event.target.value)}>
                    <option value="VEG">Vegetarian</option>
                    <option value="NON_VEG">Non-vegetarian</option>
                    <option value="VEGAN">Vegan</option>
                    <option value="EGGETARIAN">Eggetarian</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sleepSchedule">Sleep schedule</Label>
                  <Select id="sleepSchedule" value={form.sleepSchedule} onChange={(event) => update("sleepSchedule", event.target.value)}>
                    <option value="EARLY_BIRD">Early bird</option>
                    <option value="NIGHT_OWL">Night owl</option>
                    <option value="FLEXIBLE">Flexible</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="smoking">Smoking</Label>
                  <Select id="smoking" value={form.smoking} onChange={(event) => update("smoking", event.target.value)}>
                    <option value="NEVER">Never</option>
                    <option value="SOMETIMES">Sometimes</option>
                    <option value="REGULARLY">Regularly</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="drinking">Drinking</Label>
                  <Select id="drinking" value={form.drinking} onChange={(event) => update("drinking", event.target.value)}>
                    <option value="NEVER">Never</option>
                    <option value="SOMETIMES">Sometimes</option>
                    <option value="REGULARLY">Regularly</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cleanliness">Cleanliness</Label>
                  <Select id="cleanliness" value={form.cleanliness} onChange={(event) => update("cleanliness", event.target.value)}>
                    <option value="RELAXED">Relaxed</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="VERY_CLEAN">Very clean</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="studyHabits">Study habits</Label>
                  <Select id="studyHabits" value={form.studyHabits} onChange={(event) => update("studyHabits", event.target.value)}>
                    <option value="QUIET">Quiet / focused</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="SOCIAL">Social / group study</option>
                  </Select>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-foreground/[0.03] px-4 py-3 sm:col-span-2">
                  <input id="pets" type="checkbox" checked={form.pets} onChange={(event) => update("pets", event.target.checked)} className="h-4 w-4 rounded border-border accent-primary" />
                  <Label htmlFor="pets">I have or am okay with pets</Label>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="languages">Languages</Label>
                  <Input id="languages" value={form.languages} onChange={(event) => update("languages", event.target.value)} placeholder="English, Hindi" />
                  <p className="mt-1.5 text-xs text-muted">Separate languages with commas.</p>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="interests">Interests</Label>
                  <Input id="interests" value={form.interests} onChange={(event) => update("interests", event.target.value)} placeholder="Gaming, hiking, cooking" />
                  <p className="mt-1.5 text-xs text-muted">Separate interests with commas.</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        <ErrorText>{error}</ErrorText>

        <div className="mt-6 flex items-center justify-between gap-3">
          {currentStep > 0 ? (
            <Button type="button" variant="outline" onClick={() => moveToStep(currentStep - 1)}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
          ) : (
            <span />
          )}

          {isEditMode || isLastStep ? (
            <Button type="submit" disabled={loading} className="min-w-40">
              {loading ? "Saving…" : isEditMode ? "Save changes" : "Find my matches"}{" "}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          ) : (
            <Button type="button" onClick={() => moveToStep(currentStep + 1)} className="min-w-36">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
