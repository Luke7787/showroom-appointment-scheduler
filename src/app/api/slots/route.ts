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

  if (!Number.isInteger(y) || !Number.isInteger(mo) || !Number.isInteger(d)) {
    return null;
  }

  return { y, mo, d };
}

// Convert a LA date (yyyy-mm-dd) + minutes-from-midnight into a UTC Date
function laLocalToUtcDate(
  { y, mo, d }: { y: number; mo: number; d: number },
  minutes: number,
) {
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;

  const approxUtc = new Date(Date.UTC(y, mo - 1, d, hh, mm, 0));

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

  const intended = Date.UTC(y, mo - 1, d, hh, mm, 0);
  const viewedAs = Date.UTC(ly, lmo - 1, ld, lhh, lmm, 0);
  const diffMs = intended - viewedAs;

  return new Date(approxUtc.getTime() + diffMs);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

function formatLabel(startUtc: Date, endUtc: Date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  });
  return `${fmt.format(startUtc)} – ${fmt.format(endUtc)}`;
}

function todayLA() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

type SlotStatus = "AVAILABLE" | "PENDING" | "CONFIRMED" | "PAST";

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

  // include status so we can return pending/confirmed
  const existing = await prisma.appointment.findMany({
    where: {
      startTime: { lt: dayEndUtc },
      endTime: { gt: dayStartUtc },
    },
    select: { startTime: true, endTime: true, status: true },
  });

  const startMin = toMinutes(BUSINESS_START_HOUR, 0);
  const endMin = toMinutes(BUSINESS_END_HOUR, 0);

  const now = new Date();

  // ✅ Fix: mark *entire past days* as PAST (not just "today")
  const todayStr = todayLA();
  const isToday = dateStr === todayStr;
  const isPastDay = dateStr < todayStr; // YYYY-MM-DD string compare is safe

  const slots: Array<{
    start: string;
    end: string;
    label: string;
    status: SlotStatus;
  }> = [];

  for (let t = startMin; t + SLOT_MINUTES <= endMin; t += SLOT_MINUTES) {
    const slotStartUtc = laLocalToUtcDate(parsed, t);
    const slotEndUtc = laLocalToUtcDate(parsed, t + SLOT_MINUTES);

    // ✅ Past slots:
    // - If the selected date is before today (LA), everything is PAST
    // - If today, a slot is PAST only once the slot has ended (end <= now)
    if (isPastDay || (isToday && slotEndUtc <= now)) {
      slots.push({
        start: slotStartUtc.toISOString(),
        end: slotEndUtc.toISOString(),
        label: formatLabel(slotStartUtc, slotEndUtc),
        status: "PAST",
      });
      continue;
    }

    const overlapping = existing.find((appt) =>
      overlaps(slotStartUtc, slotEndUtc, appt.startTime, appt.endTime),
    );

    if (overlapping) {
      slots.push({
        start: slotStartUtc.toISOString(),
        end: slotEndUtc.toISOString(),
        label: formatLabel(slotStartUtc, slotEndUtc),
        status: overlapping.status === "CONFIRMED" ? "CONFIRMED" : "PENDING",
      });
      continue;
    }

    slots.push({
      start: slotStartUtc.toISOString(),
      end: slotEndUtc.toISOString(),
      label: formatLabel(slotStartUtc, slotEndUtc),
      status: "AVAILABLE",
    });
  }

  return NextResponse.json({ date: dateStr, slots });
}
