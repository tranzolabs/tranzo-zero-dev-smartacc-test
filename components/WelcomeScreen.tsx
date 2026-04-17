"use client";

import { useState } from "react";
import { useWallet } from "@/lib/WalletContext";

export default function WelcomeScreen() {
  const { connectMetaMask, createEmbeddedWallet, importPrivateKey, isLoading } = useWallet();
  const [showImport, setShowImport] = useState(false);
  const [pkInput, setPkInput] = useState("");
  const [importError, setImportError] = useState("");
  const [importing, setImporting] = useState(false);

  async function handleImport() {
    if (!pkInput.trim()) return;
    setImportError("");
    setImporting(true);
    try {
      await importPrivateKey(pkInput.trim());
    } catch (e: unknown) {
      setImportError(e instanceof Error ? e.message : "Invalid key");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-primary)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow orbs */}
      <div style={{ position: "absolute", top: -120, left: -120, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -120, right: -120, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div
        style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "40px 24px", gap: 32,
          position: "relative", zIndex: 1,
          maxWidth: 480, margin: "0 auto", width: "100%",
        }}
        className="animate-fade-in"
      >
        {/* Logo */}
        <div>
          <div style={{ width: 96, height: 96, borderRadius: "28px", background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, margin: "0 auto", boxShadow: "0 0 60px rgba(124,58,237,0.5), 0 20px 60px rgba(0,0,0,0.5)" }}>
            💳
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-1.5px", textAlign: "center", marginTop: 20, lineHeight: 1 }} className="gradient-text">
            Tranzo Money
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, textAlign: "center", marginTop: 10, lineHeight: 1.6 }}>
            Non-custodial smart wallet with<br />gasless transactions &amp; crypto card
          </p>
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {["⛽ Gasless", "🔑 Non-custodial", "💳 Card", "⚡ Instant"].map((f) => (
            <span key={f} style={{ padding: "6px 14px", borderRadius: 20, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", fontSize: 13, fontWeight: 600, color: "var(--accent-violet)" }}>
              {f}
            </span>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 12 }}>

          {/* MetaMask */}
          <button
            id="btn-connect-metamask"
            onClick={connectMetaMask}
            disabled={isLoading}
            style={{
              padding: "16px 24px", borderRadius: "var(--radius-md)",
              background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
              color: "#fff", fontSize: 16, fontWeight: 700,
              boxShadow: "0 8px 32px rgba(124,58,237,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 10, opacity: isLoading ? 0.6 : 1,
            }}
          >
            <span style={{ fontSize: 22 }}>🦊</span>
            {isLoading ? "Connecting..." : "Connect MetaMask"}
          </button>

          <Divider />

          {/* Import Private Key — EXPANDED */}
          {showImport ? (
            <div style={{
              display: "flex", flexDirection: "column", gap: 10,
              padding: "16px", borderRadius: "var(--radius-md)",
              background: "var(--bg-card)", border: "1px solid var(--border-bright)",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                🔐 Import Private Key
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
                Paste your EOA private key — your smart account will be derived from it
              </div>
              <input
                id="input-private-key"
                type="password"
                value={pkInput}
                onChange={(e) => { setPkInput(e.target.value); setImportError(""); }}
                placeholder="0x... or paste without 0x"
                style={{
                  width: "100%", padding: "12px 14px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-surface)",
                  border: `1px solid ${importError ? "rgba(239,68,68,0.5)" : "var(--border)"}`,
                  color: "var(--text-primary)",
                  fontSize: 13, fontFamily: "var(--font-geist-mono)",
                }}
                onKeyDown={(e) => e.key === "Enter" && handleImport()}
              />
              {importError && (
                <div style={{ fontSize: 12, color: "#ef4444" }}>⚠️ {importError}</div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  id="btn-cancel-import"
                  onClick={() => { setShowImport(false); setPkInput(""); setImportError(""); }}
                  style={{
                    flex: 1, padding: "11px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)", fontSize: 13, fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-import"
                  onClick={handleImport}
                  disabled={!pkInput.trim() || importing}
                  style={{
                    flex: 2, padding: "11px",
                    borderRadius: "var(--radius-sm)",
                    background: "linear-gradient(135deg, #7c3aed, #ec4899)",
                    color: "#fff", fontSize: 13, fontWeight: 700,
                    opacity: !pkInput.trim() ? 0.5 : 1,
                  }}
                >
                  {importing ? "⏳ Importing..." : "Import & Create Smart Wallet"}
                </button>
              </div>
            </div>
          ) : (
            <button
              id="btn-show-import"
              onClick={() => setShowImport(true)}
              style={{
                padding: "16px 24px", borderRadius: "var(--radius-md)",
                background: "var(--bg-card)",
                border: "1px solid var(--border-bright)",
                color: "var(--text-primary)", fontSize: 15, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 20 }}>🔐</span>
              Import Private Key
            </button>
          )}

          <Divider />

          {/* New embedded wallet */}
          <button
            id="btn-create-embedded"
            onClick={createEmbeddedWallet}
            disabled={isLoading}
            style={{
              padding: "14px 24px", borderRadius: "var(--radius-md)",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)", fontSize: 14, fontWeight: 600,
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 18 }}>✨</span>
            Create New Wallet
          </button>

          <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.5, marginTop: 4 }}>
            Key is stored only in your browser. Non-custodial — you own it.
          </p>
        </div>
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>OR</span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}
