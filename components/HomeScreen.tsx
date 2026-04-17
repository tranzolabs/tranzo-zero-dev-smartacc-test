"use client";

import { useState } from "react";
import { useWallet } from "@/lib/WalletContext";
import BalanceCard from "@/components/BalanceCard";
import VirtualCard from "@/components/VirtualCard";
import SendModal from "@/components/SendModal";
import ReceiveModal from "@/components/ReceiveModal";
import TxHistory from "@/components/TxHistory";
import SettingsModal from "@/components/SettingsModal";

type Tab = "wallet" | "card" | "history";

export default function HomeScreen() {
  const { smartAddress, signerType } = useWallet();
  const [activeTab, setActiveTab] = useState<Tab>("wallet");
  const [showSend, setShowSend] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const shortAddr = smartAddress
    ? `${smartAddress.slice(0, 6)}…${smartAddress.slice(-4)}`
    : "Loading…";

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bg-primary)",
        display: "flex",
        flexDirection: "column",
        maxWidth: 520,
        margin: "0 auto",
      }}
    >
      {/* ─── Header ─────────────────────────────────────────────── */}
      <header
        style={{
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 900,
            }}
          >
            T
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Tranzo Money</div>
            <div
              style={{
                fontSize: 11, color: "var(--text-secondary)",
                fontFamily: "var(--font-geist-mono)",
              }}
            >
              {shortAddr}
            </div>
          </div>
        </div>

        {/* Settings button (key export is inside) */}
        <button
          id="btn-settings"
          onClick={() => setShowSettings(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 20,
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            fontSize: 12, fontWeight: 600,
            color: "var(--text-secondary)",
          }}
        >
          ⚙️ {signerType === "metamask" ? "MetaMask" : "Embedded"}
        </button>
      </header>

      {/* ─── Main Content ────────────────────────────────────────── */}
      <main
        style={{
          flex: 1, padding: "20px 24px 100px",
          display: "flex", flexDirection: "column", gap: 16,
        }}
      >
        {activeTab === "wallet" && (
          <>
            <BalanceCard smartAddress={smartAddress} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <QuickAction
                id="btn-send"
                icon="↗️"
                label="Send"
                sublabel="Gasless"
                color="var(--accent-purple)"
                onClick={() => setShowSend(true)}
              />
              <QuickAction
                id="btn-receive"
                icon="↙️"
                label="Receive"
                sublabel="Copy address"
                color="var(--accent-cyan)"
                onClick={() => setShowReceive(true)}
              />
            </div>

            <TxHistory smartAddress={smartAddress} limit={5} />
          </>
        )}

        {activeTab === "card" && <VirtualCard smartAddress={smartAddress} />}
        {activeTab === "history" && <TxHistory smartAddress={smartAddress} limit={50} />}
      </main>

      {/* ─── Bottom Nav ──────────────────────────────────────────── */}
      <nav
        style={{
          position: "fixed", bottom: 0, left: "50%",
          transform: "translateX(-50%)",
          width: "100%", maxWidth: 520,
          padding: "12px 24px 24px",
          background: "rgba(10,10,15,0.96)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid var(--border)",
          display: "flex", justifyContent: "space-around",
        }}
      >
        {(["wallet", "card", "history"] as Tab[]).map((tab) => (
          <NavTab
            key={tab}
            tab={tab}
            active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          />
        ))}
      </nav>

      {showSend     && <SendModal     onClose={() => setShowSend(false)}     />}
      {showReceive  && <ReceiveModal  onClose={() => setShowReceive(false)}  />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function QuickAction({
  id, icon, label, sublabel, color, onClick,
}: {
  id: string; icon: string; label: string; sublabel: string; color: string; onClick: () => void;
}) {
  return (
    <button
      id={id}
      onClick={onClick}
      style={{
        padding: "20px 16px",
        borderRadius: "var(--radius-md)",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 8,
        transition: "all 0.2s ease",
      }}
      onMouseOver={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = color;
        (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)";
      }}
      onMouseOut={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLElement).style.background = "var(--bg-card)";
      }}
    >
      <div
        style={{
          width: 48, height: 48, borderRadius: "50%",
          background: `${color}22`,
          border: `1px solid ${color}44`,
          display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 22,
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{sublabel}</div>
    </button>
  );
}

function NavTab({ tab, active, onClick }: { tab: Tab; active: boolean; onClick: () => void }) {
  const info = {
    wallet:  { icon: "💰", label: "Wallet"  },
    card:    { icon: "💳", label: "Card"    },
    history: { icon: "📋", label: "History" },
  };
  return (
    <button
      id={`nav-${tab}`}
      onClick={onClick}
      style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 4,
        padding: "8px 24px",
        borderRadius: "var(--radius-sm)",
        background: active ? "rgba(124,58,237,0.15)" : "transparent",
        border: "none",
        transition: "all 0.2s ease",
        minWidth: 70,
      }}
    >
      <span style={{ fontSize: 22 }}>{info[tab].icon}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: active ? "var(--accent-violet)" : "var(--text-muted)" }}>
        {info[tab].label}
      </span>
    </button>
  );
}
