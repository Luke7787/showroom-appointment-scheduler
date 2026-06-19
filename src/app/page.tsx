"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import LandingPage from "./_components/LandingPage";

const TIME_ZONE = "America/Los_Angeles";

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

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

// Build a list of upcoming calendar days starting from `startYmd` (YYYY-MM-DD).
// Anchored at noon UTC to avoid DST off-by-one issues.
function quickDates(startYmd: string, count: number) {
  const [y, m, d] = startYmd.split("-").map(Number);

  return Array.from({ length: count }, (_, i) => {
    const dt = new Date(Date.UTC(y, m - 1, d + i, 12, 0, 0));
    const value = `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;

    const weekday = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      weekday: "short",
    }).format(dt);

    const dayNum = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      day: "numeric",
    }).format(dt);

    const month = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      month: "short",
    }).format(dt);

    return { value, weekday, dayNum, month, isToday: i === 0 };
  });
}

export default function HomePage() {
  const router = useRouter();

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

  // confirmation screen
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationSlots, setConfirmationSlots] = useState<ApiSlot[]>([]);
  const [confirmationInfo, setConfirmationInfo] = useState<{
    name: string;
    email: string;
    phone?: string;
  } | null>(null);

  const selectedCount = selectedStarts.size;

  // Quick-pick chips for the next two weeks
  const quickPicks = useMemo(() => quickDates(minDate, 14), [minDate]);

  // Live availability breakdown for the selected day
  const availableCount = apiSlots.filter(
    (s) => s.status === "AVAILABLE",
  ).length;
  const bookedCount = apiSlots.filter(
    (s) => s.status === "PENDING" || s.status === "CONFIRMED",
  ).length;

  // The slots the user has currently selected (in chronological order)
  const selectedSlots = apiSlots.filter((s) => selectedStarts.has(s.start));

  function resetBooking() {
    setSelectedStarts(new Set());
    setShowForm(false);
    setShowConfirmation(false);
    setConfirmationSlots([]);
    setConfirmationInfo(null);
  }

  function chooseDate(value: string) {
    if (value < minDate) {
      toast.error("No booking in the past");
      return;
    }
    setDate(value);
    resetBooking();
    dateInputRef.current?.blur();
  }

  const selectedDateLabel = date
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: TIME_ZONE,
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(new Date(`${date}T12:00:00`))
    : "";

  // ✅ If signed-in user is admin, redirect to /admin
  useEffect(() => {
    let cancelled = false;

    async function goIfAdmin() {
      try {
        const res = await fetch("/api/is-admin", { cache: "no-store" });
        const data = (await res.json()) as { isAdmin?: boolean };
        if (!cancelled && data.isAdmin) {
          router.replace("/admin");
        }
      } catch {
        // ignore
      }
    }

    void goIfAdmin();

    return () => {
      cancelled = true;
    };
  }, [router]);

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
    setShowConfirmation(false);
    setConfirmationSlots([]);
    setConfirmationInfo(null);
  }, [date]);

  function toggleSlot(slot: ApiSlot) {
    if (slot.status === "PAST") {
      toast.error("No booking in the past");
      return;
    }

    if (slot.status === "PENDING") {
      toast("This booking is pending confirmation", {
        icon: "⏳",
      });
      return;
    }

    if (slot.status === "CONFIRMED") {
      toast.success("This booking is already confirmed");
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

      toast.success("Submitted. Pending confirmation");

      // confirmation screen snapshot (before reset)
      const bookedSlots = apiSlots.filter((s) => selectedStarts.has(s.start));
      setConfirmationSlots(bookedSlots);
      setConfirmationInfo({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() ? phone.trim() : undefined,
      });
      setShowConfirmation(true);

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
    <main className="min-h-screen bg-slate-950 text-white">
      <SignedOut>
        <LandingPage />
      </SignedOut>

      <SignedIn>
        <div className="relative min-h-screen overflow-hidden">
          {/* Background gradient + animated blobs (matches landing) */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
            <div className="lp-animate-blob absolute -left-24 -top-24 h-96 w-96 rounded-full bg-indigo-600/25 blur-3xl" />
            <div className="lp-animate-blob absolute right-0 top-40 h-[28rem] w-[28rem] rounded-full bg-sky-500/15 blur-3xl [animation-delay:4s]" />
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                backgroundSize: "56px 56px",
              }}
            />
          </div>

          <nav className="relative z-20 border-b border-white/10 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-400 shadow-lg shadow-indigo-500/30">
                  <svg
                    className="h-5 w-5 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0V11.25A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                    />
                  </svg>
                </span>
                <span className="text-base font-semibold tracking-tight text-white">
                  Showroom Scheduler
                </span>
              </div>

              <div className="flex h-10 w-10 items-center justify-center scale-[1.4]">
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          </nav>

          <div className="relative z-10 mx-auto max-w-6xl px-6 py-12">
            <div className="lp-animate-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-200 backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Booking slots open now
              </span>
              <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Book your{" "}
                <span className="bg-gradient-to-r from-indigo-300 via-sky-300 to-fuchsia-300 bg-clip-text text-transparent">
                  showroom visit
                </span>
              </h1>
              <p className="mt-3 max-w-xl text-slate-300">
                Choose a date to see live availability, then pick the time slots
                that work for you.
              </p>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-3 lg:items-start">
              {/* ---------------- Main column ---------------- */}
              <div className="space-y-6 lg:col-span-2">
                {/* Date selection card */}
                <div className="lp-animate-fade-up lp-delay-1 rounded-2xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-semibold text-slate-200">
                      Pick a date
                    </label>
                    {date && (
                      <span className="text-sm font-medium text-sky-300">
                        {selectedDateLabel}
                      </span>
                    )}
                  </div>

                  {/* Quick-pick day chips */}
                  <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                    {quickPicks.map((q) => {
                      const active = q.value === date;
                      return (
                        <button
                          key={q.value}
                          type="button"
                          onClick={() => chooseDate(q.value)}
                          className={[
                            "flex min-w-[4.25rem] shrink-0 flex-col items-center rounded-xl border px-3 py-2 transition",
                            active
                              ? "border-indigo-400/60 bg-gradient-to-b from-indigo-500/80 to-sky-500/80 text-white shadow-lg shadow-indigo-500/20"
                              : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10",
                          ].join(" ")}
                        >
                          <span className="text-[11px] font-medium opacity-80">
                            {q.isToday ? "Today" : q.weekday}
                          </span>
                          <span className="mt-0.5 text-lg font-bold leading-none">
                            {q.dayNum}
                          </span>
                          <span className="mt-0.5 text-[10px] uppercase tracking-wide opacity-70">
                            {q.month}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4">
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">
                      Or choose any date
                    </label>
                    <input
                      ref={dateInputRef}
                      type="date"
                      value={date}
                      min={minDate}
                      onChange={(e) => {
                        const value = e.target.value;

                        if (!value) {
                          setDate("");
                          resetBooking();
                          return;
                        }

                        if (value < minDate) {
                          toast.error("No booking in the past");
                          setDate("");
                          resetBooking();
                          dateInputRef.current?.blur();
                          return;
                        }

                        setDate(value);
                        resetBooking();
                        dateInputRef.current?.blur();
                      }}
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-lg text-white shadow-sm outline-none transition [color-scheme:dark] focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/30"
                    />
                  </div>
                </div>

                {/* Confirmation */}
                {date && showConfirmation && (
                  <div className="lp-animate-fade-up overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] p-6 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30">
                        <svg
                          className="h-6 w-6"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4.5 12.75 6 6 9-13.5"
                          />
                        </svg>
                      </span>
                      <div>
                        <h3 className="text-xl font-semibold text-white">
                          Request received
                        </h3>
                        <p className="mt-0.5 text-sm text-slate-300">
                          Your appointment is pending confirmation. We&apos;ll
                          confirm it shortly.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="text-sm">
                        <span className="font-semibold text-white">Date:</span>{" "}
                        <span className="text-slate-300">
                          {new Intl.DateTimeFormat("en-US", {
                            timeZone: TIME_ZONE,
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }).format(new Date(`${date}T12:00:00`))}
                        </span>
                      </div>

                      {confirmationInfo && (
                        <div className="mt-4 grid gap-2 text-sm text-slate-300">
                          <div>
                            <span className="font-semibold text-white">
                              Name:
                            </span>{" "}
                            {confirmationInfo.name}
                          </div>
                          <div>
                            <span className="font-semibold text-white">
                              Email:
                            </span>{" "}
                            {confirmationInfo.email}
                          </div>
                          {confirmationInfo.phone && (
                            <div>
                              <span className="font-semibold text-white">
                                Phone:
                              </span>{" "}
                              {confirmationInfo.phone.replace(
                                /(\d{3})(\d{3})(\d{4})/,
                                "($1) $2-$3",
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-4 text-sm font-semibold text-white">
                        Submitted time slots
                      </div>

                      <ul className="mt-2 grid grid-cols-2 gap-2">
                        {confirmationSlots.map((s) => (
                          <li
                            key={s.start}
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                          >
                            {s.label}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => {
                          setShowConfirmation(false);
                          setConfirmationSlots([]);
                          setConfirmationInfo(null);
                        }}
                        className="w-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 px-5 py-2.5 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-110 sm:w-auto"
                      >
                        Done
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowConfirmation(false);
                          setConfirmationSlots([]);
                          setConfirmationInfo(null);
                          setDate("");
                        }}
                        className="w-full rounded-full border border-white/15 bg-white/5 px-5 py-2.5 font-semibold text-white transition hover:bg-white/10 sm:w-auto"
                      >
                        Book another day
                      </button>
                    </div>
                  </div>
                )}

                {/* Time slots */}
                {date && !showConfirmation && (
                  <div className="lp-animate-fade-up lp-delay-2 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/5 px-5 py-4">
                      <h3 className="font-semibold text-white">
                        Time slots{" "}
                        <span className="font-medium text-slate-400">
                          (30 minutes each)
                        </span>
                      </h3>

                      {selectedCount > 0 && (
                        <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-sm font-semibold text-sky-300 ring-1 ring-inset ring-indigo-400/30">
                          {selectedCount} selected
                        </span>
                      )}
                    </div>

                    <div className="p-5">
                      {isLoadingSlots ? (
                        <div className="flex items-center gap-2 py-6 text-sm text-slate-300">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-sky-400" />
                          Loading availability...
                        </div>
                      ) : (
                        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                          {apiSlots.map((s) => {
                            const isSelected = selectedStarts.has(s.start);

                            const base =
                              "w-full rounded-xl border px-3 py-2.5 text-sm text-left transition";

                            const cls =
                              s.status === "PAST"
                                ? "border-white/5 bg-white/[0.02] text-slate-500 cursor-not-allowed"
                                : s.status === "PENDING"
                                  ? "border-amber-400/30 bg-amber-400/10 text-amber-200 cursor-pointer hover:bg-amber-400/15"
                                  : s.status === "CONFIRMED"
                                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200 cursor-pointer hover:bg-emerald-400/15"
                                    : isSelected
                                      ? "border-indigo-400/60 bg-gradient-to-r from-indigo-500/80 to-sky-500/80 text-white shadow-lg shadow-indigo-500/20 cursor-pointer"
                                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 cursor-pointer";

                            const isClickable = s.status === "AVAILABLE";

                            return (
                              <li key={s.start}>
                                <button
                                  type="button"
                                  aria-disabled={!isClickable}
                                  tabIndex={isClickable ? 0 : -1}
                                  onClick={() => toggleSlot(s)}
                                  className={[base, cls].join(" ")}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium">
                                      {s.label}
                                    </span>

                                    {s.status === "PAST" && (
                                      <span className="text-xs opacity-80">
                                        Past
                                      </span>
                                    )}
                                    {s.status === "PENDING" && (
                                      <span className="text-xs opacity-80">
                                        Pending
                                      </span>
                                    )}
                                    {s.status === "CONFIRMED" && (
                                      <span className="text-xs opacity-80">
                                        Confirmed
                                      </span>
                                    )}
                                    {s.status === "AVAILABLE" && isSelected && (
                                      <span className="text-xs opacity-90">
                                        ✓
                                      </span>
                                    )}
                                  </div>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      {/* Legend */}
                      {!isLoadingSlots && (
                        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 pt-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-white/40" />
                            Available
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                            Pending
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                            Confirmed
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                            Past
                          </span>
                        </div>
                      )}

                      {selectedCount > 0 && !showForm && (
                        <div className="mt-5">
                          <button
                            type="button"
                            onClick={() => setShowForm(true)}
                            className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 py-3.5 font-semibold text-white shadow-xl shadow-indigo-500/30 transition hover:brightness-110"
                          >
                            Continue ({selectedCount} selected)
                            <svg
                              className="h-4 w-4 transition-transform group-hover:translate-x-1"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2.2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ---------------- Sidebar ---------------- */}
              <aside className="space-y-6 lg:sticky lg:top-6">
                {/* Live availability + selection (only when a date is chosen) */}
                {date && !showConfirmation && (
                  <div className="lp-animate-fade-up lp-delay-1 rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl">
                    <h3 className="text-sm font-semibold text-white">
                      Availability
                    </h3>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3">
                        <div className="text-2xl font-bold text-emerald-300">
                          {availableCount}
                        </div>
                        <div className="text-xs text-emerald-200/80">
                          Open slots
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="text-2xl font-bold text-slate-200">
                          {bookedCount}
                        </div>
                        <div className="text-xs text-slate-400">Booked</div>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-white/10 pt-4">
                      <h4 className="text-sm font-semibold text-white">
                        Your selection
                      </h4>
                      {selectedSlots.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-400">
                          Tap open slots to add them to your visit.
                        </p>
                      ) : (
                        <ul className="mt-3 space-y-2">
                          {selectedSlots.map((s) => (
                            <li
                              key={s.start}
                              className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                            >
                              <span>{s.label}</span>
                              <button
                                type="button"
                                onClick={() => toggleSlot(s)}
                                className="rounded-md px-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                                aria-label="Remove slot"
                              >
                                ✕
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}

                {/* What to expect */}
                <div className="lp-animate-fade-up lp-delay-2 rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl">
                  <h3 className="text-sm font-semibold text-white">
                    What to expect
                  </h3>
                  <ul className="mt-3 space-y-3 text-sm text-slate-300">
                    {[
                      "A private, one-on-one showroom session",
                      "30 minutes per slot — book back-to-back for more time",
                      "We'll review and confirm your request shortly",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-400/15 text-sky-300">
                          <svg
                            className="h-3.5 w-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m4.5 12.75 6 6 9-13.5"
                            />
                          </svg>
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Showroom hours */}
                <div className="lp-animate-fade-up lp-delay-3 rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl">
                  <h3 className="text-sm font-semibold text-white">
                    Showroom hours
                  </h3>
                  <dl className="mt-3 space-y-2.5 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-slate-400">Open daily</dt>
                      <dd className="font-medium text-slate-200">
                        9:00 AM – 5:00 PM
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-slate-400">Slot length</dt>
                      <dd className="font-medium text-slate-200">30 minutes</dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-slate-400">Time zone</dt>
                      <dd className="font-medium text-slate-200">
                        Pacific (LA)
                      </dd>
                    </div>
                  </dl>
                </div>
              </aside>
            </div>
          </div>

          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
                onClick={() => setShowForm(false)}
              />

              <div className="lp-animate-fade-up relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl">
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-2xl" />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Your details
                    </h3>
                    <p className="text-sm text-slate-400">
                      {selectedCount} slot{selectedCount === 1 ? "" : "s"}{" "}
                      selected
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <form
                  onSubmit={submitToBackend}
                  className="relative mt-5 space-y-4"
                >
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-200">
                      Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-white placeholder-slate-500 outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/30"
                      placeholder="Jane Doe"
                      autoFocus
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-200">
                      Email <span className="text-rose-400">*</span>
                    </label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-white placeholder-slate-500 outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/30"
                      placeholder="jane@example.com"
                      inputMode="email"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-200">
                      Phone{" "}
                      <span className="text-slate-500">(optional)</span>
                    </label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-white placeholder-slate-500 outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/30"
                      placeholder="(555) 123-4567"
                      inputMode="tel"
                      disabled={isSubmitting}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={[
                      "w-full rounded-full py-3 font-semibold text-white transition",
                      isSubmitting
                        ? "cursor-not-allowed bg-white/20"
                        : "bg-gradient-to-r from-indigo-500 to-sky-400 shadow-lg shadow-indigo-500/30 hover:brightness-110",
                    ].join(" ")}
                  >
                    {isSubmitting ? "Submitting..." : "Submit request"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    disabled={isSubmitting}
                    className="w-full rounded-full border border-white/15 bg-white/5 py-3 font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </SignedIn>
    </main>
  );
}
