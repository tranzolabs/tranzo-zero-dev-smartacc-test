"use client";

import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { getPublicClient } from "@/lib/wallet";

interface Props {
  smartAddress: string;
}

export default function BalanceCard({ smartAddress }: Props) {
  const [balance, setBalance] = useState<string>("0.00");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!smartAddress) return;
    fetchBalance();
    const interval = setInterval(fetchBalance, 15000);
    return () => clearInterval(interval);
  }, [smartAddress]);

  async function fetchBalance() {
    try {
      const client = getPublicClient();
      const bal = await client.getBalance({ address: smartAddress as `0x${string}` });
      const formatted = parseFloat(formatEther(bal)).toFixed(4);
      setBalance(formatted);
    } catch {
      setBalance("—");
    } finally {
      setLoading(false);
    }
  }

  const shortAddr = smartAddress
    ? `${smartAddress.slice(0, 6)}...${smartAddress.slice(-4)}`
    : "Loading...";

  return (
    <div style={{
      borderRadius: "var(--radius-lg)",
      background: "linear-gradient(135deg, #3d1f8f 0%, #7c3aed 50%, #ec4899 100%)",
      padding: "28px 24px",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 20px 60px rgba(124,58,237,0.3)",
    }}>
      {/* Background pattern */}
      <div style={{
        position: "absolute", top: -40, right: -40,
        width: 160, height: 160, borderRadius: "50%",
        background: "rgba(255,255,255,0.05)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: -60, left: -20,
        width: 200, height: 200, borderRadius: "50%",
        background: "rgba(255,255,255,0.03)",
        pointerEvents: "none",
      }} />

      {/* Network badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "rgba(255,255,255,0.15)",
        borderRadius: 20, padding: "4px 10px",
        marginBottom: 20,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>Base Sepolia</span>
      </div>

      {/* Balance */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4, fontWeight: 500 }}>
          Total Balance
        </div>
        {loading ? (
          <div style={{
            height: 40, width: 160, borderRadius: 8,
            background: "rgba(255,255,255,0.1)",
          }} className="shimmer" />
        ) : (
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 38, fontWeight: 900, color: "#fff", letterSpacing: "-1px" }}>
              {balance}
            </span>
            <span style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>ETH</span>
          </div>
        )}
      </div>

      {/* Smart account address */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
        <div style={{
          fontSize: 12, color: "rgba(255,255,255,0.6)",
          background: "rgba(0,0,0,0.2)",
          borderRadius: 8, padding: "4px 10px",
          fontFamily: "var(--font-geist-mono)",
        }}>
          {shortAddr}
        </div>
        <button
          id="btn-copy-address"
          onClick={() => navigator.clipboard.writeText(smartAddress)}
          style={{
            background: "rgba(255,255,255,0.15)",
            borderRadius: 8, padding: "4px 8px",
            fontSize: 12, color: "#fff",
          }}
        >
          📋 Copy
        </button>
      </div>

      {/* Smart account badge */}
      <div style={{
        position: "absolute", top: 24, right: 24,
        background: "rgba(255,255,255,0.15)",
        borderRadius: 8, padding: "4px 8px",
        fontSize: 10, fontWeight: 700, color: "#fff",
        letterSpacing: "0.5px",
      }}>
        ⚡ SMART ACCOUNT
      </div>
    </div>
  );
}
