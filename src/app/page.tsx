"use client";

import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import { useMemo, useState } from "react";

function formatTime(totalMinutes: number) {
  const hour24 = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;

  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const ampm = hour24 < 12 ? "AM" : "PM";
  const mm = minute.toString().padStart(2, "0");

  return `${hour12}:${mm} ${ampm}`;
}

function generateTimeRanges() {
  // 9:00 AM to 5:00 PM in 30-min intervals
  // Last slot: 4:30 PM – 5:00 PM
  const ranges: string[] = [];

  for (let minutes = 9 * 60; minutes < 17 * 60; minutes += 30) {
    const start = minutes;
    const end = minutes + 30;

    ranges.push(`${formatTime(start)} – ${formatTime(end)}`);
  }

  return ranges;
}

export default function HomePage() {
  const [date, setDate] = useState(""); // YYYY-MM-DD

  const timeRanges = useMemo(() => {
    if (!date) return [];
    return generateTimeRanges();
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
              className="rounded-lg border px-5 py-3 text-lg bg-white shadow-sm"
            />

            {date && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">
                  Time slots (30 minutes each)
                </h3>

                <ul className="grid grid-cols-2 gap-2">
                  {timeRanges.map((range) => (
                    <li
                      key={range}
                      className="rounded-md border bg-white px-3 py-2 text-sm"
                    >
                      {range}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      </SignedIn>
    </main>
  );
}
