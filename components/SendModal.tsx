"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { useWallet } from "@/lib/WalletContext";
import { sendGaslessTransfer } from "@/lib/wallet";

interface Props { onClose: () => void; }

export default function SendModal({ onClose }: Props) {
  const { signer } = useWallet();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");

  async function handleSend() {
    if (!signer || !to || !amount) return;
    setStatus("sending");
    setError("");
    try {
      const { userOpHash } = await sendGaslessTransfer(
        signer,
        to as `0x${string}`,
        parseEther(amount),
      );
      setTxHash(userOpHash);
      setStatus("success");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Transaction failed");
      setStatus("error");
    }
  }

  return (
    <Modal title="Send ETH" onClose={onClose}>
      {status === "success" ? (
        <SuccessView txHash={txHash} onClose={onClose} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          <div>
            <label style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>
              To Address
            </label>
            <input
              id="input-recipient"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="0x..."
              style={{
                width: "100%", marginTop: 6,
                padding: "14px 16px",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                fontSize: 13,
                fontFamily: "var(--font-geist-mono)",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>
              Amount (ETH)
            </label>
            <input
              id="input-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.001"
              type="number"
              min="0"
              step="0.0001"
              style={{
                width: "100%", marginTop: 6,
                padding: "14px 16px",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                fontSize: 24, fontWeight: 700,
              }}
            />
          </div>

          {/* Gas-free banner */}
          <div style={{
            padding: "10px 14px", borderRadius: "var(--radius-sm)",
            background: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(16,185,129,0.3)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span>⛽</span>
            <span style={{ fontSize: 13, color: "#10b981", fontWeight: 600 }}>
              Gas fee: FREE — sponsored by ZeroDev
            </span>
          </div>

          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: "var(--radius-sm)",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              fontSize: 12, color: "#ef4444",
            }}>
              ⚠️ {error.slice(0, 200)}
            </div>
          )}

          <button
            id="btn-confirm-send"
            onClick={handleSend}
            disabled={status === "sending" || !to || !amount}
            style={{
              padding: "16px",
              borderRadius: "var(--radius-md)",
              background: status === "sending"
                ? "var(--bg-elevated)"
                : "linear-gradient(135deg, #7c3aed, #ec4899)",
              color: "#fff", fontSize: 16, fontWeight: 700,
              opacity: (!to || !amount) ? 0.5 : 1,
              boxShadow: status === "sending" ? "none" : "0 8px 24px rgba(124,58,237,0.3)",
            }}
          >
            {status === "sending" ? "⏳ Sending UserOp..." : "↗️ Send (Gasless)"}
          </button>
        </div>
      )}
    </Modal>
  );
}

function SuccessView({ txHash, onClose }: { txHash: string; onClose: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "20px 0", display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}>
      <div style={{ fontSize: 56 }}>✅</div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#10b981" }}>Sent!</div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6 }}>
          Gasless transaction confirmed
        </div>
      </div>
      <div style={{
        padding: "10px 14px", borderRadius: 8,
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        fontSize: 11, fontFamily: "var(--font-geist-mono)",
        color: "var(--text-secondary)", wordBreak: "break-all",
      }}>
        UserOp: {txHash.slice(0, 18)}...{txHash.slice(-6)}
      </div>
      <button
        id="btn-send-done"
        onClick={onClose}
        style={{
          width: "100%", padding: "14px", borderRadius: "var(--radius-md)",
          background: "var(--bg-card)", border: "1px solid var(--border)",
          color: "var(--text-primary)", fontSize: 15, fontWeight: 600,
        }}
      >
        Done
      </button>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} />
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: 520,
        background: "var(--bg-card)",
        borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
        border: "1px solid var(--border)", borderBottom: "none",
        padding: "24px 24px 40px",
        animation: "fadeIn 0.3s ease",
      }}>
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
