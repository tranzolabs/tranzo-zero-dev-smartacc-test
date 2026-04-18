"use client";

import { useState, useEffect, useRef } from "react";
import { parseEther, formatEther } from "viem";
import { useWallet } from "@/lib/WalletContext";
import { sendGaslessTransfer } from "@/lib/wallet";

// Demo merchants - in real life these would be registered merchant smart contracts
const DEMO_MERCHANTS = [
  { id: "coffee", name: "☕ Brew & Bean", category: "Food & Drink", address: "0x742d35Cc6634C0532925a3b8D4C9D5a3b7E9F2a1" as `0x${string}`, amount: "0.0001" },
  { id: "grocery", name: "🛒 FreshMart", category: "Grocery", address: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199" as `0x${string}`, amount: "0.0003" },
  { id: "gas", name: "⛽ QuickFuel", category: "Fuel Station", address: "0xdD2FD4581271e230360230F9337D5c0430Bf44C0" as `0x${string}`, amount: "0.0005" },
  { id: "custom", name: "🏪 Custom Merchant", category: "Manual Entry", address: null, amount: "" },
];

type PayStep = "select" | "confirm" | "processing" | "approved" | "declined";

interface Props {
  onClose: () => void;
}

export default function CardPayModal({ onClose }: Props) {
  const { signer, smartAddress } = useWallet();
  const [step, setStep] = useState<PayStep>("select");
  const [selectedMerchant, setSelectedMerchant] = useState(DEMO_MERCHANTS[0]);
  const [customAddress, setCustomAddress] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [nfcAnim, setNfcAnim] = useState(false);
  const pulseRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => { if (pulseRef.current) clearTimeout(pulseRef.current); };
  }, []);

  const isCustom = selectedMerchant.id === "custom";
  const toAddress = isCustom ? (customAddress as `0x${string}`) : selectedMerchant.address!;
  const payAmount = isCustom ? customAmount : selectedMerchant.amount;

  async function handlePay() {
    if (!signer || !toAddress || !payAmount) return;
    setStep("processing");
    setNfcAnim(true);
    setError("");
    try {
      const { userOpHash } = await sendGaslessTransfer(
        signer,
        toAddress,
        parseEther(payAmount),
      );
      setTxHash(userOpHash);
      setStep("approved");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message.slice(0, 200) : "Transaction failed");
      setStep("declined");
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 110, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }} />

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

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>
              {step === "approved" ? "✅ Payment Approved" :
               step === "declined" ? "❌ Payment Failed" :
               step === "processing" ? "⏳ Processing..." :
               "💳 Tap to Pay"}
            </h2>
            {step === "select" && (
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                Gasless · Instant · On-chain
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ fontSize: 20, background: "none", color: "var(--text-secondary)" }}>✕</button>
        </div>

        {/* ── STEP: Select Merchant ── */}
        {step === "select" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>CHOOSE MERCHANT</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DEMO_MERCHANTS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMerchant(m)}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "var(--radius-md)",
                    background: selectedMerchant.id === m.id ? "rgba(124,58,237,0.15)" : "var(--bg-surface)",
                    border: `1px solid ${selectedMerchant.id === m.id ? "var(--accent-violet)" : "var(--border)"}`,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{m.category}</div>
                  </div>
                  {m.amount && (
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--accent-violet)" }}>
                      {m.amount} ETH
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Custom merchant fields */}
            {isCustom && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "14px", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                <div>
                  <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>MERCHANT ADDRESS</label>
                  <input
                    value={customAddress}
                    onChange={e => setCustomAddress(e.target.value)}
                    placeholder="0x..."
                    style={{ width: "100%", marginTop: 5, padding: "10px 12px", borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 12, fontFamily: "var(--font-geist-mono)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>AMOUNT (ETH)</label>
                  <input
                    value={customAmount}
                    onChange={e => setCustomAmount(e.target.value)}
                    placeholder="0.001"
                    type="number"
                    style={{ width: "100%", marginTop: 5, padding: "10px 12px", borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 16, fontWeight: 700 }}
                  />
                </div>
              </div>
            )}

            <button
              id="btn-go-confirm"
              onClick={() => setStep("confirm")}
              disabled={isCustom && (!customAddress || !customAmount)}
              style={{
                padding: "16px", borderRadius: "var(--radius-md)",
                background: "linear-gradient(135deg, #7c3aed, #ec4899)",
                color: "#fff", fontSize: 16, fontWeight: 700,
                boxShadow: "0 8px 24px rgba(124,58,237,0.3)",
                opacity: (isCustom && (!customAddress || !customAmount)) ? 0.5 : 1,
              }}
            >
              Continue →
            </button>
          </div>
        )}

        {/* ── STEP: Confirm ── */}
        {step === "confirm" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* NFC animation card */}
            <NfcCard />

            <div style={{ padding: "16px", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
              <Row label="Merchant" value={selectedMerchant.name} />
              <Row label="Amount" value={`${payAmount} ETH`} valueColor="var(--accent-violet)" large />
              <Row label="Gas Fee" value="FREE ⛽" valueColor="#10b981" />
              <Row label="Network" value="Base Sepolia" />
              <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
              <Row label="From" value={`${smartAddress.slice(0, 8)}...${smartAddress.slice(-6)}`} />
              <Row label="To" value={`${toAddress.slice(0, 8)}...${(toAddress as string).slice(-6)}`} />
            </div>

            {/* Flow diagram */}
            <FlowDiagram />

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep("select")} style={{ flex: 1, padding: "14px", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontWeight: 600 }}>
                Back
              </button>
              <button
                id="btn-confirm-pay"
                onClick={handlePay}
                style={{
                  flex: 2, padding: "14px",
                  borderRadius: "var(--radius-md)",
                  background: "linear-gradient(135deg, #7c3aed, #ec4899)",
                  color: "#fff", fontSize: 16, fontWeight: 700,
                  boxShadow: "0 8px 24px rgba(124,58,237,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                📡 Tap & Pay
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: Processing ── */}
        {step === "processing" && (
          <div style={{ textAlign: "center", padding: "20px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <NfcPulse />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Sending to {selectedMerchant.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Broadcasting UserOp · Paymaster sponsoring gas...</div>
            </div>
            <ProcessingSteps />
          </div>
        )}

        {/* ── STEP: Approved ── */}
        {step === "approved" && (
          <div style={{ textAlign: "center", padding: "10px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 72, animation: "fadeIn 0.5s ease" }}>✅</div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#10b981" }}>APPROVED</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginTop: 4 }}>
                {payAmount} ETH
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                → {selectedMerchant.name}
              </div>
            </div>

            {/* Settlement flow confirmed */}
            <div style={{ width: "100%", padding: "14px 16px", borderRadius: "var(--radius-md)", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#10b981", marginBottom: 10 }}>SETTLEMENT COMPLETE</div>
              {["✅ UserOp signed by your EOA", "✅ Gas sponsored by ZeroDev", "✅ On-chain tx confirmed", "✅ Merchant wallet credited", "✅ Receipt recorded on Base Sepolia"].map((s) => (
                <div key={s} style={{ fontSize: 12, color: "var(--text-secondary)", padding: "3px 0" }}>{s}</div>
              ))}
            </div>

            <div style={{
              padding: "10px 14px", borderRadius: 8,
              background: "var(--bg-surface)", border: "1px solid var(--border)",
              fontSize: 10, fontFamily: "var(--font-geist-mono)", color: "var(--text-muted)",
              wordBreak: "break-all", width: "100%",
            }}>
              UserOp: {txHash.slice(0, 20)}...{txHash.slice(-8)}
            </div>

            <a
              href={`https://sepolia.basescan.org/tx/${txHash}`}
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: "var(--accent-violet)", fontWeight: 600 }}
            >
              View on BaseScan ↗
            </a>

            <button
              id="btn-pay-done"
              onClick={onClose}
              style={{
                width: "100%", padding: "14px", borderRadius: "var(--radius-md)",
                background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
                color: "#10b981", fontSize: 15, fontWeight: 700,
              }}
            >
              Done
            </button>
          </div>
        )}

        {/* ── STEP: Declined ── */}
        {step === "declined" && (
          <div style={{ textAlign: "center", padding: "10px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 72 }}>❌</div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#ef4444" }}>DECLINED</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.5 }}>{error || "Transaction failed"}</div>
            </div>
            <button onClick={() => setStep("confirm")} style={{ width: "100%", padding: "14px", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-primary)", fontWeight: 600 }}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, valueColor, large }: { label: string; value: string; valueColor?: string; large?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: large ? 16 : 13, fontWeight: large ? 800 : 600, color: valueColor ?? "var(--text-secondary)" }}>{value}</span>
    </div>
  );
}

function NfcCard() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "10px 0" }}>
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: "rgba(124,58,237,0.1)", border: "2px solid rgba(124,58,237,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36,
        boxShadow: "0 0 0 8px rgba(124,58,237,0.05), 0 0 0 16px rgba(124,58,237,0.03)",
      }}>
        📡
      </div>
    </div>
  );
}

