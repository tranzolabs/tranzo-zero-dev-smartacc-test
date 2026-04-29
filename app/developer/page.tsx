"use client";

import { useState, useEffect } from "react";

export default function DeveloperDashboard() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<any[]>([]);

  async function fetchSubscriptions() {
    try {
      const res = await fetch("/api/developer/webhooks");
      const data = await res.json();
      if (res.ok) {
        setSubscriptions(data.subscriptions || []);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLogs() {
    try {
      const res = await fetch("/api/developer/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {}
  }

  useEffect(() => {
    fetchSubscriptions();
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;
    setIsRegistering(true);
    setError("");
    try {
      const res = await fetch("/api/developer/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, description })
      });
      const data = await res.json();
      if (res.ok) {
        setUrl("");
        setDescription("");
        await fetchSubscriptions();
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRegistering(false);
    }
  }

  async function handleDelete(token: string) {
    if (!confirm("Are you sure you want to delete this subscription?")) return;
    try {
      const res = await fetch(`/api/developer/webhooks?token=${token}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await fetchSubscriptions();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#0f172a", fontFamily: "'Inter', sans-serif", color: "#f8fafc" }}>
      <header style={{ background: "#1e293b", borderBottom: "1px solid #334155", padding: "0 24px", display: "flex", alignItems: "center", height: 70, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16 }}>{'</>'}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>Tranzo <span style={{ color: "#8b5cf6" }}>Developer</span></div>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Lithic Events API</h1>
          <p style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.6 }}>
            Manage your asynchronous event subscriptions (e.g., `transaction.cleared`, `card.created`). 
            These webhooks notify your backend when events occur in the Lithic network.
          </p>
        </div>

        <div style={{ background: "#1e293b", borderRadius: 16, border: "1px solid #334155", padding: 24, marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f8fafc", marginBottom: 20 }}>Register New Webhook</h2>
          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 6 }}>NGROK URL</label>
                <input 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://my-tunnel.ngrok.app/api/webhooks/lithic"
                  required
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 10, background: "#0f172a", border: "1px solid #334155", color: "#fff", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 6 }}>DESCRIPTION (Optional)</label>
                <input 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Local Dev Setup"
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 10, background: "#0f172a", border: "1px solid #334155", color: "#fff", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
            </div>

            {error && (
              <div style={{ padding: "12px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 8, color: "#ef4444", fontSize: 13 }}>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isRegistering || !url}
              style={{ padding: "12px 24px", borderRadius: 10, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: (isRegistering || !url) ? "not-allowed" : "pointer", opacity: (isRegistering || !url) ? 0.7 : 1, width: "fit-content" }}
            >
              {isRegistering ? "Registering..." : "Register Webhook"}
            </button>
          </form>
        </div>

        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f8fafc", marginBottom: 20 }}>Active Subscriptions</h2>
          
          {loading ? (
            <div style={{ color: "#94a3b8", fontSize: 14 }}>Loading subscriptions...</div>
          ) : subscriptions.length === 0 ? (
            <div style={{ padding: 40, background: "#1e293b", borderRadius: 16, border: "1px dashed #334155", textAlign: "center", color: "#94a3b8" }}>
              No active event subscriptions found.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {subscriptions.map(sub => (
                <div key={sub.token} style={{ background: "#1e293b", borderRadius: 16, border: "1px solid #334155", padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#f8fafc", marginBottom: 4 }}>{sub.url}</div>
                    <div style={{ fontSize: 13, color: "#94a3b8", display: "flex", gap: 12 }}>
                      <span>Token: <code style={{ color: "#8b5cf6", background: "rgba(139, 92, 246, 0.1)", padding: "2px 6px", borderRadius: 4 }}>{sub.token}</code></span>
                      <span>•</span>
                      <span>Desc: {sub.description || "N/A"}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(sub.token)}
                    style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: 13, fontWeight: 600, border: "1px solid rgba(239, 68, 68, 0.2)", cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Webhook Logs Section */}
        <div style={{ marginTop: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f8fafc" }}>Live Webhook Logs</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#10b981", fontWeight: 600 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "pulse 2s infinite" }} />
              Auto-updating
            </div>
          </div>
          
          <div style={{ background: "#1e293b", borderRadius: 16, border: "1px solid #334155", overflow: "hidden" }}>
            {logs.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                Waiting for incoming webhooks...
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {logs.map((log, index) => (
                  <div key={index} style={{ borderBottom: "1px solid #334155", padding: 0 }}>
                    <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(15,23,42,0.4)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ padding: "4px 8px", borderRadius: 6, background: log.type === "auth_stream.authorize" ? "rgba(139,92,246,0.2)" : "rgba(59,130,246,0.2)", color: log.type === "auth_stream.authorize" ? "#c4b5fd" : "#93c5fd", fontSize: 12, fontWeight: 700, fontFamily: "var(--font-geist-mono)" }}>
                          {log.type || log.event_type || "UNKNOWN_EVENT"}
                        </span>
                        <span style={{ fontSize: 13, color: "#94a3b8" }}>
                          {new Date(log.ts).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <pre style={{ margin: 0, padding: "16px 20px", background: "#0f172a", fontSize: 12, color: "#cbd5e1", overflowX: "auto", fontFamily: "var(--font-geist-mono)" }}>
                      {JSON.stringify(log, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}} />
    </div>
  );
}
