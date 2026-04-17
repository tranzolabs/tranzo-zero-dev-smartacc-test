interface Props {
  message?: string;
}

export default function LoadingScreen({ message = "Loading your wallet..." }: Props) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-primary)",
        gap: "24px",
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "linear-gradient(135deg, #7c3aed, #ec4899)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32,
          boxShadow: "0 0 40px rgba(124,58,237,0.5)",
          animation: "pulse-glow 2s ease infinite",
        }}
      >
        💳
      </div>

      <div style={{ textAlign: "center" }}>
        <h1
          style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px" }}
          className="gradient-text"
        >
          Tranzo Money
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 6 }}>
          {message}
        </p>
      </div>

      {/* Spinner */}
      <div
        style={{
          width: 32, height: 32, borderRadius: "50%",
          border: "3px solid var(--border)",
          borderTopColor: "#7c3aed",
          animation: "spin-slow 1s linear infinite",
        }}
      />
    </div>
  );
}
