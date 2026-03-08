import { useState, useRef } from "react";
import { gsap } from "gsap";
import { useCardHover } from "../App";
import { useAIStrategy } from "../hooks/useAIStrategy";
import { getVaultContract } from "../utils/contractHelpers";

const ConfBar = ({ value }) => {
    const pct   = Math.round(value * 100);
    const color = pct >= 75 ? "#2d6a4f" : pct >= 55 ? "#8a6020" : "#b85c38";
    const bg    = pct >= 75 ? "rgba(45,106,79,0.9)" : pct >= 55 ? "rgba(138,96,32,0.9)" : "rgba(184,92,56,0.9)";
    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 10, color: "#9b8677", fontFamily: "'DM Sans', sans-serif", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>Confidence</span>
                <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", fontWeight: 500, color }}>{pct}%</span>
            </div>
            <div className="conf-track"><div className="conf-fill" style={{ width: `${pct}%`, background: bg }} /></div>
        </div>
    );
};

const RiskBadge = ({ level }) => {
    const cfg = { LOW: { bg: "rgba(45,106,79,0.08)", bd: "rgba(45,106,79,0.2)", c: "#2d6a4f" }, MEDIUM: { bg: "rgba(138,96,32,0.08)", bd: "rgba(138,96,32,0.2)", c: "#8a6020" }, HIGH: { bg: "rgba(184,92,56,0.08)", bd: "rgba(184,92,56,0.2)", c: "#b85c38" } };
    const s = cfg[level] || cfg.MEDIUM;
    return <span style={{ background: s.bg, border: `1px solid ${s.bd}`, color: s.c, fontSize: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, padding: "3px 9px", borderRadius: 20, letterSpacing: "0.07em" }}>{level} RISK</span>;
};

