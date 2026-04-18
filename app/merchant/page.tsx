"use client";

import { useState, useEffect, useCallback } from "react";
import { createPublicClient, http, formatEther, parseAbiItem } from "viem";
import { baseSepolia } from "viem/chains";

// Merchant address for demo (same as the "Brew & Bean" in CardPayModal)
const MERCHANT_ADDRESS = "0x742d35Cc6634C0532925a3b8D4C9D5a3b7E9F2a1";

interface Payment {
  hash: string;
  from: string;
  value: string;
  timestamp: number;
  status: "confirmed";
}

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http("https://sepolia.base.org"),
});

export default function MerchantPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(true);
  const [lastPing, setLastPing] = useState(Date.now());

  const fetchData = useCallback(async () => {
    try {
      const bal = await publicClient.getBalance({ address: MERCHANT_ADDRESS as `0x${string}` });
      setBalance(formatEther(bal));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
      setLastPing(Date.now());
    }, 8000);
    setLoading(false);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Simulate incoming payments for demo
  function addDemoPayment() {
    const demo: Payment = {
      hash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
      from: `0x${Math.random().toString(16).slice(2, 42)}`,
      value: (Math.random() * 0.001 + 0.0001).toFixed(6),
      timestamp: Date.now(),
      status: "confirmed",
    };
    setPayments(prev => [demo, ...prev].slice(0, 20));
  }

  const totalReceived = payments.reduce((sum, p) => sum + parseFloat(p.value), 0);

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#0a0a0f",
      color: "#f1f5f9",
      fontFamily: "'Inter', sans-serif",
      padding: "0",
    }}>
      {/* Top bar */}
      <header style={{
        padding: "16px 24px",
        background: "rgba(10,10,15,0.95)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        backdropFilter: "blur(20px)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #10b981, #06b6d4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>🏪</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Merchant Terminal</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>DEMO · Base Sepolia</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
          <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>Live</span>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { label: "On-chain Balance", value: `${parseFloat(balance).toFixed(6)} ETH`, icon: "⚡", color: "#7c3aed" },
            { label: "Payments Today", value: payments.length.toString(), icon: "📊", color: "#10b981" },
            { label: "Total Received", value: `${totalReceived.toFixed(6)} ETH`, icon: "💰", color: "#ec4899" },
          ].map((stat) => (
            <div key={stat.label} style={{
              padding: "16px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{ fontSize: 22 }}>{stat.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: stat.color, marginTop: 8 }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Merchant address */}
        <div style={{
          padding: "16px 20px",
          borderRadius: "16px",
          background: "rgba(16,185,129,0.05)",
          border: "1px solid rgba(16,185,129,0.15)",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{ fontSize: 28 }}>🏦</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>MERCHANT WALLET ADDRESS</div>
            <div style={{ fontSize: 12, fontFamily: "monospace", color: "#10b981", marginTop: 3 }}>{MERCHANT_ADDRESS}</div>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(MERCHANT_ADDRESS)}
            style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", fontSize: 12, fontWeight: 600 }}
          >
            Copy
          </button>
        </div>

        {/* Payment flow card */}
        <div style={{
          padding: "20px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>💳 Payment Settlement Flow</div>
          <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto" }}>
            {[
              { icon: "👤", label: "User", sub: "Swipes card" },
              { icon: "⚡", label: "Smart Acc", sub: "ZeroDev Kernel" },
              { icon: "🌐", label: "Bundler", sub: "ERC-4337" },
              { icon: "⛽", label: "Paymaster", sub: "Gasless" },
              { icon: "⛓️", label: "Base L2", sub: "Settlement" },
              { icon: "🏪", label: "Merchant", sub: "Receives ETH" },
            ].map((node, i) => (
              <div key={node.label} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <div style={{ textAlign: "center", padding: "0 8px" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, margin: "0 auto",
                  }}>{node.icon}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, marginTop: 5 }}>{node.label}</div>
                  <div style={{ fontSize: 9, color: "#64748b" }}>{node.sub}</div>
                </div>
                {i < 5 && (
                  <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
                    <div style={{ width: 20, height: 1, background: "rgba(124,58,237,0.4)" }} />
                    <div style={{ fontSize: 8, color: "#7c3aed" }}>→</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Demo trigger */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={addDemoPayment}
            style={{
              flex: 1, padding: "14px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              color: "#fff", fontSize: 14, fontWeight: 700,
              boxShadow: "0 8px 20px rgba(124,58,237,0.3)",
            }}
          >
            🎭 Simulate Incoming Payment
          </button>
          <button
            onClick={fetchData}
            style={{
              padding: "14px 20px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#94a3b8", fontSize: 13, fontWeight: 600,
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Payments list */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#94a3b8" }}>
            RECENT PAYMENTS — {payments.length === 0 ? "None yet" : `${payments.length} transactions`}
          </div>

          {payments.length === 0 ? (
            <div style={{
              padding: "40px 20px", borderRadius: "16px",
              background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)",
              textAlign: "center", color: "#64748b", fontSize: 13,
            }}>
              No payments yet.<br />
              <span style={{ fontSize: 11, marginTop: 4, display: "block" }}>
                Pay from the wallet app or click "Simulate" above
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {payments.map((p, i) => (
                <div key={p.hash + i} style={{
                  padding: "14px 16px",
                  borderRadius: "12px",
                  background: "rgba(16,185,129,0.05)",
                  border: "1px solid rgba(16,185,129,0.12)",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  animation: "fadeIn 0.4s ease",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16,
                    }}>💳</div>
                    <div>
                      <div style={{ fontSize: 11, fontFamily: "monospace", color: "#94a3b8" }}>
                        {p.from.slice(0, 10)}...{p.from.slice(-4)}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                        {new Date(p.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#10b981" }}>+{p.value} ETH</div>
                    <div style={{ marginTop: 3 }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 6,
                        background: "rgba(16,185,129,0.15)",
                        fontSize: 10, fontWeight: 700, color: "#10b981",
                      }}>APPROVED</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Visa network note */}
        <div style={{
          padding: "16px 20px", borderRadius: "16px",
          background: "rgba(14,165,233,0.05)",
          border: "1px solid rgba(14,165,233,0.15)",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0ea5e9", marginBottom: 6 }}>
            🌐 Visa Network Integration (Next Phase)
          </div>
          <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.7 }}>
            Currently: Smart Account → ETH directly to Merchant wallet on Base L2<br />
            Next: Merchant gateway → automatic USDC conversion → Visa settlement rail
          </div>
        </div>
      </div>
    </div>
  );
}
