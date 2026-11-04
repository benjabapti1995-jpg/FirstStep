import { Logo } from "@/components/Logo";
import { AppNav } from "@/components/AppNav";
import { requireUser } from "@/lib/auth";
import { logout } from "../(auth)/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo href="/app" />
          <div className="flex items-center gap-2 text-sm">
            {user.plan === "pro" && (
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">Pro</span>
            )}
            <span className="hidden text-muted sm:inline">{user.name}</span>
            <form action={logout}>
              <button className="btn btn-ghost px-3 py-1.5 text-sm">Log out</button>
            </form>
          </div>
        </div>
        <AppNav />
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-20 pt-6 sm:px-6">{children}</main>
    </div>
  );
}
