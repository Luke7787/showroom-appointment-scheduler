import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import {
  SLOT_MINUTES,
  BUSINESS_START_HOUR,
  BUSINESS_END_HOUR,
  TIME_ZONE,
} from "@/lib/scheduling";

type SlotInput = {
  startTime: string; // ISO
  endTime: string; // ISO
};

type CreateAppointmentsBody = {
  name: string;
  email: string;
  phone?: string;
  slots: SlotInput[];
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Convert a UTC Date into LA "wall clock" parts using Intl
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

  if (start.minute % SLOT_MINUTES !== 0) {
    return `Slot must start on a ${SLOT_MINUTES}-minute boundary`;
  }

  const startOk =
    start.hour > BUSINESS_START_HOUR ||
    (start.hour === BUSINESS_START_HOUR && start.minute >= 0);

  const endOk =
    end.hour < BUSINESS_END_HOUR ||
    (end.hour === BUSINESS_END_HOUR && end.minute <= 0);

  if (!startOk || !endOk) {
    return `Slot must be within business hours ${BUSINESS_START_HOUR}:00–${BUSINESS_END_HOUR}:00 (${TIME_ZONE})`;
  }

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
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateAppointmentsBody;
  try {
    body = (await req.json()) as CreateAppointmentsBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, email, phone, slots } = body;

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json(
      { error: "Name and email are required" },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  if (!Array.isArray(slots) || slots.length === 0) {
    return NextResponse.json(
      { error: "At least one slot is required" },
      { status: 400 },
    );
  }

  // Parse + validate each slot
  const parsedSlots = slots.map((s) => {
    const startUtc = new Date(s.startTime);
    const endUtc = new Date(s.endTime);
    return { startUtc, endUtc };
  });

  for (const { startUtc, endUtc } of parsedSlots) {
    const err = validateSlot(startUtc, endUtc);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
  }

  // Prevent duplicate startTimes in request
  const starts = parsedSlots.map((s) => s.startUtc.getTime());
  const uniqueStarts = new Set(starts);
  if (uniqueStarts.size !== starts.length) {
    return NextResponse.json(
      { error: "Duplicate slots selected" },
      { status: 400 },
    );
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      // Check overlaps for each slot inside the transaction
      for (const { startUtc, endUtc } of parsedSlots) {
        const overlapping = await tx.appointment.findFirst({
          where: {
            startTime: { lt: endUtc },
            endTime: { gt: startUtc },
          },
          select: { id: true },
        });

        if (overlapping) {
          throw new Error("SLOT_TAKEN");
        }
      }

      // Create each appointment (default is PENDING, but we set explicitly)
      const results = [];
      for (const { startUtc, endUtc } of parsedSlots) {
        const appt = await tx.appointment.create({
          data: {
            userId,
            name: name.trim(),
            email: email.trim(),
            phone: phone?.trim() ? phone.trim() : null,
            startTime: startUtc,
            endTime: endUtc,
            status: "PENDING",
          },
        });
        results.push(appt);
      }

      return results;
    });

    return NextResponse.json({ appointments: created }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "SLOT_TAKEN") {
      return NextResponse.json(
        { error: "One or more selected slots are already booked" },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
