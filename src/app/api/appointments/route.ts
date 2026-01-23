import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const appointment = await prisma.appointment.create({
    data: {
      userId: "test-user",
      name: "Test User",
      email: "test@example.com",
      startTime: new Date(),
      endTime: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  return NextResponse.json(appointment);
}
