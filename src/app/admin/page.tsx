"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

const TIME_ZONE = "America/Los_Angeles";

type SlotStatus = "AVAILABLE" | "PENDING" | "CONFIRMED" | "PAST";

type AdminSlot = {
  start: string; // ISO UTC
  end: string; // ISO UTC
  label: string; // formatted in LA (from API)
  status: SlotStatus;
};

type AppointmentDetails = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  status: "PENDING" | "CONFIRMED";
  start: string; // ISO UTC
  end: string; // ISO UTC
  label?: string; // filled from slot.label in UI
};

function formatAdminDate(dateStr: string) {
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

function getErrMsg(err: unknown) {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}

export default function AdminPage() {
  const [date, setDate] = useState("");
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const [active, setActive] = useState<AppointmentDetails | null>(null);

  const [slots, setSlots] = useState<AdminSlot[]>([]);
  const [apptByStart, setApptByStart] = useState<
    Map<string, AppointmentDetails>
  >(() => new Map());

  const [loading, setLoading] = useState(false);

  async function reload(currentDate?: string) {
    const d = currentDate ?? date;
    if (!d) return;

    setLoading(true);
    try {
      const [slotsRes, apptRes] = await Promise.all([
        fetch(`/api/slots?date=${encodeURIComponent(d)}`, {
          method: "GET",
          credentials: "include",
        }),
        fetch(`/api/admin/appointments?date=${encodeURIComponent(d)}`, {
          method: "GET",
          credentials: "include",
        }),
      ]);

      if (!slotsRes.ok) {
        const txt = await slotsRes.text();
        throw new Error(`Slots API failed: ${slotsRes.status} ${txt}`);
      }
      if (!apptRes.ok) {
        const txt = await apptRes.text();
        throw new Error(
          `Admin appointments API failed: ${apptRes.status} ${txt}`,
        );
      }

      const slotsJson = (await slotsRes.json()) as
        | { slots: AdminSlot[] }
        | AdminSlot[];
      const apptsJson = (await apptRes.json()) as
        | { appointments: AppointmentDetails[] }
        | AppointmentDetails[];

      const slotsArr = Array.isArray(slotsJson) ? slotsJson : slotsJson.slots;
      const apptsArr = Array.isArray(apptsJson)
        ? apptsJson
        : apptsJson.appointments;

      const map = new Map<string, AppointmentDetails>();
      for (const a of apptsArr) map.set(a.start, a);

      setSlots(slotsArr);
      setApptByStart(map);
    } catch (err: unknown) {
      toast(getErrMsg(err) || "Failed to refresh.", { icon: "❌" });
      setSlots([]);
      setApptByStart(new Map());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!date) {
      setSlots([]);
      setApptByStart(new Map());
      setActive(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await reload(date);
      } finally {
        if (cancelled) return;
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const labelByStart = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of slots) m.set(s.start, s.label);
    return m;
  }, [slots]);

  function onView(slot: AdminSlot) {
    const appt = apptByStart.get(slot.start);
    if (!appt) {
      toast("No appointment for this slot (available for booking).", {
        icon: "ℹ️",
      });
      return;
    }

    setActive({
      ...appt,
      label: slot.label,
    });
  }

  async function onConfirm(slot: AdminSlot) {
    const appt = apptByStart.get(slot.start);
    if (!appt) {
      toast("No appointment found for this slot.", { icon: "ℹ️" });
      return;
    }
    if (appt.status !== "PENDING") {
      toast("Only pending requests can be confirmed.", { icon: "ℹ️" });
      return;
    }

    try {
      const id = encodeURIComponent(String(appt.id));
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED" }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Confirm failed: ${res.status} ${txt}`);
      }

      toast.success("Confirmed");
      await reload();

      setActive((cur) =>
        cur?.id === appt.id ? { ...cur, status: "CONFIRMED" } : cur,
      );
    } catch (e: unknown) {
      toast(getErrMsg(e) || "Confirm failed.", { icon: "❌" });
    }
  }

  async function onDecline(slot: AdminSlot) {
    const appt = apptByStart.get(slot.start);
    if (!appt) {
      toast("No appointment found for this slot.", { icon: "ℹ️" });
      return;
    }
    if (appt.status !== "PENDING") {
      toast("Only pending requests can be declined.", { icon: "ℹ️" });
      return;
    }

    try {
      const id = encodeURIComponent(String(appt.id));
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Decline failed: ${res.status} ${txt}`);
      }

      toast("Declined", { icon: "🗑️" });
      setActive(null);
      await reload();
    } catch (e: unknown) {
      toast(getErrMsg(e) || "Decline failed.", { icon: "❌" });
    }
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

                    {loading ? (
                      <span className="text-sm text-slate-700">Loading…</span>
                    ) : (
                      <span className="text-sm text-slate-700">
                        Hover a slot for actions
                      </span>
                    )}
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
                                  {s.status === "AVAILABLE" &&
                                    "(Available for booking)"}
                                </span>
                              </div>

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

                                  {s.status === "PENDING" && (
                                    <>
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
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>

                    {slots.length === 0 && !loading && (
                      <p className="mt-3 text-sm text-slate-600">
                        No slots returned for this date.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

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
                    <p className="text-sm text-slate-600">
                      {active.label ?? labelByStart.get(active.start) ?? ""}
                    </p>
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
