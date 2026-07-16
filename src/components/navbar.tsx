import Link from "next/link";
import { getCurrentUserId } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

export async function Navbar() {
  const userId = await getCurrentUserId();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-primary">
          RoomieMatch
        </Link>

        {userId ? (
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/discover" className="rounded-full px-3 py-1.5 hover:bg-foreground/5">
              Discover
            </Link>
            <Link href="/matches" className="rounded-full px-3 py-1.5 hover:bg-foreground/5">
              Matches
            </Link>
            <Link href="/profile/setup" className="rounded-full px-3 py-1.5 hover:bg-foreground/5">
              Profile
            </Link>
            <LogoutButton />
          </nav>
        ) : (
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/login" className="rounded-full px-3 py-1.5 hover:bg-foreground/5">
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-primary px-4 py-1.5 font-medium text-primary-foreground hover:opacity-90"
            >
              Get started
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
