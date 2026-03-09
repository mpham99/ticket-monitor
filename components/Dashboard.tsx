"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TicketListing, TicketType } from "@/types";

// ── helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number) => Number(n).toLocaleString("vi-VN");
const nowT = () => new Date().toLocaleTimeString("en-GB");
const POLL_MS = 2 * 60 * 1000;

interface LastCrawl {
  fetchedAt: string;
  totalListings: number;
  pages: number;
  durationMs: number;
}

interface Props {
  initialListings: TicketListing[];
  initialLastCrawl: LastCrawl | null;
  initialFiredCodes: string[];
  allTicketTypes: TicketType[];
}

export default function Dashboard({
  initialListings,
  initialLastCrawl,
  initialFiredCodes,
  allTicketTypes,
}: Props) {
  const [listings, setListings] = useState<TicketListing[]>(initialListings);
  const [lastCrawl, setLastCrawl] = useState<LastCrawl | null>(initialLastCrawl);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set([1058172, 1058173, 1058174, 1058175])
  );
  const [threshold, setThreshold] = useState(5000000);
  const [firedCodes, setFiredCodes] = useState<Set<string>>(new Set(initialFiredCodes));
  const [alertCount, setAlertCount] = useState(0);
  const [nextFetchIn, setNextFetchIn] = useState<string>("—");
  const [notifPerm, setNotifPerm] = useState<NotificationPermission | "unsupported">("default");
  const [log, setLog] = useState<Array<{ time: string; msg: string; type: string }>>([
    { time: "--:--:--", msg: "Auto-refreshing listings every 3 minutes.", type: "info" },
  ]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextFetchAtRef = useRef<number | null>(null);

  const faceMap = new Map(allTicketTypes.map((t) => [t.id, t.price]));

  // ── log helper ──────────────────────────────────────────────────────────
  const addLog = useCallback((msg: string, type = "info") => {
    setLog((prev) => [{ time: nowT(), msg, type }, ...prev].slice(0, 200));
  }, []);

  // ── notification setup ──────────────────────────────────────────────────
  useEffect(() => {
    if (!("Notification" in window)) { setNotifPerm("unsupported"); return; }
    setNotifPerm(Notification.permission);
  }, []);

  const requestNotifPerm = async () => {
    if (!("Notification" in window)) return;
    const p = await Notification.requestPermission();
    setNotifPerm(p);
    addLog(p === "granted" ? "🔔 Browser notifications enabled." : "⚠ Notification permission: " + p, p === "granted" ? "success" : "warn");
  };

  const sendNotif = useCallback((t: TicketListing) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    const n = new Notification("🚨 GAI HOME CONCERT — Price Alert!", {
      body: `${t.ticketTypeName}\n${fmt(t.price)} VND × ${t.quantity} ticket(s)\nClick to buy →`,
      icon: "https://ticketbox.vn/favicon.ico",
      tag: t.code,
      requireInteraction: true,
    });
    n.onclick = () => { window.open(t.deeplink, "_blank"); n.close(); };
  }, []);

  // ── check alerts ────────────────────────────────────────────────────────
  const checkAlerts = useCallback(async (tickets: TicketListing[]) => {
    for (const t of tickets) {
      if (selectedIds.has(t.ticketTypeId) && t.price < threshold && !firedCodes.has(t.code)) {
        setFiredCodes((prev) => new Set([...prev, t.code]));
        addLog(`🚨 ALERT: ${t.ticketTypeName} — ${fmt(t.price)} VND (below ${fmt(threshold)})`, "alert");
        sendNotif(t);
        setAlertCount((c) => c + 1);

        // Persist alert to DB via API
        await fetch("/api/alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: t.code,
            ticketTypeId: t.ticketTypeId,
            ticketTypeName: t.ticketTypeName,
            price: t.price,
            quantity: t.quantity,
            deeplink: t.deeplink,
          }),
        }).catch(() => {});
      }
    }
  }, [selectedIds, threshold, firedCodes, addLog, sendNotif]);

  // ── fetch latest listings from DB ────────────────────────────────────────
  const fetchListings = useCallback(async () => {
    try {
      const res = await fetch("/api/tickets", { cache: "no-store" });
      const data = await res.json();
      if (data.listings) {
        setListings(data.listings);
        if (data.lastCrawl) setLastCrawl(data.lastCrawl);
        await checkAlerts(data.listings);
        addLog(`Loaded ${data.listings.length} listings from database.`);
      }
    } catch (e) {
      addLog("Failed to load listings: " + (e instanceof Error ? e.message : String(e)), "alert");
    }
  }, [checkAlerts, addLog]);

  // ── countdown timer ──────────────────────────────────────────────────────
  const startCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    nextFetchAtRef.current = Date.now() + POLL_MS;
    countdownRef.current = setInterval(() => {
      if (!nextFetchAtRef.current) { setNextFetchIn("—"); return; }
      const rem = Math.max(0, nextFetchAtRef.current - Date.now());
      const m = Math.floor(rem / 60000);
      const s = Math.floor((rem % 60000) / 1000);
      setNextFetchIn(`${m}:${s.toString().padStart(2, "0")}`);
    }, 1000);
  }, []);

  // ── auto-start polling on mount ──────────────────────────────────────────
  useEffect(() => {
    fetchListings();
    startCountdown();
    pollRef.current = setInterval(() => {
      fetchListings();
      startCountdown();
    }, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── ticket selection ──────────────────────────────────────────────────────
  const toggleId = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── sorted listings ───────────────────────────────────────────────────────
  const sorted = [...listings].sort((a, b) => {
    const aM = selectedIds.has(a.ticketTypeId), bM = selectedIds.has(b.ticketTypeId);
    if (aM && !bM) return -1; if (!aM && bM) return 1;
    return a.price - b.price;
  });

  return (
    <div style={{ maxWidth: 1140, margin: "0 auto", padding: "40px 24px", position: "relative", zIndex: 1 }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1, fontFamily: "'Syne', sans-serif" }}>
            GAI HOME <span style={{ color: "var(--accent)" }}>CONCERT</span>
          </h1>
          <div style={{ fontFamily: "var(--mono)", fontSize: "0.68rem", color: "var(--muted)", marginTop: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Resale Ticket Price Monitor · April 26 2026
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface2)", border: "1px solid var(--border)", padding: "10px 16px", borderRadius: 8, fontFamily: "var(--mono)", fontSize: "0.72rem", color: "var(--muted)" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00e676", flexShrink: 0, display: "inline-block", boxShadow: "0 0 8px #00e676" }} />
          Auto-refreshing · next in {nextFetchIn}
        </div>
      </div>

      {/* NOTIFICATION BANNER */}
      {notifPerm !== "granted" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 8, marginBottom: 18, fontFamily: "var(--mono)", fontSize: "0.72rem", background: notifPerm === "denied" ? "rgba(255,60,90,0.07)" : "rgba(255,149,0,0.08)", border: `1px solid ${notifPerm === "denied" ? "rgba(255,60,90,0.25)" : "rgba(255,149,0,0.25)"}`, color: notifPerm === "denied" ? "var(--accent)" : "var(--accent2)" }}>
          {notifPerm === "denied" ? "✗ Notifications blocked — allow in browser settings." : "⚠ Browser notifications not enabled."}
          {notifPerm !== "denied" && (
            <button onClick={requestNotifPerm} style={{ background: "rgba(255,149,0,0.15)", border: "1px solid rgba(255,149,0,0.4)", color: "var(--accent2)", cursor: "pointer", borderRadius: 5, padding: "3px 10px", fontSize: "0.68rem", marginLeft: 8, fontFamily: "var(--mono)" }}>
              Enable
            </button>
          )}
        </div>
      )}

      {/* TICKET SELECTOR */}
      <Panel title="🎫 Select Tickets to Monitor">
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <SmallBtn onClick={() => setSelectedIds(new Set(allTicketTypes.map((t) => t.id)))}>Select All</SmallBtn>
          <SmallBtn onClick={() => setSelectedIds(new Set())}>Clear All</SmallBtn>
          <SmallBtn onClick={() => setSelectedIds(new Set([1058172, 1058173, 1058174, 1058175]))}>Điêng Lên 1–4 Only</SmallBtn>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 8 }}>
          {allTicketTypes.map((t) => {
            const sel = selectedIds.has(t.id);
            return (
              <div key={t.id} onClick={() => toggleId(t.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, border: `1px solid ${sel ? "var(--accent2)" : "var(--border)"}`, cursor: "pointer", background: sel ? "rgba(255,149,0,0.07)" : "var(--bg)", transition: "all 0.15s", userSelect: "none" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: t.color, flexShrink: 0, display: "inline-block" }} />
                <div style={{ width: 16, height: 16, border: `1.5px solid ${sel ? "var(--accent2)" : "var(--border)"}`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", background: sel ? "var(--accent2)" : "transparent", flexShrink: 0, transition: "all 0.15s" }}>
                  {sel && <span style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}>✓</span>}
                </div>
                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 600, lineHeight: 1.3 }}>{t.name}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "0.62rem", color: "var(--muted)", marginTop: 1 }}>Face: {fmt(t.price)} ₫</div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* CONFIG */}
      <Panel title="⚙ Configuration">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontFamily: "var(--mono)", fontSize: "0.62rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
              Price Threshold (VND) — alert when monitored ticket falls BELOW this
            </label>
            <input type="number" value={threshold} min={0} step={100000} onChange={(e) => setThreshold(Number(e.target.value))}
              style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", fontFamily: "var(--mono)", fontSize: "0.8rem", padding: "10px 14px", width: "100%" }} />
            <div style={{ fontFamily: "var(--mono)", fontSize: "0.75rem", color: "var(--accent2)", marginTop: 4 }}>{fmt(threshold)} VND</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap", alignItems: "center" }}>
          <Btn onClick={fetchListings} variant="secondary">↓ Refresh Now</Btn>
          {notifPerm !== "granted" && <Btn onClick={requestNotifPerm} variant="secondary">🔔 Enable Notifications</Btn>}
        </div>

        {/* Crawl info */}
        {lastCrawl && (
          <div style={{ marginTop: 14, fontFamily: "var(--mono)", fontSize: "0.68rem", color: "var(--muted)", lineHeight: 1.8 }}>
            Last crawl: <span style={{ color: "var(--text)" }}>{new Date(lastCrawl.fetchedAt).toLocaleString()}</span>
            {" · "}{lastCrawl.totalListings} listings · {lastCrawl.pages} pages
          </div>
        )}
      </Panel>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 22 }}>
        <StatCard label="Last Crawl" value={lastCrawl ? new Date(lastCrawl.fetchedAt).toLocaleTimeString() : "—"} small />
        <StatCard label="Next Refresh" value={nextFetchIn} small />
        <StatCard label="Total Listings" value={listings.length} color="blue" />
        <StatCard label="Watching" value={selectedIds.size} color="orange" />
        <StatCard label="Alerts Fired" value={alertCount} color="red" />
      </div>

      {/* LISTINGS */}
      <div style={{ marginBottom: 20 }}>
        <SectionTitle>📋 Resale Listings from Database (monitored highlighted)</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {sorted.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--muted)", fontFamily: "var(--mono)", fontSize: "0.72rem" }}>
              No listings yet. Data will load automatically.
            </div>
          ) : sorted.map((t) => {
            const isM = selectedIds.has(t.ticketTypeId);
            const isBelow = t.price < threshold;
            const isAlert = isM && isBelow;
            const isSeated = t.ticketTypeName.includes("Seated");
            return (
              <div key={t.code} style={{ background: isAlert ? "rgba(255,60,90,0.05)" : isM ? "rgba(255,149,0,0.025)" : "var(--surface)", border: `1px solid ${isAlert ? "var(--accent)" : isM ? "rgba(255,149,0,0.3)" : "var(--border)"}`, borderRadius: 10, padding: "14px 18px", display: "grid", gridTemplateColumns: "3fr 1fr 1.2fr 1fr auto", alignItems: "center", gap: 14 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>{t.ticketTypeName}</div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 5 }}>
                    <Badge color={isSeated ? "#5bbee8" : "#f1b65a"} bg={isSeated ? "rgba(91,190,232,0.12)" : "rgba(241,182,90,0.12)"}>{isSeated ? "Seated" : "Standing"}</Badge>
                    {isM && <Badge color="var(--accent2)" bg="rgba(255,149,0,0.18)">🔔 Monitored</Badge>}
                    {isAlert && <Badge color="var(--accent)" bg="rgba(255,60,90,0.18)">⚡ Below Threshold!</Badge>}
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--muted)", marginTop: 3 }}>
                    Code: {t.code} · Order: {t.orderCode}{t.fullPurchase ? " · ⚠ Full purchase" : ""}
                  </div>
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "0.78rem", color: "var(--muted)", textAlign: "center" }}>{t.quantity}×</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "0.92rem", fontWeight: 700, textAlign: "right", color: isAlert ? "var(--accent)" : "var(--text)" }}>
                  {fmt(t.price)}<span style={{ fontSize: "0.58rem", color: "var(--muted)", fontWeight: 400, display: "block" }}>VND / ticket</span>
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "0.6rem", color: "var(--muted)", textAlign: "right" }}>
                  Face: {fmt(faceMap.get(t.ticketTypeId) ?? 0)} ₫
                </div>
                <a href={t.deeplink} target="_blank" rel="noopener noreferrer" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--muted)", fontSize: "0.68rem", padding: "6px 12px", borderRadius: 5, textDecoration: "none", fontFamily: "var(--mono)", whiteSpace: "nowrap" }}>
                  Buy →
                </a>
              </div>
            );
          })}
        </div>
      </div>

      {/* LOG */}
      <SectionTitle>🖥 Activity Log</SectionTitle>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 14, fontFamily: "var(--mono)", fontSize: "0.7rem", maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
        {log.map((entry, i) => (
          <div key={i} style={{ display: "flex", gap: 12 }}>
            <span style={{ color: "#3a3a50", flexShrink: 0 }}>{entry.time}</span>
            <span style={{ color: entry.type === "success" ? "var(--green)" : entry.type === "alert" ? "var(--accent)" : entry.type === "warn" ? "var(--accent2)" : "var(--muted)" }}>{entry.msg}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "24px 28px", marginBottom: 20 }}>
      <div style={{ fontSize: "0.62rem", fontFamily: "var(--mono)", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 18 }}>{title}</div>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: "0.62rem", fontFamily: "var(--mono)", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 14 }}>{children}</div>;
}

