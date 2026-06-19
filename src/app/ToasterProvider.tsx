"use client";

import { Toaster } from "react-hot-toast";

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      toastOptions={{
        style: {
          background: "rgba(15, 23, 42, 0.95)",
          color: "#e2e8f0",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "0.75rem",
          backdropFilter: "blur(12px)",
        },
        success: {
          iconTheme: { primary: "#34d399", secondary: "#0f172a" },
        },
        error: {
          iconTheme: { primary: "#fb7185", secondary: "#0f172a" },
        },
      }}
    />
  );
}
