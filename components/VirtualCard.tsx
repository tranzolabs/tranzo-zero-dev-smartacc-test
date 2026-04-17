"use client";

import { useState } from "react";

interface Props {
  smartAddress: string;
}

// Simulated card spend categories (Phase 2 will use real session keys)
const SPEND_LIMIT = 0.05; // 0.05 ETH per day
const SPENT_TODAY = 0.012; // Simulated

export default function VirtualCard({ smartAddress }: Props) {
  const [flipped, setFlipped] = useState(false);

  const shortAddr = smartAddress
    ? `${smartAddress.slice(2, 6)} ${smartAddress.slice(6, 10)} ${smartAddress.slice(10, 14)} ${smartAddress.slice(-4)}`
    : "•••• •••• •••• ••••";

  const spentPercent = Math.min((SPENT_TODAY / SPEND_LIMIT) * 100, 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Card */}
      <div
        onClick={() => setFlipped(!flipped)}
        style={{
          width: "100%",
          aspectRatio: "1.586",
          maxWidth: 380,
          margin: "0 auto",
          borderRadius: "var(--radius-lg)",
          cursor: "pointer",
          position: "relative",
          transition: "transform 0.6s",
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front */}
        <div style={{
          position: "absolute", inset: 0,
          borderRadius: "var(--radius-lg)",
          background: "linear-gradient(135deg, #1a0533 0%, #3d1f8f 40%, #7c3aed 80%, #ec4899 100%)",
          padding: "24px",
          backfaceVisibility: "hidden",
          boxShadow: "0 20px 60px rgba(124,58,237,0.4)",
          overflow: "hidden",
        }}>
          {/* Pattern */}
          <div style={{ position: "absolute", top: -30, right: -30, width: 200, height: 200, borderRadius: "50%", border: "40px solid rgba(255,255,255,0.03)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -60, left: -20, width: 200, height: 200, borderRadius: "50%", border: "50px solid rgba(255,255,255,0.02)", pointerEvents: "none" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "2px" }}>TRANZO</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginTop: 2 }}>CRYPTO CARD · SIMULATED</div>
            </div>
            <div style={{ fontSize: 28 }}>💳</div>
          </div>

          {/* Chip */}
          <div style={{
            width: 40, height: 30, borderRadius: 6,
            background: "linear-gradient(135deg, #d4af37, #f5d77a)",
            marginTop: 20,
          }} />

          {/* Card number */}
          <div style={{
            fontSize: 16, fontWeight: 700, color: "#fff",
            letterSpacing: "3px", marginTop: 16,
            fontFamily: "var(--font-geist-mono)",
          }}>
            {shortAddr || "•••• •••• •••• ••••"}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 16 }}>
            <div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "1px" }}>CARD HOLDER</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginTop: 2 }}>TRANZO USER</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "1px" }}>NETWORK</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", marginTop: 2 }}>BASE SEPOLIA</div>
            </div>
          </div>
        </div>

        {/* Back (flip side) */}
        <div style={{
          position: "absolute", inset: 0,
          borderRadius: "var(--radius-lg)",
          background: "linear-gradient(135deg, #0f0f1a, #1a1a2e)",
          backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}>
          <div style={{ height: 40, background: "#000", marginTop: 30 }} />
          <div style={{ padding: "20px 24px" }}>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8 }}>CVV</div>
            <div style={{
              background: "rgba(255,255,255,0.1)", borderRadius: 4,
              padding: "8px 14px", display: "flex", justifyContent: "flex-end",
              fontFamily: "var(--font-geist-mono)", fontSize: 16, color: "#fff",
            }}>
              •••
            </div>
            <div style={{ marginTop: 20, fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
              This is a simulated virtual card for the Tranzo Money MVP. Real card functionality coming soon.
            </div>
          </div>
        </div>
      </div>

      {/* Tap hint */}
      <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)" }}>
        Tap card to flip
      </div>

      {/* Spending Limit */}
      <div style={{
        padding: "20px",
        borderRadius: "var(--radius-md)",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Daily Spending Limit</span>
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {SPENT_TODAY} / {SPEND_LIMIT} ETH
          </span>
        </div>
        <div style={{
          height: 8, borderRadius: 4,
          background: "var(--bg-surface)",
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            width: `${spentPercent}%`,
            borderRadius: 4,
            background: spentPercent > 80
              ? "linear-gradient(90deg, #ef4444, #f97316)"
              : "linear-gradient(90deg, #7c3aed, #ec4899)",
            transition: "width 0.5s ease",
          }} />
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Resets daily at midnight UTC
        </div>
      </div>

      {/* Card Controls */}
      <div style={{
        padding: "20px",
        borderRadius: "var(--radius-md)",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        display: "flex", flexDirection: "column", gap: 14,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Card Controls</div>

        {[
          { label: "Card Status", value: "🟢 Active", detail: "Simulated" },
          { label: "Spending Limit", value: `${SPEND_LIMIT} ETH / day`, detail: "Session key policy" },
          { label: "Gas Payment", value: "⛽ Free", detail: "Sponsored by Tranzo" },
        ].map((item) => (
          <div key={item.label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{item.detail}</div>
            </div>
            <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Coming Soon Banner */}
      <div style={{
        padding: "14px 18px",
        borderRadius: "var(--radius-md)",
        background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(236,72,153,0.1))",
        border: "1px solid var(--border-bright)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-violet)" }}>
          🚀 Real card integration coming soon
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
          Session keys + on-chain settlement powered by ZeroDev
        </div>
      </div>
    </div>
  );
}
