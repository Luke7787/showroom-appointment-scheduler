import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type PatchBody = {
  status?: "CONFIRMED";
};

export async function PATCH(req: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params; // ✅ await params

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.status !== "CONFIRMED") {
    return NextResponse.json(
      { error: 'Only status "CONFIRMED" is supported here' },
      { status: 400 },
    );
  }

  try {
    // Only allow confirming pending appointments (optional but recommended)
    const existing = await prisma.appointment.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (existing.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending appointments can be confirmed" },
        { status: 409 },
      );
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: "CONFIRMED" },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    return NextResponse.json(
      {
        appointment: {
          ...updated,
          start: updated.startTime.toISOString(),
          end: updated.endTime.toISOString(),
        },
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params; // ✅ await params

  try {
    const existing = await prisma.appointment.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Optional: only allow deleting pending
    if (existing.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending appointments can be declined" },
        { status: 409 },
      );
    }

    await prisma.appointment.delete({ where: { id } });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
