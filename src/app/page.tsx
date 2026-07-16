import { getCurrentUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LandingHero } from "@/components/landing-hero";

export default async function Home() {
  const userId = await getCurrentUserId();
  if (userId) {
    redirect("/discover");
  }

  return <LandingHero />;
}
