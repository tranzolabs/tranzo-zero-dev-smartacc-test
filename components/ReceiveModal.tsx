"use client";

import { useState } from "react";
import { useWallet } from "@/lib/WalletContext";

interface Props { onClose: () => void; }

export default function ReceiveModal({ onClose }: Props) {
  const { smartAddress } = useWallet();
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(smartAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal title="Receive ETH" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>

        {/* QR placeholder */}
        <div
          style={{
            width: 180, height: 180, borderRadius: "var(--radius-md)",
            background: "var(--bg-surface)",
            border: "2px solid var(--border-bright)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <span style={{ fontSize: 48 }}>📲</span>
          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>QR Code (coming soon)</span>
        </div>

        {/* Address box */}
        <div
          style={{
            width: "100%", padding: "14px 16px",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            fontFamily: "var(--font-geist-mono)",
            fontSize: 12, color: "var(--text-primary)",
            wordBreak: "break-all", lineHeight: 1.6,
          }}
        >
          {smartAddress}
        </div>

        {/* Network */}
        <div
          style={{
            padding: "7px 14px", borderRadius: 20,
            background: "rgba(124,58,237,0.15)",
            border: "1px solid var(--border-bright)",
            fontSize: 12, color: "var(--accent-violet)", fontWeight: 600,
          }}
        >
          ⚡ Smart Account · Base Sepolia
        </div>

        {/* Copy button */}
        <button
          id="btn-copy-addr"
          onClick={copy}
          style={{
            width: "100%", padding: "15px",
            borderRadius: "var(--radius-md)",
            background: copied
              ? "rgba(16,185,129,0.15)"
              : "linear-gradient(135deg, #7c3aed, #ec4899)",
            border: copied ? "1px solid rgba(16,185,129,0.5)" : "none",
            color: copied ? "#10b981" : "#fff",
            fontSize: 15, fontWeight: 700,
            boxShadow: copied ? "none" : "0 6px 20px rgba(124,58,237,0.3)",
          }}
        >
          {copied ? "✅ Copied!" : "📋 Copy Address"}
        </button>
      </div>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
        }}
      />
      <div
        style={{
          position: "relative", zIndex: 1,
          width: "100%", maxWidth: 520,
          background: "var(--bg-card)",
          borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
          border: "1px solid var(--border)", borderBottom: "none",
          padding: "24px 24px 40px",
          animation: "fadeIn 0.3s ease",
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border-bright)", margin: "0 auto 20px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>{title}</h2>
          <button id="btn-modal-close" onClick={onClose} style={{ fontSize: 20, background: "none", color: "var(--text-secondary)", padding: 4 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
