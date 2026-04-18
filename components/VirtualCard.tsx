"use client";

import { useState } from "react";
import CardPayModal from "@/components/CardPayModal";

interface Props {
  smartAddress: string;
}

export default function VirtualCard({ smartAddress }: Props) {
  const [flipped, setFlipped] = useState(false);
  const [showPay, setShowPay] = useState(false);

  const shortAddr = smartAddress
    ? `${smartAddress.slice(2, 6)} ${smartAddress.slice(6, 10)} ${smartAddress.slice(10, 14)} ${smartAddress.slice(-4)}`
    : "•••• •••• •••• ••••";

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* 3D Card */}
        <div
          onClick={() => setFlipped(!flipped)}
          style={{
            width: "100%", aspectRatio: "1.586", maxWidth: 380,
            margin: "0 auto", borderRadius: "var(--radius-lg)",
            cursor: "pointer", position: "relative",
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
            padding: "24px", backfaceVisibility: "hidden",
            boxShadow: "0 20px 60px rgba(124,58,237,0.4)", overflow: "hidden",
          }}>
            {/* Decorative circles */}
            <div style={{ position: "absolute", top: -30, right: -30, width: 200, height: 200, borderRadius: "50%", border: "40px solid rgba(255,255,255,0.03)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -60, left: -20, width: 200, height: 200, borderRadius: "50%", border: "50px solid rgba(255,255,255,0.02)", pointerEvents: "none" }} />

            {/* Top row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "2px" }}>TRANZO</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "1px", marginTop: 2 }}>CRYPTO CARD · LIVE</div>
              </div>
              {/* NFC symbol */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontSize: 20, color: "rgba(255,255,255,0.6)" }}>📡</div>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>NFC</div>
              </div>
            </div>

            {/* Chip */}
            <div style={{ width: 40, height: 30, borderRadius: 6, background: "linear-gradient(135deg, #d4af37, #f5d77a)", marginTop: 20 }} />

            {/* Card number */}
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "3px", marginTop: 14, fontFamily: "var(--font-geist-mono)" }}>
              {shortAddr}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 14 }}>
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

          {/* Back */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: "var(--radius-lg)",
            background: "linear-gradient(135deg, #0f0f1a, #1a1a2e)",
            backfaceVisibility: "hidden", transform: "rotateY(180deg)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)", overflow: "hidden",
          }}>
            <div style={{ height: 40, background: "#000", marginTop: 30 }} />
            <div style={{ padding: "20px 24px" }}>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8 }}>CVV</div>
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 4, padding: "8px 14px", display: "flex", justifyContent: "flex-end", fontFamily: "var(--font-geist-mono)", fontSize: 16, color: "#fff" }}>
                •••
              </div>
              <div style={{ marginTop: 16, fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
                Non-custodial card linked to your Kernel Smart Account. Tap front to flip back.
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)" }}>
          Tap card to flip · 📡 NFC-enabled
        </div>

        {/* TAP TO PAY button */}
        <button
          id="btn-tap-to-pay"
          onClick={(e) => { e.stopPropagation(); setShowPay(true); }}
          style={{
            padding: "18px 24px",
            borderRadius: "var(--radius-md)",
            background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
            color: "#fff", fontSize: 16, fontWeight: 800,
            boxShadow: "0 8px 32px rgba(124,58,237,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            border: "none", cursor: "pointer",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(124,58,237,0.5)"; }}
          onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(124,58,237,0.4)"; }}
        >
          <span style={{ fontSize: 24 }}>📡</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Tap to Pay</div>
            <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.8 }}>Gasless · On-chain · Instant</div>
          </div>
        </button>

        {/* Card controls info */}
        <div style={{ padding: "18px", borderRadius: "var(--radius-md)", background: "var(--bg-card)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Card Status</div>
          {[
            { label: "Status", value: "🟢 Active", detail: "Ready to spend" },
            { label: "Gas Fee", value: "⛽ FREE", detail: "Sponsored by ZeroDev" },
            { label: "Settlement", value: "⚡ Instant", detail: "Base Sepolia L2" },
            { label: "Type", value: "🔑 Non-custodial", detail: "Your keys, your card" },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{item.detail}</div>
              </div>
              <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Merchant Terminal link */}
        <a
          href="/merchant"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: "14px 18px",
            borderRadius: "var(--radius-md)",
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.25)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            textDecoration: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🏪</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>Open Merchant Terminal</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>View payment received & settlement</div>
            </div>
          </div>
          <span style={{ color: "#10b981", fontSize: 16 }}>↗</span>
        </a>
      </div>

      {showPay && <CardPayModal onClose={() => setShowPay(false)} />}
    </>
  );
}
