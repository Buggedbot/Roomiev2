"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-full px-3 py-1.5 text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
    >
      Log out
    </button>
  );
}
