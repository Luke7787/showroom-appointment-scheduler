import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ToasterProvider from "./ToasterProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Showroom Scheduler — Book your private showroom visit",
    template: "%s · Showroom Scheduler",
  },
  description:
    "Reserve a private, one-on-one showroom appointment in under a minute. See live availability, pick your time slots, and get instant confirmation.",
  keywords: [
    "showroom",
    "appointment",
    "booking",
    "scheduler",
    "reservation",
  ],
  openGraph: {
    title: "Showroom Scheduler — Book your private showroom visit",
    description:
      "Reserve a private showroom appointment in under a minute with live availability and instant confirmation.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Showroom Scheduler",
    description:
      "Reserve a private showroom appointment in under a minute with live availability and instant confirmation.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#6366f1",
          colorBackground: "#0f172a",
          colorText: "#e2e8f0",
          colorTextSecondary: "#94a3b8",
          colorInputBackground: "#1e293b",
          colorInputText: "#e2e8f0",
          colorNeutral: "#e2e8f0",
          borderRadius: "0.75rem",
        },
        elements: {
          card: "bg-slate-900 border border-white/10 shadow-2xl",
          modalContent: "shadow-2xl",
          headerTitle: "text-white",
          headerSubtitle: "text-slate-400",
          socialButtonsBlockButton:
            "border border-white/10 bg-white/5 hover:bg-white/10 text-white",
          formButtonPrimary:
            "bg-gradient-to-r from-indigo-500 to-sky-400 hover:brightness-110 text-white",
          footerActionLink: "text-sky-400 hover:text-sky-300",
        },
      }}
    >
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ToasterProvider />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
