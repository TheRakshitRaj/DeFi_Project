import { useRef } from "react";
import { gsap } from "gsap";
import { useCardHover } from "../App";

const Row = ({ label, value, color }) => (
    <div className="data-row">
        <span style={{ fontSize: 12, color: "#9b8677", fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
        <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", fontWeight: 500, color: color || "#1e0e04" }}>{value}</span>
    </div>
);

export default function VaultDashboard({ vaultData }) {
    const pnl   = parseFloat(vaultData.pnl);
    const pnlUp = pnl >= 0;
    const cardRef = useRef(null);
    useCardHover(cardRef);

    // Tilt on mouse move
    const onMove = e => {
        const r = cardRef.current.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width  - 0.5;
        const y = (e.clientY - r.top)  / r.height - 0.5;
        gsap.to(cardRef.current, { rotateY: x * 2.5, rotateX: -y * 2.5, duration: 0.35, ease: "power2.out", transformPerspective: 900 });
    };
    const onLeave = () => gsap.to(cardRef.current, { rotateY: 0, rotateX: 0, duration: 0.45, ease: "power2.out" });

    return (
        <div ref={cardRef} className="card" style={{ padding: 20, transformStyle: "preserve-3d", cursor: "default" }}
            onMouseMove={onMove} onMouseLeave={onLeave}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                    <h2 className="heading" style={{ fontSize: 17 }}>Vault Dashboard</h2>
                    <p style={{ fontSize: 11, color: "#9b8677", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>Real-time vault metrics</p>
                </div>
                <div style={{ width: 34, height: 34, borderRadius: 10, fontSize: 16, background: "rgba(45,89,134,0.08)", border: "1px solid rgba(45,89,134,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>📊</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                {[
                    { l: "TVL",    v: `${Number(vaultData.tvl).toFixed(4)} ETH`,           c: "#2d5986", icon: "🔷", bg: "rgba(45,89,134,0.06)",  bd: "rgba(45,89,134,0.12)"  },
                    { l: "APY",    v: `${vaultData.apy}%`,                                  c: "#2d6a4f", icon: "📈", bg: "rgba(45,106,79,0.06)", bd: "rgba(45,106,79,0.12)" },
                    { l: "P/L",    v: `${pnlUp?"+":""}${pnl.toFixed(4)} ETH`,              c: pnlUp?"#2d6a4f":"#b85c38", icon: pnlUp?"🟢":"🔴", bg: pnlUp?"rgba(45,106,79,0.06)":"rgba(184,92,56,0.06)", bd: pnlUp?"rgba(45,106,79,0.12)":"rgba(184,92,56,0.12)" },
                    { l: "Cycles", v: vaultData.cycleCount,                                  c: "#8a6020", icon: "🔄", bg: "rgba(201,148,58,0.06)", bd: "rgba(201,148,58,0.12)" },
                ].map(({ l, v, c, icon, bg, bd }) => (
                    <div key={l} style={{ background: bg, border: `1px solid ${bd}`, borderRadius: 10, padding: "10px 12px", transition: "transform 0.2s ease" }}
                        onMouseEnter={e => gsap.to(e.currentTarget, { scale: 1.02, duration: 0.2 })}
                        onMouseLeave={e => gsap.to(e.currentTarget, { scale: 1, duration: 0.2 })}>
                        <p style={{ fontSize: 10, color: "#9b8677", fontFamily: "'DM Sans', sans-serif", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{icon} {l}</p>
                        <p className="stat-number" style={{ fontSize: 14, color: c }}>{v}</p>
                    </div>
                ))}
            </div>

            {vaultData.activeCycle ? (
                <div style={{ background: "#faf7f2", border: "1px solid #e8ddd0", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <p style={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#9b8677", letterSpacing: "0.08em", textTransform: "uppercase" }}>Active Cycle</p>
                        {!vaultData.activeCycle.settled && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 20, background: "#e8f5ef", border: "1px solid rgba(45,106,79,0.2)", fontSize: 10, color: "#2d6a4f", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                                <span className="live-dot" style={{ width: 5, height: 5 }} /> Live
                            </span>
                        )}
                    </div>
                    <Row label="Strike"     value={`$${vaultData.activeCycle.strikePrice}`}           color="#c9943a" />
                    <Row label="Collateral" value={`${vaultData.activeCycle.collateralLocked} ETH`} />
                    <Row label="Premium"    value={`${vaultData.activeCycle.premiumCollected} ETH`}   color="#2d6a4f" />
                    <Row label="Expiry"     value={vaultData.activeCycle.expiry} />
                    <Row label="Status"     value={vaultData.activeCycle.settled ? "Settled" : "Active ●"} color={vaultData.activeCycle.settled ? "#9b8677" : "#2d6a4f"} />
                </div>
            ) : (
                <div style={{ textAlign: "center", padding: "18px 14px", borderRadius: 10, border: "1px dashed #e8ddd0" }}>
                    <p style={{ fontSize: 12, color: "#c4b5a8", fontFamily: "'DM Sans', sans-serif" }}>No active option cycle</p>
                </div>
            )}
        </div>
    );
}