import { SignIn, SignedIn, SignedOut } from "@clerk/nextjs";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <SignedOut>
        <SignIn />
      </SignedOut>

      <SignedIn>
        <div>
          <h1 className="text-2xl font-bold mb-4">
            Showroom Appointment Scheduler
          </h1>
          <p>Select a date to view available time slots.</p>
        </div>
      </SignedIn>
    </main>
  );
}
