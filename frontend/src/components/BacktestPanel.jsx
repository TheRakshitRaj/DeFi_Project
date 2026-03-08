import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useCardHover } from "../App";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const mock = () => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return {
        strategies: [
            { name: "Conservative", apy: (Math.random()*8+8).toFixed(1),  winRate: "72%", maxDrawdown: "-3.2%"  },
            { name: "Aggressive",   apy: (Math.random()*12+5).toFixed(1), winRate: "55%", maxDrawdown: "-12.1%" },
            { name: "Balanced",     apy: (Math.random()*10+9).toFixed(1), winRate: "64%", maxDrawdown: "-6.4%"  },
        ],
        monthlyData: months.map(m => ({ month: m, conservative: +(Math.random()*2+0.3).toFixed(2), aggressive: +(Math.random()*3-0.4).toFixed(2), balanced: +(Math.random()*2.5).toFixed(2) })),
    };
};

const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: "#fff", border: "1px solid #e8ddd0", borderRadius: 8, padding: "8px 12px", fontSize: 11, fontFamily: "'DM Mono', monospace", boxShadow: "0 4px 12px rgba(61,31,10,0.1)" }}>
            <p style={{ color: "#9b8677", fontSize: 10, marginBottom: 5, fontFamily: "'DM Sans', sans-serif', fontWeight: 500" }}>{label}</p>
            {payload.map(p => <p key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>{p.name}: <b>{p.value}%</b></p>)}
        </div>
    );
};

const COLS = {
    Conservative: { main: "#2d5986", bg: "rgba(45,89,134,0.06)",  bd: "rgba(45,89,134,0.15)"  },
    Aggressive:   { main: "#2d6a4f", bg: "rgba(45,106,79,0.06)", bd: "rgba(45,106,79,0.15)" },
    Balanced:     { main: "#8a6020", bg: "rgba(138,96,32,0.06)", bd: "rgba(138,96,32,0.15)" },
};

export default function BacktestPanel() {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [params,  setParams]  = useState({ lowVol: 110, highVol: 120, threshold: 500 });
    const cardRef  = useRef(null);
    const scRef    = useRef([]);
    useCardHover(cardRef);

    const run = async () => {
        setLoading(true);
        try {
            const r = await fetch("/backtest_results.json");
            if (!r.ok) throw new Error();
            setResults(await r.json());
        } catch { setResults(mock(params)); }
        finally { setLoading(false); }
    };

    useEffect(() => { run(); }, []);

    useEffect(() => {
        if (results && scRef.current.length) {
            gsap.fromTo(scRef.current.filter(Boolean), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.07, ease: "power2.out" });
        }
    }, [results]);

    return (
        <div ref={cardRef} className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                    <h2 className="heading" style={{ fontSize: 17 }}>Backtesting Engine</h2>
                    <p style={{ fontSize: 11, color: "#9b8677", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>Simulate performance over historical data</p>
                </div>
                <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, background: "rgba(201,148,58,0.1)", border: "1px solid rgba(201,148,58,0.25)", color: "#8a6020", fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>C++ Engine</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "flex-end", marginBottom: 16 }}>
                {[["Low Vol %","lowVol"],["High Vol %","highVol"],["Vol Threshold ($)","threshold"]].map(([l,k]) => (
                    <div key={k}>
                        <label style={{ fontSize: 10, color: "#9b8677", fontFamily: "'DM Sans', sans-serif", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>{l}</label>
                        <input type="number" value={params[k]} onChange={e => setParams(p => ({ ...p, [k]: Number(e.target.value) }))} className="warm-input" style={{ padding: "9px 12px", fontSize: 13 }} />
                    </div>
                ))}
                <button onClick={run} disabled={loading} className="btn-gold" style={{ padding: "10px 20px", fontSize: 13, whiteSpace: "nowrap" }}>
                    {loading ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "transparent", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                            Running…
                        </span>
                    ) : "▶ Run Backtest"}
                </button>
            </div>

            {results && (
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, alignItems: "start" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 155 }}>
                        {results.strategies.map((s, i) => {
                            const c = COLS[s.name] || COLS.Balanced;
                            return (
                                <div key={s.name} ref={el => scRef.current[i] = el}
                                    style={{ background: c.bg, border: `1px solid ${c.bd}`, borderRadius: 10, padding: "12px 14px", opacity: 0, transition: "transform 0.2s, box-shadow 0.2s", cursor: "default" }}
                                    onMouseEnter={e => gsap.to(e.currentTarget, { y: -2, boxShadow: "0 6px 20px rgba(61,31,10,0.1)", duration: 0.2 })}
                                    onMouseLeave={e => gsap.to(e.currentTarget, { y: 0, boxShadow: "none", duration: 0.2 })}>
                                    <p style={{ fontSize: 10, color: "#9b8677", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 6 }}>{s.name}</p>
                                    <p className="stat-number" style={{ fontSize: 22, color: c.main, marginBottom: 2 }}>{s.apy}%</p>
                                    <p style={{ fontSize: 10, color: "#9b8677", fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>APY</p>
                                    <div className="warm-divider" />
                                    <p style={{ fontSize: 11, color: "#9b8677", fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>Win: <span style={{ color: "#3d1f0a", fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>{s.winRate}</span></p>
                                    <p style={{ fontSize: 11, color: "#9b8677", fontFamily: "'DM Sans', sans-serif" }}>Max DD: <span style={{ color: "#b85c38", fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>{s.maxDrawdown}</span></p>
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ background: "#faf7f2", border: "1px solid #e8ddd0", borderRadius: 10, padding: "12px 14px" }}>
                        <p style={{ fontSize: 10, color: "#9b8677", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 10 }}>Monthly Returns (%)</p>
                        <div style={{ height: 180 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={results.monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(61,31,10,0.07)" />
                                    <XAxis dataKey="month" stroke="transparent" tick={{ fontSize: 10, fill: "#9b8677", fontFamily: "DM Sans" }} />
                                    <YAxis stroke="transparent" tick={{ fontSize: 10, fill: "#9b8677", fontFamily: "DM Mono" }} />
                                    <Tooltip content={<Tip />} />
                                    <Legend wrapperStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, paddingTop: 8 }} />
                                    <Line type="monotone" dataKey="conservative" stroke="#2d5986" strokeWidth={2} dot={false} activeDot={{ r:3, fill:"#2d5986", strokeWidth:0 }} name="Conservative" />
                                    <Line type="monotone" dataKey="aggressive"   stroke="#2d6a4f" strokeWidth={2} dot={false} activeDot={{ r:3, fill:"#2d6a4f",   strokeWidth:0 }} name="Aggressive"   />
                                    <Line type="monotone" dataKey="balanced"     stroke="#8a6020" strokeWidth={2} dot={false} activeDot={{ r:3, fill:"#8a6020",     strokeWidth:0 }} name="Balanced"     />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}