import {
  RedirectToSignIn,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-sky-100 text-slate-800">
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>

      <SignedIn>
        <>
          {/* NAV BAR */}
          <nav className="flex items-center justify-between px-6 py-4 border-b bg-white/80 backdrop-blur-sm">
            <h1 className="text-xl font-semibold tracking-tight">
              Showroom Appointment Scheduler
            </h1>

            <div className="user-button-scale">
              <UserButton afterSignOutUrl="/" />
            </div>
          </nav>

          {/* PAGE CONTENT */}
          <div className="p-6">
            <p className="text-slate-700">
              Select a date to view available time slots.
            </p>
          </div>
        </>
      </SignedIn>
    </main>
  );
}