function StatCard({ label, value, color, small }: { label: string; value: string | number; color?: string; small?: boolean }) {
  const colorMap: Record<string, string> = { green: "var(--green)", red: "var(--accent)", orange: "var(--accent2)", blue: "var(--blue)" };
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: "0.58rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: small ? "0.85rem" : "1.5rem", fontWeight: 800, lineHeight: 1, color: color ? colorMap[color] : small ? "var(--muted)" : "var(--text)", paddingTop: small ? 5 : 0 }}>{value}</div>
    </div>
  );
}

function Badge({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return <span style={{ display: "inline-block", fontFamily: "var(--mono)", fontSize: "0.52rem", padding: "2px 7px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.07em", color, background: bg }}>{children}</span>;
}

function SmallBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer", fontFamily: "var(--mono)", fontSize: "0.68rem", padding: "5px 12px", borderRadius: 5 }}>
      {children}
    </button>
  );
}

function Btn({ children, onClick, disabled, variant }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; variant: "primary" | "stop" | "secondary" }) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: "var(--accent)", color: "#fff" },
    stop: { background: "transparent", color: "var(--accent)", border: "1px solid var(--accent)" },
    secondary: { background: "var(--surface2)", color: "var(--text)", border: "1px solid var(--border)" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ border: "none", cursor: disabled ? "not-allowed" : "pointer", fontFamily: "var(--sans)", fontWeight: 600, fontSize: "0.82rem", padding: "10px 20px", borderRadius: 7, opacity: disabled ? 0.4 : 1, ...styles[variant] }}>
      {children}
    </button>
  );
}
