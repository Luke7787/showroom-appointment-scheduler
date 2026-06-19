import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// Cancel one of the current user's own appointments
export async function DELETE(_req: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const existing = await prisma.appointment.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    // Don't reveal existence of other users' appointments
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.appointment.delete({ where: { id } });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[api/my-appointments] Error canceling appointment:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
