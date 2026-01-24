"use client";

import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";

type Slot = { startTime: string; endTime: string };

export default function HomePage() {
  const [date, setDate] = useState(""); // YYYY-MM-DD
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/slots?date=${date}`);
        const data = await res.json();

        // adjust this line depending on your API shape
        setSlots(data.slots ?? data ?? []);
      } catch {
        setError("Failed to load slots.");
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [date]);

  return (
    <main className="min-h-screen bg-sky-100 text-slate-800">
      <SignedOut>
        <nav className="flex items-center justify-between px-6 py-4 border-b bg-white/80 backdrop-blur-sm">
          <h1 className="text-xl font-semibold tracking-tight">
            Showroom Appointment Scheduler
          </h1>

          <SignInButton mode="modal">
            <button className="px-4 py-2 rounded-md bg-slate-900 text-white">
              Sign In
            </button>
          </SignInButton>
        </nav>
      </SignedOut>

      <SignedIn>
        <>
          <nav className="flex items-center justify-between px-6 py-4 border-b bg-white/80 backdrop-blur-sm">
            <h1 className="text-xl font-semibold tracking-tight">
              Showroom Appointment Scheduler
            </h1>

            <div className="w-12 h-12 flex items-center justify-center scale-[1.8]">
              <UserButton afterSignOutUrl="/" />
            </div>
          </nav>

          {/* MAIN CONTENT */}
          <div className="p-6 max-w-2xl">
            <h2 className="text-lg font-semibold mb-2">Pick a date</h2>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border px-3 py-2 bg-white"
            />

            <div className="mt-6">
              <h3 className="font-semibold mb-2">Available slots</h3>

              {loading && <p>Loading…</p>}
              {error && <p className="text-red-600">{error}</p>}
              {!loading && !error && date && slots.length === 0 && (
                <p>No slots available for this date.</p>
              )}

              <div className="grid grid-cols-2 gap-2 mt-2">
                {slots.map((s) => (
                  <button
                    key={s.startTime}
                    className="rounded-md border bg-white px-3 py-2 text-left hover:bg-slate-50"
                    onClick={() => console.log("selected slot", s)}
                  >
                    {new Date(s.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      </SignedIn>
    </main>
  );
}
