import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  BUSINESS_END_HOUR,
  BUSINESS_START_HOUR,
  SLOT_MINUTES,
  TIME_ZONE,
  toMinutes,
} from "@/lib/scheduling";

// Parse YYYY-MM-DD safely
function parseYyyyMmDd(dateStr: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isInteger(y) || !Number.isInteger(mo) || !Number.isInteger(d))
    return null;
  // Construct a Date at local midnight using the server’s locale is risky.
  // We will treat the date as a calendar day and only output local-time labels,
  // while querying by UTC range built from LA midnight.
  return { y, mo, d };
}

// Convert a LA date (yyyy-mm-dd) + minutes-from-midnight into a UTC Date
// This uses Intl to avoid adding a heavy date library.
function laLocalToUtcDate(
  { y, mo, d }: { y: number; mo: number; d: number },
  minutes: number,
) {
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;

  // Build a date string in LA, then map to actual UTC by formatting parts.
  // Approach: create an approximate UTC date then adjust by LA offset at that moment.
  const approxUtc = new Date(Date.UTC(y, mo - 1, d, hh, mm, 0));

  // Figure out LA offset at that moment by formatting in LA and comparing
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = dtf.formatToParts(approxUtc);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;

  const ly = Number(get("year"));
  const lmo = Number(get("month"));
  const ld = Number(get("day"));
  const lhh = Number(get("hour"));
  const lmm = Number(get("minute"));

  // If approxUtc when viewed in LA is not the intended LA wall time, adjust by the difference
  const intended = Date.UTC(y, mo - 1, d, hh, mm, 0);
  const viewedAs = Date.UTC(ly, lmo - 1, ld, lhh, lmm, 0);
  const diffMs = intended - viewedAs;

  return new Date(approxUtc.getTime() + diffMs);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  if (!dateStr) {
    return NextResponse.json(
      { error: "Missing date=YYYY-MM-DD" },
      { status: 400 },
    );
  }

  const parsed = parseYyyyMmDd(dateStr);
  if (!parsed) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD." },
      { status: 400 },
    );
  }

  const dayStartUtc = laLocalToUtcDate(parsed, 0);
  const dayEndUtc = laLocalToUtcDate(parsed, 24 * 60);

  const existing = await prisma.appointment.findMany({
    where: {
      startTime: { lt: dayEndUtc },
      endTime: { gt: dayStartUtc },
    },
    select: { startTime: true, endTime: true },
  });

  const startMin = toMinutes(BUSINESS_START_HOUR, 0);
  const endMin = toMinutes(BUSINESS_END_HOUR, 0);

  const now = new Date();

  const slots: Array<{ start: string; end: string }> = [];

  for (let t = startMin; t + SLOT_MINUTES <= endMin; t += SLOT_MINUTES) {
    const slotStartUtc = laLocalToUtcDate(parsed, t);
    const slotEndUtc = laLocalToUtcDate(parsed, t + SLOT_MINUTES);

    // only future slots
    if (slotEndUtc <= now) continue;

    const blocked = existing.some((appt) =>
      overlaps(slotStartUtc, slotEndUtc, appt.startTime, appt.endTime),
    );
    if (blocked) continue;

    // Return ISO strings in UTC; frontend can format in LA
    slots.push({
      start: slotStartUtc.toISOString(),
      end: slotEndUtc.toISOString(),
    });
  }

  return NextResponse.json({ date: dateStr, slots });
}
