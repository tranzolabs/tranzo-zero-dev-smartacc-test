"use client";

import { useState, useEffect } from "react";
import { parseEther } from "viem";
import { useWallet } from "@/lib/WalletContext";

const DEMO_MERCHANTS = [
  { id: "coffee",  name: "☕ Brew & Bean",  category: "Food & Drink", address: "0x742d35Cc6634C0532925a3b8D4C9D5a3b7E9F2a1" as `0x${string}`, amount: "0.0001" },
  { id: "grocery", name: "🛒 FreshMart",    category: "Grocery",      address: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199" as `0x${string}`, amount: "0.0003" },
  { id: "gas",     name: "⛽ QuickFuel",    category: "Fuel Station", address: "0xdD2FD4581271e230360230F9337D5c0430Bf44C0" as `0x${string}`, amount: "0.0005" },
  { id: "custom",  name: "🏪 Custom",       category: "Manual Entry", address: null, amount: "" },
];

type PayStep = "select" | "processing" | "approved" | "declined";

interface Props { onClose: () => void; }

export default function CardPayModal({ onClose }: Props) {
  const { sendCardPayment, isCardActive, smartAddress } = useWallet();
  const [step, setStep] = useState<PayStep>("select");
  const [selected, setSelected] = useState(DEMO_MERCHANTS[0]);
  const [customAddr, setCustomAddr] = useState("");
  const [customAmt, setCustomAmt] = useState("");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");

  const isCustom = selected.id === "custom";
  const toAddr = isCustom ? customAddr as `0x${string}` : selected.address!;
  const payAmt = isCustom ? customAmt : selected.amount;

  async function handlePay() {
    if (!toAddr || !payAmt) return;
    setStep("processing");
    setError("");
    try {
      const { userOpHash } = await sendCardPayment(toAddr, parseEther(payAmt));
      setTxHash(userOpHash);
      setStep("approved");

      // Notify card network page via localStorage event
      const event = {
        merchant: selected.name,
        amount: payAmt,
        from: smartAddress,
        to: toAddr,
        hash: userOpHash,
        ts: Date.now(),
      };
      localStorage.setItem("tranzo_last_tx", JSON.stringify(event));
      window.dispatchEvent(new StorageEvent("storage", { key: "tranzo_last_tx" }));
      
      // Save locally to wallet transaction history
      import("@/lib/cardUtils").then(({ addTxHistory }) => {
        addTxHistory({
          hash: userOpHash,
          type: "send",
          amount: payAmt,
          to: toAddr,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: "confirmed",
          merchant: selected.name
        });
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message.slice(0, 250) : "Payment failed");
      setStep("declined");
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 110, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }} />

      <div style={{
        position: "relative", zIndex: 1, width: "100%", maxWidth: 520,
        background: "var(--bg-card)",
        borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
        border: "1px solid var(--border)", borderBottom: "none",
        padding: "24px 24px 48px",
        animation: "fadeIn 0.3s ease",
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border-bright)", margin: "0 auto 20px" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>
              {step === "approved" ? "✅ Approved!" : step === "declined" ? "❌ Declined" : step === "processing" ? "⏳ Processing..." : "💳 Tap to Pay"}
            </h2>
            {step === "select" && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: isCardActive ? "#10b981" : "#ef4444" }} />
                <span style={{ fontSize: 11, color: isCardActive ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                  {isCardActive ? "Session Key Active — Auto-sign ON" : "Card not activated"}
                </span>
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ fontSize: 20, background: "none", color: "var(--text-secondary)" }}>✕</button>
        </div>

        {/* ── SELECT ── */}
        {step === "select" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>SELECT MERCHANT</div>
            {DEMO_MERCHANTS.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelected(m)}
                style={{
                  padding: "13px 16px", borderRadius: "var(--radius-md)",
                  background: selected.id === m.id ? "rgba(124,58,237,0.12)" : "var(--bg-surface)",
                  border: `1px solid ${selected.id === m.id ? "var(--accent-violet)" : "var(--border)"}`,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}
              >
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{m.category}</div>
                </div>
                {m.amount && <div style={{ fontSize: 14, fontWeight: 800, color: "var(--accent-violet)" }}>{m.amount} ETH</div>}
              </button>
            ))}

            {isCustom && (
              <div style={{ padding: "12px", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
                <input value={customAddr} onChange={e => setCustomAddr(e.target.value)} placeholder="Merchant address 0x..." style={{ padding: "10px 12px", borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 12, fontFamily: "monospace", width: "100%" }} />
                <input value={customAmt} onChange={e => setCustomAmt(e.target.value)} placeholder="Amount ETH" type="number" style={{ padding: "10px 12px", borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 18, fontWeight: 700, width: "100%" }} />
              </div>
            )}

            {/* Summary row */}
            {payAmt && (
              <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Gas fee</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>FREE ⛽</span>
              </div>
            )}

            <button
              id="btn-pay-now"
              onClick={handlePay}
              disabled={!isCardActive || !toAddr || !payAmt}
              style={{
                padding: "16px", borderRadius: "var(--radius-md)",
                background: isCardActive
                  ? "linear-gradient(135deg, #7c3aed, #ec4899)"
                  : "var(--bg-surface)",
                color: isCardActive ? "#fff" : "var(--text-muted)",
                fontSize: 16, fontWeight: 700,
                boxShadow: isCardActive ? "0 8px 24px rgba(124,58,237,0.3)" : "none",
                border: isCardActive ? "none" : "1px solid var(--border)",
                opacity: (!toAddr || !payAmt) ? 0.5 : 1,
              }}
            >
              {isCardActive ? "📡 Tap & Pay (Auto)" : "⚠️ Activate Card First"}
            </button>
            {isCardActive && (
              <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
                Session key auto-signs — no confirmation popup
              </p>
            )}
          </div>
        )}

        {/* ── PROCESSING ── */}
        {step === "processing" && (
          <div style={{ textAlign: "center", padding: "24px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <NfcPulse />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Sending to {selected.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Session key signing · Paymaster sponsoring...</div>
            </div>
            <ProcessingSteps />
          </div>
        )}

        {/* ── APPROVED ── */}
        {step === "approved" && (
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 72 }}>✅</div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#10b981" }}>APPROVED</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{payAmt} ETH</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>→ {selected.name}</div>
            </div>

            <div style={{ width: "100%", padding: "12px 14px", borderRadius: "var(--radius-md)", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
              {["✅ Auto-signed by session key", "✅ Gas sponsored by ZeroDev", "✅ Settled on Base Sepolia", "✅ Merchant credited"].map(s => (
                <div key={s} style={{ fontSize: 12, color: "var(--text-secondary)", padding: "2px 0" }}>{s}</div>
              ))}
            </div>

            <div style={{ padding: "8px 12px", borderRadius: 8, background: "var(--bg-surface)", border: "1px solid var(--border)", fontSize: 10, fontFamily: "monospace", color: "var(--text-muted)", wordBreak: "break-all", width: "100%" }}>
              {txHash.slice(0, 22)}...{txHash.slice(-8)}
            </div>

            <a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: "var(--accent-violet)", fontWeight: 600 }}>
              View on BaseScan ↗
            </a>

            <button id="btn-pay-done" onClick={onClose} style={{ width: "100%", padding: "14px", borderRadius: "var(--radius-md)", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", fontSize: 15, fontWeight: 700 }}>
              Done
            </button>
          </div>
        )}

        {/* ── DECLINED ── */}
        {step === "declined" && (
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 72 }}>❌</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#ef4444" }}>DECLINED</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, textAlign: "left", width: "100%" }}>⚠️ {error}</div>
            <button onClick={() => setStep("select")} style={{ width: "100%", padding: "14px", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-primary)", fontWeight: 600 }}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function NfcPulse() {
  return (
    <div style={{ position: "relative", width: 100, height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ position: "absolute", width: `${40 + i * 20}px`, height: `${40 + i * 20}px`, borderRadius: "50%", border: "2px solid rgba(124,58,237,0.4)", animation: `ping ${0.8 + i * 0.3}s cubic-bezier(0,0,0.2,1) infinite`, opacity: 1 - i * 0.25 }} />
      ))}
      <div style={{ fontSize: 36, position: "relative", zIndex: 1 }}>📡</div>
    </div>
  );
}

function ProcessingSteps() {
  const steps = ["Session key signing...", "Sending UserOp to bundler...", "Paymaster sponsoring gas...", "Awaiting confirmation..."];
  const [cur, setCur] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCur(c => Math.min(c + 1, steps.length - 1)), 1200);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0, background: i < cur ? "#10b981" : i === cur ? "var(--accent-violet)" : "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff" }}>
            {i < cur ? "✓" : ""}
          </div>
          <span style={{ fontSize: 12, color: i <= cur ? "var(--text-primary)" : "var(--text-muted)", fontWeight: i === cur ? 700 : 400 }}>{s}</span>
        </div>
      ))}
    </div>
  );
}
