"use client";

import { useState, useEffect } from "react";
import { parseEther } from "viem";

// Products available at this demo store
const PRODUCTS = [
  { id: 1, name: "Wireless Earbuds Pro",   price: "0.0003", category: "Electronics", img: "🎧", rating: 4.8, reviews: 1243 },
  { id: 2, name: "Premium Coffee Blend",   price: "0.0001", category: "Food & Drink", img: "☕", rating: 4.6, reviews: 892 },
  { id: 3, name: "Mechanical Keyboard",    price: "0.0005", category: "Electronics", img: "⌨️", rating: 4.9, reviews: 567 },
  { id: 4, name: "Yoga Mat Premium",        price: "0.0002", category: "Sports",      img: "🧘", rating: 4.7, reviews: 334 },
  { id: 5, name: "Smart Fitness Watch",     price: "0.0107", category: "Fitness",     img: "⌚", rating: 4.8, reviews: 290 }, // ~$30 USD
];

// Merchant wallet (receives the ETH on-chain)
const MERCHANT_ADDR = "0x033D986709c6c794C42a1259A8baeb6693de9444" as `0x${string}`;

type PageStep = "shop" | "checkout" | "processing" | "success" | "failed";

export default function DemoStorePage() {
  const [step, setStep] = useState<PageStep>("shop");
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[0]);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");

  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName]     = useState("");
  const [expiry, setExpiry]         = useState("");
  const [cvv, setCvv]               = useState("");

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!cardNumber || !cvv) {
      setError("Please enter your 16-digit card number and CVV.");
      return;
    }
    setStep("processing");
    setError("");

    try {
      // 1. "Backend Network" lookup to fetch Smart Account info
      const res = await fetch(`/api/cards?cardNumber=${encodeURIComponent(cardNumber)}&cvv=${encodeURIComponent(cvv)}`);
      const dbResponse = await res.json();
      
      if (!res.ok) {
        throw new Error(dbResponse.error || "Card declined. Invalid details.");
      }

      const { smartAddress, sessionKeyPK, spendLimit } = dbResponse.card;

      // 2. Process On-Chain Payment anonymously! 
      const { sendCardPayment } = await import("@/lib/wallet");
      
      const { userOpHash } = await sendCardPayment(
        smartAddress as `0x${string}`,
        sessionKeyPK,
        MERCHANT_ADDR,
        parseEther(selectedProduct.price),
        spendLimit,
      );

      setTxHash(userOpHash);
      setStep("success");

      // Fire event for card-network page (Demo purposes)
      const event = { merchant: "🛍️ ShopDemo Store", amount: selectedProduct.price, from: smartAddress, to: MERCHANT_ADDR, hash: userOpHash, ts: Date.now() };
      localStorage.setItem("tranzo_last_tx", JSON.stringify(event));
      window.dispatchEvent(new StorageEvent("storage", { key: "tranzo_last_tx" }));
      
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message.slice(0, 400) : "Payment failed");
      setStep("failed");
    }
  }

  // ETH → USD conversion (rough estimate)
  const ethUsd = 2800;

  return (
    <div style={{ minHeight: "100dvh", background: "#f8fafc", fontFamily: "'Inter', sans-serif", color: "#0f172a" }}>

      {/* Store Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg, #7c3aed, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>T</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>ShopDemo <span style={{ color: "#7c3aed" }}>·</span> Tranzo Pay</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>Incognito / Guest Checkout</span>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>

        {/* ── SHOP PAGE ── */}
        {step === "shop" && (
          <>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>Featured Products</h1>
              <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>Pay instantly with your Tranzo crypto card · No gas fees</p>
            </div>

            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>Featured Products</h1>
              <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>Pay instantly with your Tranzo crypto card · No gas fees</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
              {PRODUCTS.map((p) => (
                <div key={p.id} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", transition: "box-shadow 0.2s", cursor: "pointer" }}
                  onMouseOver={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"}
                  onMouseOut={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"}
                >
                  <div style={{ padding: "32px 24px", background: `linear-gradient(135deg, #f8fafc, #f1f5f9)`, textAlign: "center", fontSize: 64 }}>
                    {p.img}
                  </div>
                  <div style={{ padding: "16px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", letterSpacing: "0.5px" }}>{p.category.toUpperCase()}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{p.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: "#f59e0b" }}>{"★".repeat(Math.round(p.rating))}</span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{p.rating} ({p.reviews.toLocaleString()})</span>
                    </div>
                    <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#7c3aed" }}>{p.price} ETH</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>≈ ${(parseFloat(p.price) * ethUsd).toFixed(2)}</div>
                      </div>
                      <button
                        onClick={() => { setSelectedProduct(p); setStep("checkout"); }}
                        style={{
                          padding: "9px 16px", borderRadius: 8,
                          background: "linear-gradient(135deg, #7c3aed, #ec4899)",
                          color: "#fff",
                          fontSize: 13, fontWeight: 700, cursor: "pointer",
                        }}
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── CHECKOUT PAGE ── */}
        {step === "checkout" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 32, alignItems: "start" }}>

            {/* Order summary */}
            <div>
              <button onClick={() => setStep("shop")} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748b", marginBottom: 20, background: "none" }}>
                ← Back to shop
              </button>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Checkout</h2>

              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "20px", marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 14 }}>ORDER SUMMARY</div>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{ fontSize: 48, width: 72, height: 72, background: "#f8fafc", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>{selectedProduct.img}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{selectedProduct.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{selectedProduct.category}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#7c3aed", marginTop: 6 }}>{selectedProduct.price} ETH</div>
                  </div>
                </div>
                <div style={{ height: 1, background: "#f1f5f9", margin: "16px 0" }} />
                {[
                  ["Subtotal", `${selectedProduct.price} ETH`],
                  ["Gas Fee", "FREE ⛽"],
                  ["Network", "Base Sepolia"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
                    <span style={{ color: "#64748b" }}>{k}</span>
                    <span style={{ fontWeight: 600, color: v.includes("FREE") ? "#10b981" : "#0f172a" }}>{v}</span>
                  </div>
                ))}
                <div style={{ height: 1, background: "#f1f5f9", margin: "12px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>Total</span>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: "#7c3aed" }}>{selectedProduct.price} ETH</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>≈ ${(parseFloat(selectedProduct.price) * ethUsd).toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Settlement flow */}
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 12 }}>HOW YOUR PAYMENT WORKS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    ["💳", "Card tap detected", "Session key activates"],
                    ["⚡", "Smart Account signs", "ZeroDev Kernel V3.1"],
                    ["⛽", "Gas sponsored", "You pay 0 gas"],
                    ["⛓️", "On-chain settlement", "Base Sepolia L2"],
                    ["🏪", "Merchant credited", "Instant finality"],
                  ].map(([icon, title, sub]) => (
                    <div key={title as string} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{icon}</div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{title}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", padding: "28px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>Pay with Tranzo Card</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 22 }}>
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                  Enter your card details to checkout securely.
                </span>
              </div>

              {/* Mini card preview */}
              <div style={{
                borderRadius: 14, padding: "18px 20px", marginBottom: 24,
                background: "linear-gradient(135deg, #1a0533, #3d1f8f, #7c3aed, #ec4899)",
                boxShadow: "0 8px 32px rgba(124,58,237,0.3)",
              }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: "2px" }}>TRANZO</div>
                <div style={{ fontSize: 13, fontFamily: "monospace", color: "rgba(255,255,255,0.9)", marginTop: 14, letterSpacing: "2px" }}>
                  {cardNumber || "•••• •••• •••• ••••"}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{cardName || "CARD HOLDER"}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>📡 NFC</span>
                </div>
              </div>

              <form onSubmit={handlePay} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 }}>CARD NUMBER</label>
                  <input
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    placeholder="•••• •••• •••• ••••"
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 15, fontFamily: "monospace", fontWeight: 600, color: "#0f172a", background: "#f8fafc", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 }}>CARD HOLDER NAME</label>
                  <input
                    value={cardName}
                    onChange={e => setCardName(e.target.value)}
                    placeholder="TRANZO USER"
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, color: "#0f172a", background: "#f8fafc", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 }}>EXPIRY</label>
                    <input
                      value={expiry}
                      onChange={e => setExpiry(e.target.value)}
                      placeholder="MM/YY"
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, color: "#0f172a", background: "#f8fafc", boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 }}>CVV</label>
                    <input
                      value={cvv}
                      onChange={e => setCvv(e.target.value)}
                      placeholder="•••"
                      type="password"
                      maxLength={4}
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, color: "#0f172a", background: "#f8fafc", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                {error && (
                  <div style={{ padding: "12px 14px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 12, color: "#dc2626", lineHeight: 1.5 }}>
                    ⚠️ {error}
                  </div>
                )}

                <button
                  id="btn-demo-pay"
                  type="submit"
                  style={{
                    padding: "16px", borderRadius: 12,
                    background: "linear-gradient(135deg, #7c3aed, #ec4899)",
                    color: "#fff",
                    fontSize: 16, fontWeight: 800,
                    boxShadow: "0 8px 24px rgba(124,58,237,0.3)",
                    cursor: "pointer",
                    border: "none",
                  }}
                >
                  {`Pay ${selectedProduct.price} ETH`}
                </button>
                <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", lineHeight: 1.5 }}>
                  🔒 Gasless · Secured by ZeroDev Kernel · Base Sepolia
                </p>
              </form>
            </div>
          </div>
        )}

        {/* ── PROCESSING ── */}
        {step === "processing" && (
          <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
            <div style={{ position: "relative", width: 100, height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ position: "absolute", width: `${40 + i * 20}px`, height: `${40 + i * 20}px`, borderRadius: "50%", border: "2px solid rgba(124,58,237,0.35)", animation: `ping ${0.8 + i * 0.3}s cubic-bezier(0,0,0.2,1) infinite` }} />
              ))}
              <div style={{ fontSize: 38, zIndex: 1 }}>📡</div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Processing Payment</div>
              <div style={{ fontSize: 14, color: "#64748b", marginTop: 6 }}>Session key signing · ZeroDev bundling...</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
              {["Authorizing card...", "Session key signing...", "Broadcasting UserOp...", "Waiting for on-chain confirm..."].map((s, i) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(124,58,237,0.12)", border: "1.5px solid #7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#7c3aed", flexShrink: 0 }}>✓</div>
                  <span style={{ fontSize: 13, color: "#0f172a" }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step === "success" && (
          <div style={{ maxWidth: 480, margin: "60px auto", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div style={{ width: 90, height: 90, borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, boxShadow: "0 12px 40px rgba(16,185,129,0.3)" }}>✅</div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#10b981" }}>Payment Successful!</div>
              <div style={{ fontSize: 16, color: "#64748b", marginTop: 4 }}>Your order has been placed</div>
            </div>
            <div style={{ width: "100%", background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "20px" }}>
              {[
                ["Product", selectedProduct.name],
                ["Amount", `${selectedProduct.price} ETH`],
                ["Gas Fee", "FREE"],
                ["Network", "Base Sepolia"],
                ["Status", "✅ Confirmed"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 14, borderBottom: "1px solid #f8fafc" }}>
                  <span style={{ color: "#64748b" }}>{k}</span>
                  <span style={{ fontWeight: 700, color: v === "FREE" ? "#10b981" : "#0f172a" }}>{v}</span>
                </div>
              ))}
            </div>
            <a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 13, color: "#7c3aed", fontWeight: 600 }}>
              🔍 View transaction on BaseScan ↗
            </a>
            <div style={{ display: "flex", gap: 12, width: "100%" }}>
              <button onClick={() => setStep("shop")} style={{ flex: 1, padding: "13px", borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: 14, fontWeight: 600, color: "#475569" }}>
                Continue Shopping
              </button>
              <a href="/card-network" target="_blank" style={{ flex: 1, padding: "13px", borderRadius: 10, background: "linear-gradient(135deg, #7c3aed, #ec4899)", fontSize: 14, fontWeight: 600, color: "#fff", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                View Network Log
              </a>
            </div>
          </div>
        )}

        {/* ── FAILED ── */}
        {step === "failed" && (
          <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div style={{ fontSize: 72 }}>❌</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#dc2626" }}>Payment Failed</div>
            <div style={{ padding: "14px", borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 13, color: "#dc2626", lineHeight: 1.6, textAlign: "left", width: "100%" }}>
              {error}
            </div>
            <button onClick={() => setStep("checkout")} style={{ padding: "13px 28px", borderRadius: 10, background: "#0f172a", color: "#fff", fontSize: 14, fontWeight: 700 }}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
