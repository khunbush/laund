"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#14142b",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
          padding: "0 24px",
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Laund</h1>
        <p style={{ opacity: 0.7, marginTop: 8 }}>
          Something went wrong loading the app.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: 20,
            border: 0,
            borderRadius: 999,
            padding: "12px 28px",
            fontSize: 15,
            fontWeight: 600,
            color: "#ffffff",
            background: "linear-gradient(90deg,#7B61FF,#FF6B35)",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
