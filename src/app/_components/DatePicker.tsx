"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toYmd(y: number, m: number, d: number) {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

function parseYmd(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return { y, m, d };
}

type Props = {
  value: string; // YYYY-MM-DD ("" = none)
  min?: string; // YYYY-MM-DD
  onChange: (value: string) => void;
};

export default function DatePicker({ value, min, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const base = useMemo(() => {
    if (value) return parseYmd(value);
    if (min) return parseYmd(min);
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
  }, [value, min]);

  const [viewY, setViewY] = useState(base.y);
  const [viewM, setViewM] = useState(base.m); // 1-12

  // Sync the visible month when the value changes from outside (e.g. quick chips)
  useEffect(() => {
    if (value) {
      const p = parseYmd(value);
      setViewY(p.y);
      setViewM(p.m);
    }
  }, [value]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;

    function onPointer(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const firstDow = new Date(viewY, viewM - 1, 1).getDay();
  const daysInMonth = new Date(viewY, viewM, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const minYmd = min ?? "";
  // Disable "previous month" once we're viewing the min month (or earlier),
  // so users can't page into a month where every day is unavailable.
  const prevDisabled = (() => {
    if (!minYmd) return false;
    const minParsed = parseYmd(minYmd);
    return (
      viewY < minParsed.y || (viewY === minParsed.y && viewM <= minParsed.m)
    );
  })();

  const displayLabel = value
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(`${value}T12:00:00`))
    : "Select a date";

  function goPrev() {
    if (prevDisabled) return;
    setViewM((m) => {
      if (m === 1) {
        setViewY((y) => y - 1);
        return 12;
      }
      return m - 1;
    });
  }

  function goNext() {
    setViewM((m) => {
      if (m === 12) {
        setViewY((y) => y + 1);
        return 1;
      }
      return m + 1;
    });
  }

  function selectDay(d: number) {
    const ymd = toYmd(viewY, viewM, d);
    if (minYmd && ymd < minYmd) return;
    onChange(ymd);
    setOpen(false);
  }

  const todayParts = (() => {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate() };
  })();

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger field — clicking anywhere opens the calendar */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          "flex w-full items-center justify-between gap-3 rounded-xl border bg-white/5 px-5 py-3 text-left text-lg text-white shadow-sm outline-none transition",
          open
            ? "border-sky-400/60 ring-2 ring-sky-400/30"
            : "border-white/15 hover:bg-white/10",
        ].join(" ")}
      >
        <span className={value ? "text-white" : "text-slate-500"}>
          {displayLabel}
        </span>
        <svg
          className="h-5 w-5 shrink-0 text-sky-300"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0V11.25A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
          />
        </svg>
      </button>

      {/* Calendar popover */}
      {open && (
        <div className="lp-animate-pop absolute left-0 right-0 z-30 mt-2 rounded-2xl border border-white/10 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl sm:max-w-xs">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={goPrev}
              disabled={prevDisabled}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Previous month"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5 8.25 12l7.5-7.5"
                />
              </svg>
            </button>

            <div className="text-sm font-semibold text-white">
              {MONTHS[viewM - 1]} {viewY}
            </div>

            <button
              type="button"
              onClick={goNext}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Next month"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m8.25 4.5 7.5 7.5-7.5 7.5"
                />
              </svg>
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-500">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <div key={`empty-${i}`} />;

              const ymd = toYmd(viewY, viewM, d);
              const disabled = !!minYmd && ymd < minYmd;
              const isSelected = value === ymd;
              const isToday =
                todayParts.y === viewY &&
                todayParts.m === viewM &&
                todayParts.d === d;

              return (
                <button
                  key={ymd}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDay(d)}
                  className={[
                    "relative flex h-9 items-center justify-center rounded-lg text-sm transition",
                    disabled
                      ? "cursor-not-allowed text-slate-600"
                      : isSelected
                        ? "bg-gradient-to-br from-indigo-500 to-sky-400 font-semibold text-white shadow-lg shadow-indigo-500/30"
                        : "text-slate-200 hover:bg-white/10",
                  ].join(" ")}
                >
                  {d}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 h-1 w-1 rounded-full bg-sky-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
