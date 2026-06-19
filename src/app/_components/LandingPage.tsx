"use client";

import { SignInButton } from "@clerk/nextjs";

const FEATURES = [
  {
    title: "Real-time availability",
    description:
      "See open 30-minute slots the moment you pick a date. No back-and-forth, no double bookings.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z"
      />
    ),
  },
  {
    title: "Book multiple slots",
    description:
      "Need more time? Select several consecutive slots in a single request and submit them at once.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    ),
  },
  {
    title: "Instant confirmation",
    description:
      "Submit your details and get an on-screen confirmation right away while our team reviews it.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m4.5 12.75 6 6 9-13.5"
      />
    ),
  },
  {
    title: "Private & secure",
    description:
      "Your booking is protected with secure sign-in. Only you and our team can see your appointment.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.96 11.96 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.25-8.25-3.285Z"
      />
    ),
  },
];

const STEPS = [
  {
    number: "01",
    title: "Sign in",
    description: "Create your account or sign in securely in seconds.",
  },
  {
    number: "02",
    title: "Pick a date & time",
    description: "Browse live availability and choose the slots that fit you.",
  },
  {
    number: "03",
    title: "Confirm your visit",
    description: "Add your details and we'll lock in your showroom appointment.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      {/* Background gradient + animated blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
        <div className="lp-animate-blob absolute -left-24 -top-24 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="lp-animate-blob absolute right-0 top-32 h-[28rem] w-[28rem] rounded-full bg-sky-500/20 blur-3xl [animation-delay:4s]" />
        <div className="lp-animate-blob absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl [animation-delay:8s]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      {/* Nav */}
      <header className="relative z-20">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-400 shadow-lg shadow-indigo-500/30">
              <svg
                className="h-5 w-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0V11.25A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                />
              </svg>
            </span>
            <span className="text-base font-semibold tracking-tight">
              Showroom Scheduler
            </span>
          </div>

          <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-white">
              How it works
            </a>
          </div>

          <SignInButton mode="modal">
            <button className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-black/20 transition hover:bg-slate-100 hover:shadow-xl">
              Sign In
            </button>
          </SignInButton>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-14 pb-20 sm:pt-20">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <div className="lp-animate-fade-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-200 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Booking slots open now
            </div>

            <h1 className="lp-animate-fade-up lp-delay-1 mt-6 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Reserve your private
              <span className="block bg-gradient-to-r from-indigo-300 via-sky-300 to-fuchsia-300 bg-clip-text text-transparent lp-text-shimmer">
                showroom experience
              </span>
            </h1>

            <p className="lp-animate-fade-up lp-delay-2 mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
              Skip the phone tag. Choose a date, pick the time slots that work
              for you, and lock in a one-on-one showroom appointment in under a
              minute.
            </p>

            <div className="lp-animate-fade-up lp-delay-3 mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <SignInButton mode="modal">
                <button className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-indigo-500/30 transition hover:shadow-2xl hover:shadow-indigo-500/40 hover:brightness-110">
                  Book your appointment
                  <svg
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                  </svg>
                </button>
              </SignInButton>

              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-base font-semibold text-white backdrop-blur transition hover:bg-white/10"
              >
                See how it works
              </a>
            </div>

            <div className="lp-animate-fade-up lp-delay-4 mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-emerald-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
                Free to book
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-emerald-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
                Real-time availability
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-emerald-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
                Instant confirmation
              </div>
            </div>
          </div>

          {/* Floating preview card */}
          <div className="lp-animate-fade-up lp-delay-2 relative">
            <div className="lp-animate-float relative mx-auto max-w-md">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-indigo-500/20 to-sky-400/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.07] p-5 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      Your appointment
                    </p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      Friday, June 19
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                    Available
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  {[
                    { t: "9:00 – 9:30", active: false },
                    { t: "9:30 – 10:00", active: true },
                    { t: "10:00 – 10:30", active: true },
                    { t: "10:30 – 11:00", active: false },
                    { t: "11:00 – 11:30", active: false },
                    { t: "11:30 – 12:00", active: false },
                  ].map((slot) => (
                    <div
                      key={slot.t}
                      className={[
                        "rounded-xl border px-3 py-2.5 text-sm font-medium transition",
                        slot.active
                          ? "border-indigo-400/60 bg-gradient-to-r from-indigo-500/80 to-sky-500/80 text-white shadow-lg shadow-indigo-500/20"
                          : "border-white/10 bg-white/5 text-slate-300",
                      ].join(" ")}
                    >
                      {slot.t}
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                  <span className="text-sm text-slate-300">2 slots selected</span>
                  <span className="rounded-lg bg-gradient-to-r from-indigo-500 to-sky-400 px-4 py-1.5 text-sm font-semibold text-white">
                    Continue
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="relative z-10 mx-auto max-w-7xl px-6 py-20"
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to book with ease
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            A scheduling experience designed to be fast, clear, and effortless
            from the first click.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl transition group-hover:bg-indigo-500/20" />
              <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-sky-400/20 text-sky-300 ring-1 ring-white/10">
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  {feature.icon}
                </svg>
              </span>
              <h3 className="relative mt-5 text-lg font-semibold text-white">
                {feature.title}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed text-slate-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="relative z-10 mx-auto max-w-7xl px-6 py-20"
      >
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-sky-400">
            How it works
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Booked in three simple steps
          </h2>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.number} className="relative">
              {i < STEPS.length - 1 && (
                <div className="absolute left-[3.25rem] top-8 hidden h-px w-full bg-gradient-to-r from-white/20 to-transparent md:block" />
              )}
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-400 text-xl font-bold text-white shadow-lg shadow-indigo-500/30">
                {step.number}
              </div>
              <h3 className="mt-6 text-xl font-semibold text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-slate-400">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/30 via-slate-900 to-sky-600/30 px-8 py-16 text-center shadow-2xl">
          <div className="lp-animate-blob absolute -left-10 top-0 h-60 w-60 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="lp-animate-blob absolute -right-10 bottom-0 h-60 w-60 rounded-full bg-sky-500/20 blur-3xl [animation-delay:6s]" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to visit the showroom?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
              Find a time that works for you and reserve your spot in just a few
              clicks.
            </p>
            <div className="mt-8 flex justify-center">
              <SignInButton mode="modal">
                <button className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-xl transition hover:bg-slate-100 hover:shadow-2xl">
                  Get started — it's free
                  <svg
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                  </svg>
                </button>
              </SignInButton>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-slate-400 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-sky-400">
              <svg
                className="h-4 w-4 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0V11.25A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                />
              </svg>
            </span>
            <span className="font-medium text-slate-300">
              Showroom Scheduler
            </span>
          </div>
          <p>
            &copy; {new Date().getFullYear()} Showroom Scheduler. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
