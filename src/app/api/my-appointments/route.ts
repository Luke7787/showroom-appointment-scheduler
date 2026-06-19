import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    const appointments = await prisma.appointment.findMany({
      where: {
        userId,
        endTime: { gt: now },
      },
      orderBy: { startTime: "asc" },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
      },
    });

    return NextResponse.json({
      appointments: appointments.map((a) => ({
        id: a.id,
        start: a.startTime.toISOString(),
        end: a.endTime.toISOString(),
        status: a.status,
      })),
    });
  } catch (err) {
    console.error("[api/my-appointments] Error loading appointments:", err);
    return NextResponse.json(
      { error: "Failed to load appointments" },
      { status: 500 },
    );
  }
}