function NfcPulse() {
  return (
    <div style={{ position: "relative", width: 100, height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          position: "absolute",
          width: `${40 + i * 20}px`, height: `${40 + i * 20}px`,
          borderRadius: "50%",
          border: "2px solid rgba(124,58,237,0.4)",
          animation: `ping ${0.8 + i * 0.3}s cubic-bezier(0,0,0.2,1) infinite`,
          opacity: 1 - i * 0.25,
        }} />
      ))}
      <div style={{ fontSize: 36, position: "relative", zIndex: 1 }}>📡</div>
    </div>
  );
}

function ProcessingSteps() {
  const steps = [
    "Signing UserOperation...",
    "Submitting to bundler...",
    "Paymaster sponsoring gas...",
    "Waiting for confirmation...",
  ];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent(c => Math.min(c + 1, steps.length - 1)), 1200);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
            background: i < current ? "#10b981" : i === current ? "var(--accent-violet)" : "var(--bg-elevated)",
            border: i === current ? "2px solid var(--accent-violet)" : "none",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9,
          }}>
            {i < current ? "✓" : ""}
          </div>
          <span style={{ fontSize: 12, color: i <= current ? "var(--text-primary)" : "var(--text-muted)", fontWeight: i === current ? 700 : 400 }}>
            {s}
          </span>
        </div>
      ))}
    </div>
  );
}

function FlowDiagram() {
  const nodes = [
    { icon: "💳", label: "Your Card", color: "#7c3aed" },
    { icon: "⚡", label: "Smart Acc", color: "#8b5cf6" },
    { icon: "⛽", label: "ZeroDev", color: "#ec4899" },
    { icon: "⛓️", label: "Base L2", color: "#0ea5e9" },
    { icon: "🏪", label: "Merchant", color: "#10b981" },
  ];

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
      {nodes.map((n, i) => (
        <div key={n.label} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: `${n.color}20`, border: `1px solid ${n.color}50`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, margin: "0 auto",
            }}>{n.icon}</div>
            <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 3, fontWeight: 600 }}>{n.label}</div>
          </div>
          {i < nodes.length - 1 && (
            <div style={{ width: 12, height: 1, background: "var(--border-bright)", margin: "0 2px", marginBottom: 14 }} />
          )}
        </div>
      ))}
    </div>
  );
}
