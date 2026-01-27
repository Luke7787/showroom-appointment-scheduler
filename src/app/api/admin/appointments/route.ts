import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { TIME_ZONE } from "@/lib/scheduling";

function parseAdminEmails() {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return { ok: false as const, status: 401, msg: "Unauthorized" };

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  const admins = parseAdminEmails();
  const userEmails = user.emailAddresses.map((e: { emailAddress: string }) =>
    e.emailAddress.trim().toLowerCase(),
  );

  const isAdmin = userEmails.some((email) => admins.includes(email));
  if (!isAdmin) return { ok: false as const, status: 403, msg: "Forbidden" };

  return { ok: true as const };
}

// LA date (YYYY-MM-DD) → UTC range for that LA day
function laDayBoundsUTC(dateStr: string) {
  const safe = new Date(`${dateStr}T12:00:00.000Z`);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(safe);

  const y = parts.find((p) => p.type === "year")?.value ?? dateStr.slice(0, 4);
  const m = parts.find((p) => p.type === "month")?.value ?? dateStr.slice(5, 7);
  const d = parts.find((p) => p.type === "day")?.value ?? dateStr.slice(8, 10);

  // NOTE: If you already have a helper in lib/scheduling that your slots route uses,
  // use that instead so both endpoints agree perfectly.
  const startUtc = new Date(`${y}-${m}-${d}T00:00:00`).toISOString();
  const endUtc = new Date(`${y}-${m}-${d}T23:59:59.999`).toISOString();

  return { startUtc, endUtc };
}

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.msg }, { status: admin.status });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "Missing date" }, { status: 400 });
  }

  const { startUtc, endUtc } = laDayBoundsUTC(date);

  const appointments = await prisma.appointment.findMany({
    where: {
      startTime: {
        gte: new Date(startUtc),
        lte: new Date(endUtc),
      },
    },
    orderBy: { startTime: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      startTime: true,
      endTime: true,
    },
  });

  return NextResponse.json({
    appointments: appointments.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      phone: a.phone,
      status: a.status,
      start: a.startTime.toISOString(),
      end: a.endTime.toISOString(),
    })),
  });
}
