"use client";

import { useState, useEffect, useMemo } from "react";
import { useWallet } from "@/lib/WalletContext";
import CardPayModal from "@/components/CardPayModal";
import CardActivateModal from "@/components/CardActivateModal";
import { generateCardDetails, getAccumulatedSpend } from "@/lib/cardUtils";

interface Props { smartAddress: string; }

export default function VirtualCard({ smartAddress }: Props) {
  const { isCardActive, cardSpendLimit, deactivateCard } = useWallet();
  const [flipped, setFlipped] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [showActivate, setShowActivate] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [spent, setSpent] = useState(0);

  // Generate deterministic card details from address
  const cardDetails = useMemo(() => generateCardDetails(smartAddress), [smartAddress]);

  useEffect(() => {
    // Update total spent when component mounts or tab switches
    setSpent(getAccumulatedSpend());
    
    // Listen for new transactions to update gauge real-time
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "tranzo_tx_history") setSpent(getAccumulatedSpend());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const limitNum = parseFloat(cardSpendLimit) || 0;
  const progressPct = limitNum > 0 ? Math.min((spent / limitNum) * 100, 100) : 0;

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

        {/* 3D Card */}
        <div
          onClick={(e) => {
            // Target elements that shouldn't flip the card
            if ((e.target as HTMLElement).closest("button")) return;
            setFlipped(!flipped);
          }}
          style={{
            width: "100%", aspectRatio: "1.586", maxWidth: 380,
            margin: "0 auto", borderRadius: "var(--radius-lg)",
            cursor: "pointer", position: "relative",
            transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)", 
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: "var(--radius-lg)",
            background: isCardActive
              ? "linear-gradient(135deg, #0a1a0a 0%, #0d3320 40%, #10b981 80%, #7c3aed 100%)"
              : "linear-gradient(135deg, #1a0533 0%, #3d1f8f 40%, #7c3aed 80%, #ec4899 100%)",
            padding: "24px", backfaceVisibility: "hidden",
            boxShadow: isCardActive
              ? "0 20px 60px rgba(16,185,129,0.4)"
              : "0 20px 60px rgba(124,58,237,0.4)",
            overflow: "hidden",
            transition: "background 0.8s ease",
          }}>
            <div style={{ position: "absolute", top: -30, right: -30, width: 200, height: 200, borderRadius: "50%", border: "40px solid rgba(255,255,255,0.03)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -60, left: -20, width: 200, height: 200, borderRadius: "50%", border: "50px solid rgba(255,255,255,0.02)", pointerEvents: "none" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "2px" }}>TRANZO</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginTop: 2 }}>
                  {isCardActive ? "CARD ACTIVE · SESSION KEY ON" : "CRYPTO CARD · INACTIVE"}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20 }}>📡</div>
                <div style={{ fontSize: 7, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>NFC</div>
              </div>
            </div>

            <div style={{ width: 40, height: 30, borderRadius: 6, background: "linear-gradient(135deg, #d4af37, #f5d77a)", marginTop: 20 }} />

            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: "3px", marginTop: 14, fontFamily: "monospace" }}>
              {cardDetails.number}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 14 }}>
              <div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "1px" }}>CARD HOLDER</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginTop: 2 }}>{cardDetails.name}</div>
              </div>
              <div style={{ textAlign: "right", display: "flex", gap: "16px" }}>
                <div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "1px" }}>EXPIRES</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", marginTop: 2 }}>{cardDetails.expiry}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "1px" }}>NETWORK</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", marginTop: 2 }}>BASE SEPOLIA</div>
                </div>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>CVV</div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowCvv(!showCvv); }}
                  style={{ background: "none", border: "none", color: "var(--accent-violet)", fontSize: 11, fontWeight: 700, padding: 0 }}
                >
                  {showCvv ? "Hide" : "Show"}
                </button>
              </div>
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 4, padding: "8px 14px", display: "flex", justifyContent: "flex-end", fontFamily: "monospace", fontSize: 16, color: "#fff", letterSpacing: "2px" }}>
                {showCvv ? cardDetails.cvv : "•••"}
              </div>
              <div style={{ marginTop: 14, fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
                {isCardActive
                  ? `Session key active. This card auto-signs payments seamlessly via the ZeroDev Kernel payload.`
                  : "Activate card to generate a session key and enable gasless tap-and-pay."}
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)" }}>Tap card to flip · 📡 NFC</div>

        {/* Card Controls Panel */}
        <div style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          
          {/* Power toggle */}
          <div style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: isCardActive ? "1px solid var(--border)" : "none" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: isCardActive ? "#10b981" : "#ef4444", boxShadow: isCardActive ? "0 0 6px #10b981" : "none" }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Card Status</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                {isCardActive ? "Active · Fast auto-signing ON" : "Inactive · Unlock to spend"}
              </div>
            </div>
            
            <button 
              id="btn-toggle-card"
              onClick={() => isCardActive ? deactivateCard() : setShowActivate(true)}
              style={{
                width: 50, height: 28, borderRadius: 14,
                background: isCardActive ? "#10b981" : "var(--bg-elevated)",
                border: isCardActive ? "none" : "1px solid var(--border)", 
                position: "relative", cursor: "pointer",
                transition: "background 0.3s"
              }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: "50%", background: "#fff",
                position: "absolute", top: 2, left: isCardActive ? 24 : 2,
                transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
              }} />
            </button>
          </div>

          {isCardActive && (
            <>
              {/* Spending Gauge & Edit Limit */}
              <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", background: "rgba(0,0,0,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Remaining Daily Limit</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: progressPct >= 100 ? "#ef4444" : "var(--accent-violet)" }}>
                    {Math.max(0, limitNum - spent).toFixed(4)} ETH
                  </div>
                </div>
                
                <div style={{ width: "100%", height: 8, borderRadius: 4, background: "var(--bg-card)", border: "1px solid var(--border)", overflow: "hidden", position: "relative" }}>
                  <div style={{ 
                    position: "absolute", left: 0, top: 0, bottom: 0, 
                    width: `${progressPct}%`, 
                    background: progressPct >= 90 ? "#ef4444" : progressPct >= 70 ? "#f59e0b" : "#10b981",
                    transition: "width 0.4s ease, background 0.4s ease" 
                  }} />
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Spent: {spent.toFixed(4)} / {cardSpendLimit} ETH
                  </span>
                  <button 
                    onClick={() => setShowActivate(true)} 
                    style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-violet)", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 4, backgroundColor: "rgba(124,58,237,0.1)" }}
                  >
                    ✏️ Edit Limit
                  </button>
                </div>
              </div>

              {/* Tap to Pay Action */}
              <div style={{ padding: "16px", background: "rgba(16,185,129,0.04)" }}>
                <button
                  id="btn-tap-to-pay"
                  onClick={() => setShowPay(true)}
                  style={{
                    width: "100%", padding: "16px", borderRadius: "var(--radius-md)",
                    background: "linear-gradient(135deg, #10b981, #7c3aed)",
                    color: "#fff", fontSize: 16, fontWeight: 800,
                    boxShadow: "0 8px 24px rgba(16,185,129,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    border: "none", cursor: "pointer"
                  }}
                >
                  <span style={{ fontSize: 22 }}>📡</span>
                  <div style={{ textAlign: "left" }}>
                    <div>Tap to Pay</div>
                    <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.9 }}>Gasless · Seamless Auth</div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Quick links */}
        <div style={{ display: "flex", gap: 10 }}>
          <a href="/demo-store" target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "12px", borderRadius: "var(--radius-md)", background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textDecoration: "none" }}>
            <span style={{ fontSize: 20 }}>🛍️</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-violet)" }}>Demo Store</span>
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Buy with card</span>
          </a>
          <a href="/merchant" target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "12px", borderRadius: "var(--radius-md)", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textDecoration: "none" }}>
            <span style={{ fontSize: 20 }}>🏪</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#10b981" }}>Merchant</span>
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Terminal</span>
          </a>
          <a href="/card-network" target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "12px", borderRadius: "var(--radius-md)", background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.2)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textDecoration: "none" }}>
            <span style={{ fontSize: 20 }}>🌐</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0ea5e9" }}>Card Net</span>
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Auth log</span>
          </a>
        </div>
      </div>

      {showPay      && <CardPayModal      onClose={() => setShowPay(false)}      />}
      {showActivate && <CardActivateModal onClose={() => setShowActivate(false)} />}
    </>
  );
}
