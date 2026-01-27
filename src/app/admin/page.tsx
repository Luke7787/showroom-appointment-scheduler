"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

const TIME_ZONE = "America/Los_Angeles";

type SlotStatus = "AVAILABLE" | "PENDING" | "CONFIRMED" | "PAST";

type AdminSlot = {
  start: string; // ISO UTC
  end: string; // ISO UTC
  label: string; // already formatted in LA
  status: SlotStatus;

  // Admin-only: when status is pending/confirmed, we can attach appointment info later
  // For UI-first, we will look this up from a mock map keyed by start.
};

type AppointmentDetails = {
  name: string;
  email: string;
  phone?: string;
  status: "PENDING" | "CONFIRMED";
  start: string;
  end: string;
  label: string;
};

function formatAdminDate(dateStr: string) {
  // dateStr is YYYY-MM-DD from the date input
  // Using the "no timezone shift" trick by anchoring at noon UTC
  const safe = new Date(`${dateStr}T12:00:00.000Z`);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(safe);
}

function formatPhoneUS(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return digits.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
  }
  return raw;
}

export default function AdminPage() {
  const [date, setDate] = useState("");
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  // View modal
  const [active, setActive] = useState<AppointmentDetails | null>(null);

  // ---- UI-first mock data (replace with fetch later) ----
  const mockSlots: AdminSlot[] = useMemo(() => {
    // You can tweak these to match your business hours and slot minutes
    // For now: sample blocks
    return [
      {
        start: "2026-01-26T17:00:00.000Z",
        end: "2026-01-26T17:30:00.000Z",
        label: "9:00 AM – 9:30 AM",
        status: "PENDING",
      },
      {
        start: "2026-01-26T17:30:00.000Z",
        end: "2026-01-26T18:00:00.000Z",
        label: "9:30 AM – 10:00 AM",
        status: "CONFIRMED",
      },
      {
        start: "2026-01-26T18:00:00.000Z",
        end: "2026-01-26T18:30:00.000Z",
        label: "10:00 AM – 10:30 AM",
        status: "AVAILABLE",
      },
      {
        start: "2026-01-26T18:30:00.000Z",
        end: "2026-01-26T19:00:00.000Z",
        label: "10:30 AM – 11:00 AM",
        status: "AVAILABLE",
      },
    ];
  }, []);

  const mockAppointmentByStart = useMemo(() => {
    const map = new Map<
      string,
      Omit<AppointmentDetails, "start" | "end" | "label">
    >();
    map.set("2026-01-26T17:00:00.000Z", {
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "4158378686",
      status: "PENDING",
    });
    map.set("2026-01-26T17:30:00.000Z", {
      name: "John Smith",
      email: "john@example.com",
      phone: "5105551234",
      status: "CONFIRMED",
    });
    return map;
  }, []);
  // ---------------------------------------------

  const slots = mockSlots; // later: fetched slots by date

  function onView(slot: AdminSlot) {
    const appt = mockAppointmentByStart.get(slot.start);
    if (!appt) {
      toast("No appointment info for this slot yet.", { icon: "ℹ️" });
      return;
    }

    setActive({
      ...appt,
      start: slot.start,
      end: slot.end,
      label: slot.label,
    });
  }

  function onConfirm(slot: AdminSlot) {
    if (slot.status !== "PENDING") {
      toast("Only pending requests can be confirmed.", { icon: "ℹ️" });
      return;
    }
    toast.success("Marked as confirmed (UI only for now)");
    // later: PATCH /api/admin/appointments/:id status CONFIRMED
  }

  function onDecline(slot: AdminSlot) {
    if (slot.status !== "PENDING") {
      toast("Only pending requests can be declined.", { icon: "ℹ️" });
      return;
    }
    toast("Declined (UI only for now)", { icon: "🗑️" });
    // later: DELETE /api/admin/appointments/:id or set status CANCELED
  }

  return (
    <main className="min-h-screen bg-sky-100 text-slate-800">
      <SignedOut>
        <nav className="flex items-center justify-between px-6 py-4 border-b bg-white/80 backdrop-blur-sm">
          <h1 className="text-xl font-semibold tracking-tight">Admin</h1>

          <SignInButton mode="modal">
            <button className="px-4 py-2 rounded-md bg-slate-900 text-white">
              Sign In
            </button>
          </SignInButton>
        </nav>

        <div className="p-6 max-w-2xl">
          <p className="text-sm text-slate-700">
            Please sign in with the admin account to continue.
          </p>
        </div>
      </SignedOut>

      <SignedIn>
        <>
          <nav className="flex items-center justify-between px-6 py-4 border-b bg-white/80 backdrop-blur-sm">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Admin</h1>
              <p className="text-sm text-slate-600">
                Review requests and confirm or decline.
              </p>
            </div>

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
              onChange={(e) => {
                setDate(e.target.value);
                dateInputRef.current?.blur();
              }}
              className="rounded-lg border px-5 py-3 text-lg bg-white shadow-sm"
            />

            {date && (
              <div className="mt-6">
                <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-slate-50">
                    <h3 className="font-semibold text-slate-900">
                      Time slots{" "}
                      <span className="text-slate-600 font-medium">
                        ({formatAdminDate(date)})
                      </span>
                    </h3>
                    <span className="text-sm text-slate-700">
                      Hover a slot for actions
                    </span>
                  </div>

                  <div className="p-4">
                    <ul className="grid grid-cols-2 gap-2">
                      {slots.map((s) => {
                        const base =
                          "group relative w-full rounded-md border px-3 py-2 text-sm text-left transition shadow-sm";
                        const cls =
                          s.status === "PAST"
                            ? "bg-red-50 text-red-700 border-red-200 cursor-not-allowed"
                            : s.status === "PENDING"
                              ? "bg-amber-50 text-amber-800 border-amber-200 cursor-pointer hover:bg-amber-100"
                              : s.status === "CONFIRMED"
                                ? "bg-green-50 text-green-800 border-green-200 cursor-pointer hover:bg-green-100"
                                : "bg-sky-100 text-slate-800 border-sky-200 cursor-pointer hover:bg-sky-200";

                        return (
                          <li key={s.start}>
                            <div className={[base, cls].join(" ")}>
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium">{s.label}</span>

                                <span className="text-xs opacity-90">
                                  {s.status === "PAST" && "(Past)"}
                                  {s.status === "PENDING" && "(Pending)"}
                                  {s.status === "CONFIRMED" && "(Confirmed)"}
                                  {s.status === "AVAILABLE" && "(Available)"}
                                </span>
                              </div>

                              {/* Hover actions: show only for pending/confirmed for now */}
                              {(s.status === "PENDING" ||
                                s.status === "CONFIRMED") && (
                                <div className="mt-2 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition">
                                  <button
                                    type="button"
                                    onClick={() => onView(s)}
                                    className="rounded-md border bg-white/70 px-2 py-1 text-xs font-semibold hover:bg-white transition"
                                  >
                                    View
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => onConfirm(s)}
                                    className="rounded-md bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700 transition"
                                  >
                                    Confirm
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => onDecline(s)}
                                    className="rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700 transition"
                                  >
                                    Decline
                                  </button>
                                </div>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>

                    <p className="mt-3 text-xs text-slate-600">
                      UI-only right now. Next step is wiring these buttons to
                      admin API routes.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* View modal */}
          {active && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setActive(null)}
              />

              <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl border p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Appointment details
                    </h3>
                    <p className="text-sm text-slate-600">{active.label}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActive(null)}
                    className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-700">
                  <div>
                    <span className="font-semibold text-slate-800">
                      Status:
                    </span>{" "}
                    {active.status === "PENDING"
                      ? "Pending confirmation"
                      : "Confirmed"}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">Name:</span>{" "}
                    {active.name}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">Email:</span>{" "}
                    {active.email}
                  </div>
                  {active.phone && (
                    <div>
                      <span className="font-semibold text-slate-800">
                        Phone:
                      </span>{" "}
                      {formatPhoneUS(active.phone)}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActive(null)}
                    className="w-full rounded-md bg-slate-900 text-white py-2 font-semibold hover:bg-slate-800 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      </SignedIn>
    </main>
  );
}
