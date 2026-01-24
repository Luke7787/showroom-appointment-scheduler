import {
  RedirectToSignIn,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>

      <SignedIn>
        <>
          {/* NAV BAR */}
          <nav className="flex items-center justify-between px-6 py-4 border-b">
            <h1 className="text-xl font-bold">
              Showroom Appointment Scheduler
            </h1>

            <UserButton afterSignOutUrl="/" />
          </nav>

          {/* PAGE CONTENT */}
          <div className="p-6">
            <p>Select a date to view available time slots.</p>
          </div>
        </>
      </SignedIn>
    </main>
  );
}
