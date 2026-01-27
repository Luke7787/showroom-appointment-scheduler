import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

function normalizeEmail(s: string) {
  return s.trim().toLowerCase();
}

function parseAdminEmails(envValue: string | undefined) {
  if (!envValue) return [];
  return envValue
    .split(",")
    .map((e) => normalizeEmail(e))
    .filter(Boolean);
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ isAdmin: false, reason: "SIGNED_OUT" });
  }

  const adminEmails = parseAdminEmails(process.env.ADMIN_EMAILS);

  // If you forget to restart dev server, this commonly ends up empty.
  if (adminEmails.length === 0) {
    return NextResponse.json({
      isAdmin: false,
      reason: "ADMIN_EMAILS_EMPTY",
      hint: "Check .env.local and restart `npm run dev`",
    });
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  // Prefer primary email
  const primaryEmailId = user.primaryEmailAddressId;
  const primaryEmailObj = user.emailAddresses.find(
    (e) => e.id === primaryEmailId,
  );

  // Fallback to first email if needed
  const email =
    primaryEmailObj?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? "";

  const normalized = normalizeEmail(email);
  const isAdmin = adminEmails.includes(normalized);

  return NextResponse.json({
    isAdmin,
    email,
    normalizedEmail: normalized,
    adminEmails,
    userId,
  });
}
