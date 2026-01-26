"use client";

import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

const TIME_ZONE = "America/Los_Angeles";
const SLOT_MINUTES = 30;

type ApiSlotStatus = "AVAILABLE" | "PENDING" | "CONFIRMED" | "PAST";

type ApiSlot = {
  start: string; // ISO UTC
  end: string; // ISO UTC
  label: string; // formatted in LA by backend
  status: ApiSlotStatus;
};

// ----- Time helpers -----

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
  };
}

function todayLA() {
  const p = getZonedParts(new Date());
  return `${p.year}-${p.month}-${p.day}`; // YYYY-MM-DD
}

export default function HomePage() {
  const minDate = useMemo(() => todayLA(), []);
  const [date, setDate] = useState("");
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  // fetched slots
  const [apiSlots, setApiSlots] = useState<ApiSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // multi-select (key by slot start ISO string)
  const [selectedStarts, setSelectedStarts] = useState<Set<string>>(
    () => new Set(),
  );

  // form modal
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCount = selectedStarts.size;

  async function refreshSlots(currentDate: string) {
    if (!currentDate) {
      setApiSlots([]);
      return;
    }

    setIsLoadingSlots(true);
    try {
      const res = await fetch(
        `/api/slots?date=${encodeURIComponent(currentDate)}`,
      );
      const data = (await res.json()) as { slots?: ApiSlot[]; error?: string };

      if (!res.ok) {
        toast.error(data?.error ?? "Failed to load slots");
        setApiSlots([]);
        return;
      }

      setApiSlots(data.slots ?? []);
    } catch {
      toast.error("Failed to load slots");
      setApiSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }

  // whenever date changes, fetch slots
  useEffect(() => {
    void refreshSlots(date);
    // also clear selection when date changes
    setSelectedStarts(new Set());
    setShowForm(false);
  }, [date]);

  function toggleSlot(slot: ApiSlot) {
    if (slot.status === "PAST") {
      toast.error("No booking in the past");
      return;
    }

    if (slot.status === "PENDING") {
      toast.error("This time is pending approval");
      return;
    }

    if (slot.status === "CONFIRMED") {
      toast.error("This time is already confirmed");
      return;
    }

    // AVAILABLE
    setSelectedStarts((prev) => {
      const next = new Set(prev);
      if (next.has(slot.start)) next.delete(slot.start);
      else next.add(slot.start);
      return next;
    });
  }

  async function submitToBackend(e: React.FormEvent) {
    e.preventDefault();

    if (!date) {
      toast.error("Pick a date first");
      return;
    }

    if (selectedStarts.size === 0) {
      toast.error("Select at least one time slot");
      return;
    }

    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    // Build slots payload from selected ISO times
    const selectedSlots = apiSlots
      .filter((s) => selectedStarts.has(s.start))
      .map((s) => ({ startTime: s.start, endTime: s.end }));

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() ? phone.trim() : undefined,
          slots: selectedSlots,
        }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        toast.error(data?.error ?? "Booking failed");
        return;
      }

      toast.success("Submitted! Status: Pending approval");

      // reset UI
      setSelectedStarts(new Set());
      setName("");
      setEmail("");
      setPhone("");
      setShowForm(false);

      // refresh slots so newly created ones show as PENDING immediately
      await refreshSlots(date);
    } catch {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
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

                if (!value) {
                  setDate("");
                  setSelectedStarts(new Set());
                  setShowForm(false);
                  return;
                }

                if (value < minDate) {
                  toast.error("No booking in the past");
                  setDate("");
                  setSelectedStarts(new Set());
                  setShowForm(false);
                  dateInputRef.current?.blur();
                  return;
                }

                setDate(value);
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

                {isLoadingSlots ? (
                  <p className="mt-3 text-sm text-slate-600">Loading...</p>
                ) : (
                  <ul className="mt-2 grid grid-cols-2 gap-2">
                    {apiSlots.map((s) => {
                      const isSelected = selectedStarts.has(s.start);

                      const base =
                        "w-full rounded-md border px-3 py-2 text-sm text-left transition";

                      const cls =
                        s.status === "PAST"
                          ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          : s.status === "PENDING"
                            ? "bg-amber-50 text-amber-800 border-amber-200 cursor-not-allowed"
                            : s.status === "CONFIRMED"
                              ? // ✅ GREEN for approved/confirmed
                                "bg-green-50 text-green-800 border-green-200 cursor-not-allowed"
                              : isSelected
                                ? "bg-blue-600 text-white border-blue-700 hover:bg-blue-700"
                                : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50";

                      // ✅ allow PAST to be clickable so toggleSlot() can toast,
                      // but still prevent PENDING/CONFIRMED from clicking/selecting.
                      const disabled =
                        s.status === "PENDING" || s.status === "CONFIRMED";

                      return (
                        <li key={s.start}>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => toggleSlot(s)}
                            className={[base, cls].join(" ")}
                          >
                            {s.label}

                            {s.status === "PAST" && (
                              <span className="ml-2 text-xs">(Past)</span>
                            )}
                            {s.status === "PENDING" && (
                              <span className="ml-2 text-xs">(Pending)</span>
                            )}
                            {s.status === "CONFIRMED" && (
                              <span className="ml-2 text-xs">(Approved)</span>
                            )}
                            {s.status === "AVAILABLE" && isSelected && (
                              <span className="ml-2 text-xs opacity-90">
                                (Selected)
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {selectedCount > 0 && !showForm && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(true)}
                      className="w-full rounded-md bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800 transition"
                    >
                      Continue ({selectedCount} selected)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setShowForm(false)}
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
                    onClick={() => setShowForm(false)}
                    className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={submitToBackend} className="mt-4 space-y-3">
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={[
                      "w-full rounded-md py-3 font-semibold transition",
                      isSubmitting
                        ? "bg-blue-300 text-white cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700",
                    ].join(" ")}
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    disabled={isSubmitting}
                    className="w-full rounded-md border py-3 font-semibold hover:bg-slate-50 transition disabled:opacity-60"
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
