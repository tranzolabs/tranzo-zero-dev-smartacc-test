"use client";

import { useState } from "react";
import { useWallet } from "@/lib/WalletContext";

interface Props { onClose: () => void; }

const STORAGE_KEY = "tranzo_eoa_pk";

export default function SettingsModal({ onClose }: Props) {
  const { eoaAddress, smartAddress, signerType, disconnect } = useWallet();
  const [showKey, setShowKey] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const [addrCopied, setAddrCopied] = useState(false);

  const privateKey =
    signerType === "embedded"
      ? (localStorage.getItem(STORAGE_KEY) ?? "")
      : null;

  function copyKey() {
    if (!privateKey) return;
    navigator.clipboard.writeText(privateKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  }

  function copyAddr(addr: string) {
    navigator.clipboard.writeText(addr);
    setAddrCopied(true);
    setTimeout(() => setAddrCopied(false), 2000);
  }

  function handleDisconnect() {
    disconnect();
    onClose();
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(6px)",
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: "relative", zIndex: 1,
          width: "100%", maxWidth: 520,
          background: "var(--bg-card)",
          borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
          border: "1px solid var(--border)", borderBottom: "none",
          padding: "24px 24px 48px",
          animation: "fadeIn 0.3s ease",
        }}
      >
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border-bright)", margin: "0 auto 20px" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Wallet Settings</h2>
          <button onClick={onClose} style={{ fontSize: 20, background: "none", color: "var(--text-secondary)", padding: 4 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Wallet type explainer */}
          <div style={{
            padding: "14px 16px", borderRadius: "var(--radius-md)",
            background: "rgba(124,58,237,0.1)",
            border: "1px solid var(--border-bright)",
          }}>
            <div style={{ fontSize: 12, color: "var(--accent-violet)", fontWeight: 700, marginBottom: 6 }}>
              {signerType === "metamask" ? "🦊 MetaMask Wallet" : "🔑 Embedded Wallet"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {signerType === "metamask"
                ? "Your MetaMask EOA signs transactions. ZeroDev creates a smart account on top of it — all gas is covered."
                : "A private key is stored in your browser. It signs transactions into a ZeroDev smart account above it. You pay zero gas."}
            </div>
          </div>

          {/* How it works diagram */}
          <div style={{
            padding: "14px 16px", borderRadius: "var(--radius-md)",
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, marginBottom: 2 }}>HOW IT WORKS</div>
            {[
              { label: "Your EOA (signer / key)", value: `${eoaAddress.slice(0, 10)}...${eoaAddress.slice(-6)}`, color: "#7c3aed", icon: "🔑" },
              { label: "↓ creates", color: "var(--text-muted)", icon: "", value: "" },
              { label: "Kernel Smart Account", value: `${smartAddress.slice(0, 10)}...${smartAddress.slice(-6)}`, color: "#10b981", icon: "⚡" },
              { label: "↓ uses", color: "var(--text-muted)", icon: "", value: "" },
              { label: "ZeroDev Paymaster", value: "Gas = FREE", color: "#ec4899", icon: "⛽" },
            ].map((row, i) =>
              row.value === "" ? (
                <div key={i} style={{ fontSize: 11, color: row.color, paddingLeft: 8 }}>{row.label}</div>
              ) : (
                <div
                  key={i}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 10px", borderRadius: 8,
                    background: "var(--bg-card)",
                    border: `1px solid ${row.color}33`,
                  }}
                >
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {row.icon} {row.label}
                  </span>
                  <span style={{ fontSize: 11, fontFamily: "var(--font-geist-mono)", color: row.color, fontWeight: 700 }}>
                    {row.value}
                  </span>
                </div>
              )
            )}
          </div>

          {/* EOA Address */}
          <InfoRow
            label="Your EOA Address"
            value={eoaAddress}
            onCopy={() => copyAddr(eoaAddress)}
            copied={addrCopied}
          />

          {/* Smart Account Address */}
          <InfoRow
            label="Smart Account Address"
            value={smartAddress}
            onCopy={() => copyAddr(smartAddress)}
            copied={false}
          />

          {/* Private Key Export — only for embedded wallet */}
          {signerType === "embedded" && privateKey && (
            <div style={{
              padding: "14px 16px", borderRadius: "var(--radius-md)",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.3)",
              display: "flex", flexDirection: "column", gap: 10,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>⚠️ Private Key Export</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    Import this key into MetaMask to access your EOA
                  </div>
                </div>
                <button
                  id="btn-toggle-key"
                  onClick={() => setShowKey(!showKey)}
                  style={{
                    padding: "6px 12px", borderRadius: 8,
                    background: "rgba(239,68,68,0.15)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    color: "#ef4444", fontSize: 12, fontWeight: 700,
                  }}
                >
                  {showKey ? "Hide" : "Show"}
                </button>
              </div>

              {showKey && (
                <>
                  <div style={{
                    padding: "10px 12px", borderRadius: 8,
                    background: "var(--bg-primary)",
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: 10, color: "#ef4444",
                    wordBreak: "break-all", lineHeight: 1.8,
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}>
                    {privateKey}
                  </div>
                  <button
                    id="btn-copy-key"
                    onClick={copyKey}
                    style={{
                      padding: "10px", borderRadius: 8,
                      background: keyCopied ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                      border: `1px solid ${keyCopied ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.3)"}`,
                      color: keyCopied ? "#10b981" : "#ef4444",
                      fontSize: 13, fontWeight: 700,
                    }}
                  >
                    {keyCopied ? "✅ Copied!" : "📋 Copy Private Key"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Developer Dashboard Link */}
          <a
            href="/developer"
            target="_blank"
            style={{
              display: "block", textAlign: "center", textDecoration: "none",
              padding: "14px", borderRadius: "var(--radius-md)",
              background: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.3)",
              color: "#3b82f6", fontSize: 14, fontWeight: 700,
              marginTop: 4,
            }}
          >
            👨‍💻 Open Developer Dashboard
          </a>

          {/* Disconnect */}
          <button
            id="btn-disconnect-settings"
            onClick={handleDisconnect}
            style={{
              padding: "14px", borderRadius: "var(--radius-md)",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)", fontSize: 14, fontWeight: 700,
              marginTop: 4,
            }}
          >
            Disconnect Wallet
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, onCopy, copied }: { label: string; value: string; onCopy: () => void; copied: boolean }) {
  return (
    <div style={{
      padding: "12px 14px", borderRadius: "var(--radius-md)",
      background: "var(--bg-surface)",
      border: "1px solid var(--border)",
    }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{
          fontSize: 11, fontFamily: "var(--font-geist-mono)",
          color: "var(--text-secondary)", wordBreak: "break-all",
          flex: 1,
        }}>
          {value}
        </span>
        <button
          onClick={onCopy}
          style={{
            padding: "4px 10px", borderRadius: 6, flexShrink: 0,
            background: copied ? "rgba(16,185,129,0.15)" : "var(--bg-elevated)",
            border: `1px solid ${copied ? "rgba(16,185,129,0.4)" : "var(--border)"}`,
            color: copied ? "#10b981" : "var(--text-secondary)",
            fontSize: 11, fontWeight: 600,
          }}
        >
          {copied ? "✅" : "📋"}
        </button>
      </div>
    </div>
  );
}