export default function AIStrategyPanel({ currentPrice, strategyData, onStrikeUpdate }) {
    const volatility = strategyData?.isHighVol ? 0.055 : 0.025;
    const { aiData, refetch } = useAIStrategy(currentPrice, volatility, onStrikeUpdate);
    const [txStatus, setTxStatus] = useState(null);
    const [applying, setApplying] = useState(false);
    const cardRef = useRef(null);
    const btnRef  = useRef(null);
    useCardHover(cardRef);

    const apply = async () => {
        if (!aiData.recommended_strike) return;
        gsap.fromTo(btnRef.current, { scale: 0.96 }, { scale: 1, duration: 0.3, ease: "back.out(2)" });
        setApplying(true); setTxStatus(null);
        try {
            const vault = await getVaultContract(true);
            const tx    = await vault.writeCoveredCallWithStrike(Math.round(aiData.recommended_strike * 1e8), 604800);
            await tx.wait();
            setTxStatus({ ok: true, msg: `✅ Covered call written at $${aiData.recommended_strike}` });
        } catch (err) {
            setTxStatus({ ok: false, msg: `❌ ${err.reason || err.message}` });
        } finally { setApplying(false); }
    };

    return (
        <div ref={cardRef} className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                    <h2 className="heading" style={{ fontSize: 17 }}>AI Strategy Engine</h2>
                    <p style={{ fontSize: 11, color: "#9b8677", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>Random Forest · updates every 30s</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, fontSize: 16, background: aiData.serviceOnline ? "rgba(45,106,79,0.08)" : "rgba(184,92,56,0.08)", border: aiData.serviceOnline ? "1px solid rgba(45,106,79,0.18)" : "1px solid rgba(184,92,56,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>🤖</div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: aiData.serviceOnline ? "#e8f5ef" : "#fdf0eb", border: aiData.serviceOnline ? "1px solid rgba(45,106,79,0.2)" : "1px solid rgba(184,92,56,0.2)", fontSize: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: aiData.serviceOnline ? "#2d6a4f" : "#b85c38", letterSpacing: "0.07em" }}>
                        <span className={aiData.serviceOnline ? "live-dot" : "live-dot live-dot-red"} style={{ width: 5, height: 5 }} />
                        {aiData.serviceOnline ? "ONLINE" : "OFFLINE"}
                    </span>
                </div>
            </div>

            {!aiData.serviceOnline && (
                <div style={{ background: "#fdf0eb", border: "1px solid rgba(184,92,56,0.2)", borderRadius: 10, padding: 14, marginBottom: 14 }}>
                    <p style={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#b85c38", marginBottom: 4 }}>AI Service Not Running</p>
                    <p style={{ fontSize: 11, color: "#9b8677", fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>Start the Python API:</p>
                    <div className="code-block" style={{ fontSize: 11 }}>cd ai-strategy && source venv/bin/activate && python3 api.py</div>
                    <button onClick={refetch} style={{ marginTop: 10, fontSize: 11, color: "#c9943a", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, padding: 0 }}>Retry connection →</button>
                </div>
            )}

            {aiData.loading && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", color: "#9b8677", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                    <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #e8ddd0", borderTopColor: "#c9943a", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                    Fetching AI recommendation…
                </div>
            )}

            {aiData.serviceOnline && !aiData.loading && aiData.recommended_strike && (
                <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                        <div style={{ background: "#faf7f2", border: "1px solid #e8ddd0", borderRadius: 10, padding: "10px 12px" }}>
                            <p style={{ fontSize: 10, color: "#9b8677", fontFamily: "'DM Sans', sans-serif", fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 3 }}>ETH Price</p>
                            <p className="stat-number" style={{ fontSize: 16, color: "#2d5986" }}>${Number(currentPrice).toLocaleString()}</p>
                        </div>
                        <div style={{ background: "#faf7f2", border: "1px solid #e8ddd0", borderRadius: 10, padding: "10px 12px" }}>
                            <p style={{ fontSize: 10, color: "#9b8677", fontFamily: "'DM Sans', sans-serif", fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 3 }}>Volatility</p>
                            <p className="stat-number" style={{ fontSize: 16, color: "#8a6020" }}>{(volatility*100).toFixed(1)}%</p>
                        </div>
                    </div>

                    <div style={{ background: "linear-gradient(135deg, rgba(201,148,58,0.07), rgba(201,148,58,0.02))", border: "1px solid rgba(201,148,58,0.22)", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                            <div>
                                <p style={{ fontSize: 10, color: "#9b8677", fontFamily: "'DM Sans', sans-serif", fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 4 }}>Recommended Strike</p>
                                <p className="stat-number" style={{ fontSize: 28, color: "#3d1f0a", lineHeight: 1 }}>${aiData.recommended_strike.toLocaleString()}</p>
                            </div>
                            <RiskBadge level={aiData.risk_level || "MEDIUM"} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 12 }}>
                            <span style={{ color: "#9b8677", fontFamily: "'DM Sans', sans-serif" }}>Multiplier: <span style={{ color: "#3d1f0a", fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>{aiData.multiplier?.toFixed(3)}x</span></span>
                            <span style={{ color: "#9b8677", fontFamily: "'DM Sans', sans-serif" }}>vs rule: <span style={{ color: "#8a6020", fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>${strategyData?.isHighVol ? (Number(currentPrice)*1.20).toFixed(0) : (Number(currentPrice)*1.10).toFixed(0)}</span></span>
                        </div>
                        <ConfBar value={aiData.confidence || 0} />
                    </div>

                    <button ref={btnRef} onClick={apply} disabled={applying} className="btn-gold" style={{ width: "100%", padding: "12px", fontSize: 14, marginBottom: 10 }}>
                        {applying ? (
                            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "transparent", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                                Writing to contract…
                            </span>
                        ) : `⚡ Apply AI Strike ($${aiData.recommended_strike}) to Vault`}
                    </button>

                    {txStatus && (
                        <div style={{ padding: "10px 14px", borderRadius: 10, fontSize: 12, fontFamily: "'DM Mono', monospace", background: txStatus.ok ? "#e8f5ef" : "#fdf0eb", border: txStatus.ok ? "1px solid rgba(45,106,79,0.2)" : "1px solid rgba(184,92,56,0.2)", color: txStatus.ok ? "#2d6a4f" : "#b85c38" }}>
                            {txStatus.msg}
                        </div>
                    )}
                </>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}