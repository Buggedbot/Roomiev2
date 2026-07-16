"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, ErrorText, Input, Label, Select, Textarea } from "@/components/ui";

type FormState = {
  name: string;
  bio: string;
  age: string;
  gender: string;
  genderPreference: string;
  college: string;
  course: string;
  year: string;
  city: string;
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
  name: "",
  bio: "",
  age: "",
  gender: "MALE",
  genderPreference: "ANY",
  college: "",
  course: "",
  year: "",
  city: "",
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

export default function ProfileSetupPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          const p = data.profile;
          setForm({
            name: p.name ?? "",
            bio: p.bio ?? "",
            age: String(p.age ?? ""),
            gender: p.gender ?? "MALE",
            genderPreference: p.genderPreference ?? "ANY",
            college: p.college ?? "",
            course: p.course ?? "",
            year: p.year ? String(p.year) : "",
            city: p.city ?? "",
            preferredArea: p.preferredArea ?? "",
            budgetMin: String(p.budgetMin ?? ""),
            budgetMax: String(p.budgetMax ?? ""),
            languages: (p.languages ?? []).join(", "),
            foodPreference: p.foodPreference ?? "VEG",
            smoking: p.smoking ?? "NEVER",
            drinking: p.drinking ?? "NEVER",
            sleepSchedule: p.sleepSchedule ?? "FLEXIBLE",
            cleanliness: p.cleanliness ?? "MODERATE",
            pets: p.pets ?? false,
            studyHabits: p.studyHabits ?? "MODERATE",
            interests: (p.interests ?? []).join(", "),
            moveInDate: p.moveInDate ? p.moveInDate.slice(0, 10) : "",
          });
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        ...form,
        age: Number(form.age),
        year: form.year ? Number(form.year) : undefined,
        budgetMin: Number(form.budgetMin),
        budgetMax: Number(form.budgetMax),
        languages: form.languages
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        interests: form.interests
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        moveInDate: form.moveInDate || undefined,
      };

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      router.push("/discover");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!loaded) return null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold">Complete your profile</h1>
      <p className="mt-1 text-sm text-muted">
        This is what we use to find your most compatible roommates.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        <Card className="space-y-4 p-6">
          <h2 className="font-semibold">Basics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" required value={form.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" required min={16} max={100} value={form.age} onChange={(e) => update("age", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select id="gender" value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="NON_BINARY">Non-binary</option>
                <option value="OTHER">Other</option>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="genderPreference">Roommate gender preference</Label>
              <Select id="genderPreference" value={form.genderPreference} onChange={(e) => update("genderPreference", e.target.value)}>
                <option value="ANY">No preference</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" rows={3} value={form.bio} onChange={(e) => update("bio", e.target.value)} placeholder="A little about you…" />
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="font-semibold">School</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="college">College / University</Label>
              <Input id="college" required value={form.college} onChange={(e) => update("college", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="course">Course</Label>
              <Input id="course" value={form.course} onChange={(e) => update("course", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="year">Year</Label>
              <Input id="year" type="number" min={1} max={8} value={form.year} onChange={(e) => update("year", e.target.value)} />
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="font-semibold">Location & budget</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" required value={form.city} onChange={(e) => update("city", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="preferredArea">Preferred area</Label>
              <Input id="preferredArea" value={form.preferredArea} onChange={(e) => update("preferredArea", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="budgetMin">Budget min (per month)</Label>
              <Input id="budgetMin" type="number" required min={0} value={form.budgetMin} onChange={(e) => update("budgetMin", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="budgetMax">Budget max (per month)</Label>
              <Input id="budgetMax" type="number" required min={0} value={form.budgetMax} onChange={(e) => update("budgetMax", e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label htmlFor="moveInDate">Move-in date</Label>
              <Input id="moveInDate" type="date" value={form.moveInDate} onChange={(e) => update("moveInDate", e.target.value)} />
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="font-semibold">Lifestyle</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="foodPreference">Food preference</Label>
              <Select id="foodPreference" value={form.foodPreference} onChange={(e) => update("foodPreference", e.target.value)}>
                <option value="VEG">Vegetarian</option>
                <option value="NON_VEG">Non-vegetarian</option>
                <option value="VEGAN">Vegan</option>
                <option value="EGGETARIAN">Eggetarian</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="sleepSchedule">Sleep schedule</Label>
              <Select id="sleepSchedule" value={form.sleepSchedule} onChange={(e) => update("sleepSchedule", e.target.value)}>
                <option value="EARLY_BIRD">Early bird</option>
                <option value="NIGHT_OWL">Night owl</option>
                <option value="FLEXIBLE">Flexible</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="smoking">Smoking</Label>
              <Select id="smoking" value={form.smoking} onChange={(e) => update("smoking", e.target.value)}>
                <option value="NEVER">Never</option>
                <option value="SOMETIMES">Sometimes</option>
                <option value="REGULARLY">Regularly</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="drinking">Drinking</Label>
              <Select id="drinking" value={form.drinking} onChange={(e) => update("drinking", e.target.value)}>
                <option value="NEVER">Never</option>
                <option value="SOMETIMES">Sometimes</option>
                <option value="REGULARLY">Regularly</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="cleanliness">Cleanliness</Label>
              <Select id="cleanliness" value={form.cleanliness} onChange={(e) => update("cleanliness", e.target.value)}>
                <option value="RELAXED">Relaxed</option>
                <option value="MODERATE">Moderate</option>
                <option value="VERY_CLEAN">Very clean</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="studyHabits">Study habits</Label>
              <Select id="studyHabits" value={form.studyHabits} onChange={(e) => update("studyHabits", e.target.value)}>
                <option value="QUIET">Quiet / focused</option>
                <option value="MODERATE">Moderate</option>
                <option value="SOCIAL">Social / group study</option>
              </Select>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                id="pets"
                type="checkbox"
                checked={form.pets}
                onChange={(e) => update("pets", e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="pets">I have or am okay with pets</Label>
            </div>
            <div className="col-span-2">
              <Label htmlFor="languages">Languages (comma separated)</Label>
              <Input id="languages" value={form.languages} onChange={(e) => update("languages", e.target.value)} placeholder="English, Hindi" />
            </div>
            <div className="col-span-2">
              <Label htmlFor="interests">Interests (comma separated)</Label>
              <Input id="interests" value={form.interests} onChange={(e) => update("interests", e.target.value)} placeholder="Gaming, Hiking, Cooking" />
            </div>
          </div>
        </Card>

        <ErrorText>{error}</ErrorText>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Saving…" : "Save & continue"}
        </Button>
      </form>
    </div>
  );
}
