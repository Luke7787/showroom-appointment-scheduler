"use client";

import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

const TIME_ZONE = "America/Los_Angeles";
const SLOT_MINUTES = 30;
const BUSINESS_START_HOUR = 9;
const BUSINESS_END_HOUR = 17;

type Slot = {
  startMinutes: number; // minutes from midnight
  endMinutes: number;
  label: string; // "9:00 AM – 9:30 AM"
};

type SlotWithAvailability = Slot & { unavailable: boolean };

function getZonedParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

function todayLA() {
  const p = getZonedParts(new Date());
  return `${p.year}-${p.month}-${p.day}`; // YYYY-MM-DD
}

function nowMinutesLA() {
  const p = getZonedParts(new Date());
  return p.hour * 60 + p.minute;
}

function formatTime(totalMinutes: number) {
  const hour24 = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;

  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const ampm = hour24 < 12 ? "AM" : "PM";
  const mm = minute.toString().padStart(2, "0");

  return `${hour12}:${mm} ${ampm}`;
}

function generateSlots(): Slot[] {
  const slots: Slot[] = [];
  const start = BUSINESS_START_HOUR * 60;
  const end = BUSINESS_END_HOUR * 60;

  for (let t = start; t < end; t += SLOT_MINUTES) {
    slots.push({
      startMinutes: t,
      endMinutes: t + SLOT_MINUTES,
      label: `${formatTime(t)} – ${formatTime(t + SLOT_MINUTES)}`,
    });
  }

  return slots;
}

export default function HomePage() {
  const minDate = useMemo(() => todayLA(), []);
  const [date, setDate] = useState(""); // YYYY-MM-DD
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const allSlots = useMemo(() => generateSlots(), []);

  const slotsWithAvailability: SlotWithAvailability[] = useMemo(() => {
    if (!date) return [];

    const isToday = date === minDate;
    if (!isToday) {
      return allSlots.map((s) => ({ ...s, unavailable: false }));
    }

    const nowMins = nowMinutesLA();

    return allSlots.map((s) => ({
      ...s,
      unavailable: s.endMinutes <= nowMins,
    }));
  }, [date, minDate, allSlots]);

  function handleSlotClick(slot: SlotWithAvailability) {
    if (slot.unavailable) {
      toast.error("No booking in the past");
      return;
    }

    toast.success(`Selected: ${slot.label}`);
  }

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

          <div className="p-6 max-w-2xl">
            <h2 className="text-lg font-semibold mb-2">Pick a date</h2>

            <input
              ref={dateInputRef}
              type="date"
              value={date}
              min={minDate}
              onChange={(e) => {
                const value = e.target.value;

                // If user clears the input, just clear state
                if (!value) {
                  setDate("");
                  return;
                }

                // Block past dates
                if (value < minDate) {
                  toast.error("No booking in the past");
                  setDate("");
                  dateInputRef.current?.blur(); // close picker
                  return;
                }

                // ✅ Valid date selected
                setDate(value);
                dateInputRef.current?.blur(); // ✅ close picker after selection
              }}
              className="rounded-lg border px-5 py-3 text-lg bg-white shadow-sm"
            />

            {date && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">
                  Time slots (30 minutes each)
                </h3>

                <ul className="grid grid-cols-2 gap-2">
                  {slotsWithAvailability.map((s) => (
                    <li key={s.startMinutes}>
                      <button
                        type="button"
                        onClick={() => handleSlotClick(s)}
                        className={[
                          "w-full rounded-md border px-3 py-2 text-sm text-left transition",
                          s.unavailable
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        {s.label}
                        {s.unavailable && (
                          <span className="ml-2 text-xs">(Unavailable)</span>
                        )}
                      </button>
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
