"use client";

interface Props {
  smartAddress: string;
  limit?: number;
}

export default function TxHistory({ smartAddress, limit = 5 }: Props) {
  // In production: fetch from Neynar/Blockscout API
  // For now: show placeholder / empty state
  const txs: { hash: string; type: string; amount: string; to: string; time: string; status: string }[] = [];

  return (
    <div style={{
      borderRadius: "var(--radius-md)",
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      overflow: "hidden",
    }}>
      <div style={{
        padding: "16px 20px 12px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "1px solid var(--border)",
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
          Recent Activity
        </span>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Base Sepolia
        </span>
      </div>

      {txs.length === 0 ? (
        <div style={{
          padding: "40px 20px",
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 36 }}>📭</span>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>
              No transactions yet
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              Send or receive ETH to get started
            </div>
          </div>
        </div>
      ) : (
        txs.slice(0, limit).map((tx) => (
          <div key={tx.hash} style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: tx.type === "send" ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}>
              {tx.type === "send" ? "↗️" : "↙️"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {tx.type === "send" ? "Sent" : "Received"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                {tx.time}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{
                fontSize: 14, fontWeight: 700,
                color: tx.type === "send" ? "#ef4444" : "#10b981",
              }}>
                {tx.type === "send" ? "-" : "+"}{tx.amount} ETH
              </div>
              <div style={{
                fontSize: 10, color: "#10b981", fontWeight: 600, marginTop: 2,
              }}>
                ⛽ Gas free
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
