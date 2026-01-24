import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import {
  SLOT_MINUTES,
  BUSINESS_START_HOUR,
  BUSINESS_END_HOUR,
  TIME_ZONE,
} from "@/lib/scheduling";

// Body the client should send
type CreateAppointmentBody = {
  startTime: string; // ISO
  endTime: string; // ISO
  name: string;
  email: string;
  phone?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Convert a UTC Date into LA "wall clock" parts using Intl (no dependencies)
function getZonedParts(dateUtc: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(dateUtc);

  const get = (type: string) => parts.find((p) => p.type === type)?.value;

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

function validateSlot(startUtc: Date, endUtc: Date) {
  if (Number.isNaN(startUtc.getTime()) || Number.isNaN(endUtc.getTime())) {
    return "Invalid startTime/endTime";
  }

  const durationMinutes = (endUtc.getTime() - startUtc.getTime()) / 60000;
  if (durationMinutes !== SLOT_MINUTES) {
    return `Slot must be exactly ${SLOT_MINUTES} minutes`;
  }

  // No past times (compare absolute time in UTC)
  if (startUtc.getTime() <= Date.now()) {
    return "Cannot book a time in the past";
  }

  // Business-hours check in America/Los_Angeles using Intl parts
  const start = getZonedParts(startUtc);
  const end = getZonedParts(endUtc);

  // Must start on :00 or :30 (if SLOT_MINUTES is 30)
  if (start.minute % SLOT_MINUTES !== 0) {
    return `Slot must start on a ${SLOT_MINUTES}-minute boundary`;
  }

  // Start must be >= 09:00
  const startOk =
    start.hour > BUSINESS_START_HOUR ||
    (start.hour === BUSINESS_START_HOUR && start.minute >= 0);

  // End must be <= 17:00
  const endOk =
    end.hour < BUSINESS_END_HOUR ||
    (end.hour === BUSINESS_END_HOUR && end.minute <= 0);

  if (!startOk || !endOk) {
    return `Slot must be within business hours ${BUSINESS_START_HOUR}:00–${BUSINESS_END_HOUR}:00 (${TIME_ZONE})`;
  }

  // Also ensure start and end are on the same LA calendar date
  const sameLocalDay =
    start.year === end.year &&
    start.month === end.month &&
    start.day === end.day;

  if (!sameLocalDay) {
    return "Slot must start and end on the same day";
  }

  return null;
}

export async function POST(req: Request) {
  // ✅ Clerk auth (App Router)
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateAppointmentBody;
  try {
    body = (await req.json()) as CreateAppointmentBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { startTime, endTime, name, email, phone } = body;

  if (!startTime || !endTime || !name || !email) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const startUtc = new Date(startTime);
  const endUtc = new Date(endTime);

  const slotError = validateSlot(startUtc, endUtc);
  if (slotError) {
    return NextResponse.json({ error: slotError }, { status: 400 });
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      // overlap: existing.start < new.end AND existing.end > new.start
      const overlapping = await tx.appointment.findFirst({
        where: {
          startTime: { lt: endUtc },
          endTime: { gt: startUtc },
        },
        select: { id: true },
      });

      if (overlapping) {
        // Abort tx by throwing
        throw new Error("SLOT_TAKEN");
      }

      return tx.appointment.create({
        data: {
          userId,
          name,
          email,
          phone: phone?.trim() ? phone.trim() : null,
          startTime: startUtc,
          endTime: endUtc,
        },
      });
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "SLOT_TAKEN") {
      return NextResponse.json(
        { error: "Slot already booked" },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
