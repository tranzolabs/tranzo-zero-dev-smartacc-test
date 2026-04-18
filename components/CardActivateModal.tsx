"use client";

import { useState } from "react";
import { useWallet } from "@/lib/WalletContext";

const LIMITS = [
  { label: "Basic", eth: "0.005", usd: "~$14", color: "#10b981" },
  { label: "Standard", eth: "0.02", usd: "~$56", color: "#7c3aed" },
  { label: "Premium", eth: "0.05", usd: "~$140", color: "#ec4899" },
];

interface Props { onClose: () => void; }

export default function CardActivateModal({ onClose }: Props) {
  const { activateCard, cardIsActivating, isCardActive } = useWallet();
  const [selected, setSelected] = useState(LIMITS[1]);
  const [step, setStep] = useState<"select" | "activating" | "done">("select");
  const [setupHash, setSetupHash] = useState("");
  const [error, setError] = useState("");

  async function handleActivate() {
    setStep("activating");
    setError("");
    try {
      await activateCard(selected.eth);
      setStep("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message.slice(0, 300) : "Activation failed");
      setStep("select");
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 120, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }} />
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: 520,
        background: "var(--bg-card)",
        borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
        border: "1px solid var(--border)", borderBottom: "none",
        padding: "24px 24px 48px",
        animation: "fadeIn 0.3s ease",
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border-bright)", margin: "0 auto 20px" }} />

        {step === "done" ? (
          <DoneView onClose={onClose} spendLimit={selected.eth} setupHash={setupHash} />
        ) : step === "activating" ? (
          <ActivatingView isEditing={isCardActive} />
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h2 style={{ fontSize: 20, fontWeight: 800 }}>
                  {isCardActive ? "✏️ Edit Spend Limit" : "🔐 Activate Your Card"}
                </h2>
                <div style={{ padding: "4px 8px", background: "rgba(16,185,129,0.1)", color: "#10b981", borderRadius: 6, fontSize: 11, fontWeight: 800 }}>
                  100% FREE
                </div>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.6 }}>
                {isCardActive 
                  ? "Update your on-chain session key to change how much you can spend automatically."
                  : "This creates a session key linked to your smart account. After activation, card payments auto-sign."}
              </p>
            </div>

            {/* Spend limit selector */}
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10 }}>
              MAX SPEND PER SWIPE
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              {LIMITS.map((l) => (
                <button
                  key={l.label}
                  onClick={() => setSelected(l)}
                  style={{
                    flex: 1, padding: "14px 8px",
                    borderRadius: "var(--radius-md)",
                    background: selected.eth === l.eth ? `${l.color}18` : "var(--bg-surface)",
                    border: `1.5px solid ${selected.eth === l.eth ? l.color : "var(--border)"}`,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: selected.eth === l.eth ? l.color : "var(--text-muted)" }}>{l.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: selected.eth === l.eth ? l.color : "var(--text-primary)" }}>{l.eth} ETH</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", opacity: 0.7 }}>Limit</div>
                </button>
              ))}
            </div>

            {/* How it works */}
            <div style={{
              padding: "14px 16px", borderRadius: "var(--radius-md)",
              background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)",
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-violet)", marginBottom: 8 }}>SECURITY</div>
              {[
                ["💸", "Activation is 100% FREE (ZeroDev sponsored)"],
                ["🔐", "Master key is only needed once for setup"],
                ["🔒", `Limits enforced on-chain: max ${selected.eth} ETH`],
              ].map(([icon, text]) => (
                <div key={text as string} style={{ fontSize: 12, color: "var(--text-secondary)", padding: "4px 0", display: "flex", gap: 8 }}>
                  <span>{icon}</span><span>{text}</span>
                </div>
              ))}
            </div>

            {error && (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", fontSize: 12, color: "#ef4444", marginBottom: 12 }}>
                ⚠️ {error}
              </div>
            )}

            <button
              id="btn-activate-card"
              onClick={handleActivate}
              disabled={cardIsActivating}
              style={{
                width: "100%", padding: "16px",
                borderRadius: "var(--radius-md)",
                background: `linear-gradient(135deg, ${selected.color}, #7c3aed)`,
                color: "#fff", fontSize: 16, fontWeight: 700,
                boxShadow: `0 8px 24px ${selected.color}40`,
              }}
            >
              🔐 Activate Card (One-time Setup)
            </button>
            <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 8 }}>
              Gas fee: FREE — sponsored by ZeroDev
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function ActivatingView({ isEditing }: { isEditing?: boolean }) {
  const steps = [
    "Generating session key (card key)...",
    "Building call policy (spend limit)...",
    "Sending activation UserOp...",
    "Waiting for on-chain confirmation...",
    isEditing ? "Limit updated!" : "Card activated!",
  ];
  const [cur, setCur] = useState(0);

  useState(() => {
    const t = setInterval(() => setCur(c => Math.min(c + 1, steps.length - 1)), 1500);
    return () => clearInterval(t);
  });

  return (
    <div style={{ textAlign: "center", padding: "20px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div style={{ fontSize: 52, animation: "spin 1s linear infinite" }}>⚙️</div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800 }}>Activating Card...</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>One master key signature needed</div>
      </div>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
              background: i < cur ? "#10b981" : i === cur ? "var(--accent-violet)" : "var(--bg-surface)",
              border: i === cur ? "2px solid var(--accent-violet)" : "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, color: i < cur ? "#fff" : "transparent",
            }}>✓</div>
            <span style={{ fontSize: 13, color: i <= cur ? "var(--text-primary)" : "var(--text-muted)", fontWeight: i === cur ? 700 : 400 }}>
              {s}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DoneView({ onClose, spendLimit, setupHash }: { onClose: () => void; spendLimit: string; setupHash: string }) {
  return (
    <div style={{ textAlign: "center", padding: "10px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div style={{ fontSize: 64 }}>💳</div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 900, color: "#10b981" }}>Card Activated!</div>
        <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>
          Session key installed on-chain
        </div>
      </div>
      <div style={{ width: "100%", padding: "14px 16px", borderRadius: "var(--radius-md)", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
        {[
          ["✅ Session key", "Generated & saved"],
          ["✅ Spend limit", `${spendLimit} ETH per swipe`],
          ["✅ Gas", "Free (ZeroDev paymaster)"],
          ["✅ Status", "Ready to use"],
        ].map(([k, v]) => (
          <div key={k as string} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
            <span style={{ color: "var(--text-muted)" }}>{k}</span>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{v}</span>
          </div>
        ))}
      </div>
      <button
        id="btn-card-activated-done"
        onClick={onClose}
        style={{
          width: "100%", padding: "14px", borderRadius: "var(--radius-md)",
          background: "linear-gradient(135deg, #10b981, #7c3aed)",
          color: "#fff", fontSize: 15, fontWeight: 700,
        }}
      >
        Start Spending 💳
      </button>
    </div>
  );
}
