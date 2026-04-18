"use client";

import { useState, useEffect } from "react";

interface AuthEvent {
  merchant: string;
  amount: string;
  from: string;
  to: string;
  hash: string;
  ts: number;
}

type AuthStatus = "authorizing" | "approved" | "settled";

interface AuthRecord extends AuthEvent {
  id: string;
  status: AuthStatus;
  responseCode: string;
  processingMs: number;
}

export default function CardNetworkPage() {
  const [auths, setAuths] = useState<AuthRecord[]>([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, volume: 0 });
  const [latestAnim, setLatestAnim] = useState<string | null>(null);

  // Listen for payments from card app (same browser, different tab)
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key !== "tranzo_last_tx" || !e.newValue) return;
      try {
        const event = JSON.parse(e.newValue) as AuthEvent;
        addAuthRequest(event);
      } catch {}
    }
    window.addEventListener("storage", handleStorage);

    // Also check on mount
    const existing = localStorage.getItem("tranzo_last_tx");
    if (existing) {
      try {
        const event = JSON.parse(existing) as AuthEvent;
        if (Date.now() - event.ts < 60000) addAuthRequest(event);
      } catch {}
    }

    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  function addAuthRequest(event: AuthEvent) {
    const id = `auth-${Date.now()}`;
    const record: AuthRecord = {
      ...event,
      id,
      status: "authorizing",
      responseCode: "",
      processingMs: 0,
    };

    setAuths(prev => [record, ...prev.slice(0, 49)]);
    setLatestAnim(id);

    // Simulate auth pipeline
    setTimeout(() => {
      setAuths(prev => prev.map(a => a.id === id
        ? { ...a, status: "approved", responseCode: "00", processingMs: 1240 }
        : a
      ));
      setStats(p => ({ total: p.total + 1, approved: p.approved + 1, volume: p.volume + parseFloat(event.amount) }));
    }, 1500);

    setTimeout(() => {
      setAuths(prev => prev.map(a => a.id === id ? { ...a, status: "settled" } : a));
      setLatestAnim(null);
    }, 4000);
  }

  function addDemoAuth() {
    addAuthRequest({
      merchant: ["☕ Brew & Bean", "🛒 FreshMart", "⛽ QuickFuel", "🛍️ TechStore"][Math.floor(Math.random() * 4)],
      amount: (Math.random() * 0.001 + 0.0001).toFixed(6),
      from: `0x${Math.random().toString(16).slice(2, 42)}`,
      to:   `0x${Math.random().toString(16).slice(2, 42)}`,
      hash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
      ts: Date.now(),
    });
  }

  const statusColor: Record<AuthStatus, string> = {
    authorizing: "#f59e0b",
    approved:    "#10b981",
    settled:     "#7c3aed",
  };

  const statusLabel: Record<AuthStatus, string> = {
    authorizing: "Authorizing",
    approved:    "Approved",
    settled:     "Settled",
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#060612", color: "#f1f5f9", fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <header style={{ padding: "16px 24px", background: "rgba(6,6,18,0.98)", borderBottom: "1px solid rgba(14,165,233,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(20px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #0ea5e9, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🌐</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>TranzoNet Authorization</div>
            <div style={{ fontSize: 10, color: "#64748b", letterSpacing: "1px" }}>CARD NETWORK · DEMO · BASE SEPOLIA</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981", animation: "ping 2s infinite" }} />
            <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>Live Network</span>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { label: "Authorizations", value: stats.total.toString(), icon: "📊", color: "#0ea5e9" },
            { label: "Approved",       value: stats.approved.toString(), icon: "✅", color: "#10b981" },
            { label: "Decline Rate",   value: "0%", icon: "📉", color: "#f59e0b" },
            { label: "Total Volume",   value: `${stats.volume.toFixed(6)} ETH`, icon: "💰", color: "#7c3aed" },
          ].map(s => (
            <div key={s.label} style={{ padding: "16px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 22 }}>{s.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color, marginTop: 8 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Auth pipeline diagram */}
        <div style={{ padding: "20px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(14,165,233,0.12)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 16 }}>AUTHORIZATION PIPELINE</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {[
              { icon: "💳", label: "Card Swipe",    sub: "NFC Tap",          color: "#7c3aed" },
              { icon: "🔑", label: "Session Key",   sub: "Auto-signs",       color: "#8b5cf6" },
              { icon: "⚡", label: "Smart Account", sub: "ZeroDev Kernel",   color: "#ec4899" },
              { icon: "🌐", label: "TranzoNet",     sub: "Auth Request",     color: "#0ea5e9" },
              { icon: "✅", label: "Approval",      sub: "Code: 00",         color: "#10b981" },
              { icon: "⛓️", label: "Settlement",    sub: "Base Sepolia",     color: "#06b6d4" },
              { icon: "🏪", label: "Merchant",      sub: "Credited",         color: "#10b981" },
            ].map((n, i) => (
              <div key={n.label} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${n.color}15`, border: `1px solid ${n.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, margin: "0 auto" }}>{n.icon}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, marginTop: 4, color: n.color }}>{n.label}</div>
                  <div style={{ fontSize: 8, color: "#64748b" }}>{n.sub}</div>
                </div>
                {i < 6 && <div style={{ width: 16, height: 1, background: "rgba(14,165,233,0.25)", margin: "0 4px", marginBottom: 20 }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={addDemoAuth} style={{ flex: 1, padding: "14px", borderRadius: 12, background: "linear-gradient(135deg, #0ea5e9, #7c3aed)", color: "#fff", fontSize: 14, fontWeight: 700, boxShadow: "0 8px 20px rgba(14,165,233,0.3)" }}>
            🎭 Simulate Authorization
          </button>
          <button onClick={() => setAuths([])} style={{ padding: "14px 20px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>
            Clear
          </button>
        </div>

        {/* Auth log */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 12 }}>
            AUTHORIZATION LOG — {auths.length} records
          </div>

          {auths.length === 0 ? (
            <div style={{ padding: "40px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.06)", textAlign: "center", color: "#64748b", fontSize: 13 }}>
              No authorizations yet.<br />
              <span style={{ fontSize: 11, marginTop: 4, display: "block" }}>Pay from the card app or click "Simulate" above</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {auths.map((auth) => (
                <AuthRow key={auth.id} auth={auth} isNew={auth.id === latestAnim} statusColor={statusColor} statusLabel={statusLabel} />
              ))}
            </div>
          )}
        </div>

        {/* Response codes legend */}
        <div style={{ padding: "16px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>RESPONSE CODES</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {[["00", "Approved", "#10b981"], ["05", "Do Not Honor", "#ef4444"], ["51", "Insufficient Funds", "#f59e0b"], ["54", "Expired Card", "#94a3b8"]].map(([code, desc, color]) => (
              <div key={code} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ padding: "2px 8px", borderRadius: 4, background: `${color}15`, border: `1px solid ${color}30`, fontSize: 11, fontWeight: 700, fontFamily: "monospace", color: color as string }}>{code}</span>
                <span style={{ fontSize: 11, color: "#64748b" }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthRow({ auth, isNew, statusColor, statusLabel }: {
  auth: AuthRecord;
  isNew: boolean;
  statusColor: Record<AuthStatus, string>;
  statusLabel: Record<AuthStatus, string>;
}) {
  return (
    <div style={{
      padding: "14px 16px", borderRadius: 12,
      background: isNew ? "rgba(14,165,233,0.06)" : "rgba(255,255,255,0.02)",
      border: `1px solid ${isNew ? "rgba(14,165,233,0.2)" : "rgba(255,255,255,0.05)"}`,
      display: "flex", justifyContent: "space-between", alignItems: "center",
      animation: "fadeIn 0.4s ease",
      transition: "all 0.4s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${statusColor[auth.status]}12`, border: `1px solid ${statusColor[auth.status]}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          {auth.status === "authorizing" ? "⏳" : auth.status === "approved" ? "✅" : "⛓️"}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{auth.merchant}</div>
          <div style={{ fontSize: 10, fontFamily: "monospace", color: "#64748b", marginTop: 2 }}>
            {auth.from.slice(0, 10)}...{auth.from.slice(-4)} → {auth.to.slice(0, 10)}...{auth.to.slice(-4)}
          </div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>
            {new Date(auth.ts).toLocaleTimeString()} · {auth.processingMs > 0 ? `${auth.processingMs}ms` : "processing..."}
          </div>
        </div>
      </div>

      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: statusColor[auth.status] }}>+{auth.amount} ETH</div>
        <div style={{ marginTop: 4, display: "flex", justifyContent: "flex-end", gap: 6 }}>
          {auth.responseCode && (
            <span style={{ padding: "2px 6px", borderRadius: 4, background: "rgba(16,185,129,0.12)", fontSize: 10, fontWeight: 700, fontFamily: "monospace", color: "#10b981" }}>
              {auth.responseCode}
            </span>
          )}
          <span style={{ padding: "2px 8px", borderRadius: 4, background: `${statusColor[auth.status]}12`, border: `1px solid ${statusColor[auth.status]}25`, fontSize: 10, fontWeight: 700, color: statusColor[auth.status] }}>
            {statusLabel[auth.status].toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
