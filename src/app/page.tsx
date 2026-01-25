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

  // multi-select chosen slots (keyed by startMinutes)
  const [selectedStarts, setSelectedStarts] = useState<Set<number>>(
    () => new Set(),
  );

  // show/hide booking form (frontend only)
  const [showForm, setShowForm] = useState(false);

  // form fields (frontend only)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

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

  const selectedCount = selectedStarts.size;

  function toggleSlot(slot: SlotWithAvailability) {
    if (slot.unavailable) {
      toast.error("No booking in the past");
      return;
    }

    setSelectedStarts((prev) => {
      const next = new Set(prev);
      if (next.has(slot.startMinutes)) {
        next.delete(slot.startMinutes);
      } else {
        next.add(slot.startMinutes);
      }
      return next;
    });
  }

  function openForm() {
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
  }

  function submitFrontendOnly(e: React.FormEvent) {
    e.preventDefault();

    if (selectedStarts.size === 0) {
      toast.error("Select at least one time slot");
      return;
    }

    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    // Frontend only: just show a success toast for now
    toast.success("Details captured (frontend only)");

    // Optional: clear selections + form
    setSelectedStarts(new Set());
    setName("");
    setEmail("");
    setPhone("");
    setShowForm(false);
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
                  setSelectedStarts(new Set());
                  setShowForm(false);
                  return;
                }

                // Block past dates
                if (value < minDate) {
                  toast.error("No booking in the past");
                  setDate("");
                  setSelectedStarts(new Set());
                  setShowForm(false);
                  dateInputRef.current?.blur();
                  return;
                }

                // Valid date selected
                setDate(value);
                setSelectedStarts(new Set()); // reset selections when changing date
                setShowForm(false);
                dateInputRef.current?.blur();
              }}
              className="rounded-lg border px-5 py-3 text-lg bg-white shadow-sm"
            />

            {date && (
              <div className="mt-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">
                    Time slots (30 minutes each)
                  </h3>

                  {selectedCount > 0 && (
                    <span className="text-sm text-slate-600">
                      Selected: {selectedCount}
                    </span>
                  )}
                </div>

                <ul className="mt-2 grid grid-cols-2 gap-2">
                  {slotsWithAvailability.map((s) => {
                    const isSelected = selectedStarts.has(s.startMinutes);

                    return (
                      <li key={s.startMinutes}>
                        <button
                          type="button"
                          onClick={() => toggleSlot(s)}
                          className={[
                            "w-full rounded-md border px-3 py-2 text-sm text-left transition",
                            s.unavailable
                              ? "bg-red-50 text-red-700 border-red-200 cursor-not-allowed"
                              : isSelected
                                ? "bg-blue-600 text-white border-blue-700 hover:bg-blue-700"
                                : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50",
                          ].join(" ")}
                        >
                          {s.label}
                          {s.unavailable && (
                            <span className="ml-2 text-xs">(Unavailable)</span>
                          )}
                          {!s.unavailable && isSelected && (
                            <span className="ml-2 text-xs opacity-90">
                              (Selected)
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {/* Show proceed button once at least one slot is selected */}
                {selectedCount > 0 && !showForm && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={openForm}
                      className="w-full rounded-md bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800 transition"
                    >
                      Continue ({selectedCount} selected)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Simple modal form (frontend only) */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={closeForm}
              />

              <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl border p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">Your details</h3>
                    <p className="text-sm text-slate-600">
                      Selected slots: {selectedCount}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeForm}
                    className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={submitFrontendOnly} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-md border px-3 py-2"
                      placeholder="Jane Doe"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Email <span className="text-red-600">*</span>
                    </label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-md border px-3 py-2"
                      placeholder="jane@example.com"
                      inputMode="email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Phone <span className="text-slate-500">(optional)</span>
                    </label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-md border px-3 py-2"
                      placeholder="(555) 123-4567"
                      inputMode="tel"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-md bg-blue-600 text-white py-3 font-semibold hover:bg-blue-700 transition"
                  >
                    Submit
                  </button>

                  <button
                    type="button"
                    onClick={closeForm}
                    className="w-full rounded-md border py-3 font-semibold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      </SignedIn>
    </main>
  );
}
