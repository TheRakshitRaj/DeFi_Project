import { useRef } from "react";
import { useCardHover } from "../App";
import { usePriceHistory } from "../hooks/usePriceHistory";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const DataRow = ({ label, value, color, badge, sub }) => (
    <div className="data-row">
        <div>
            <span style={{ fontSize: 12, color: "#9b8677", fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
            {sub && <p style={{ fontSize: 10, color: "#c4b5a8", marginTop: 1, fontFamily: "'DM Sans', sans-serif" }}>{sub}</p>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {badge}
            <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", fontWeight: 500, color: color || "#1e0e04" }}>{value}</span>
        </div>
    </div>
);

const ChartTip = ({ active, payload, chartColor }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: "#fff", border: "1px solid #e8ddd0", borderRadius: 8, padding: "7px 12px", fontSize: 11, fontFamily: "'DM Mono', monospace", boxShadow: "0 4px 12px rgba(61,31,10,0.1)" }}>
            <p style={{ color: "#9b8677", fontSize: 10, marginBottom: 2 }}>{payload[0].payload.time}</p>
            <p style={{ color: chartColor, fontWeight: 500 }}>${payload[0].value.toLocaleString()}</p>
        </div>
    );
};

export default function StrategyMonitor({ strategyData, aiRecommendedStrike }) {
    const { currentPrice, strikePrice, isHighVol } = strategyData;
    const { priceHistory, stats } = usePriceHistory(currentPrice);
    const cardRef = useRef(null);
    useCardHover(cardRef);

    const priceNum = parseFloat(currentPrice);
    const isValidPrice = priceNum > 100;
    const isUp = stats.direction === "up";
    const chartColor = isUp ? "#2d6a4f" : "#b85c38";

    return (
        <div ref={cardRef} className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                    <h2 className="heading" style={{ fontSize: 17 }}>Strategy Monitor</h2>
                    <p style={{ fontSize: 11, color: "#9b8677", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>Live market conditions</p>
                </div>
                <div className={isHighVol ? "vol-high" : "vol-low"} style={{ fontSize: 10, padding: "3px 9px" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: isHighVol ? "#b85c38" : "#2d6a4f", display: "inline-block", flexShrink: 0 }} />
                    {isHighVol ? "HIGH VOL" : "LOW VOL"}
                </div>
            </div>

            {/* Price + mini chart */}
            <div style={{ background: "#faf7f2", border: "1px solid #e8ddd0", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div>
                        <p style={{ fontSize: 10, color: "#9b8677", fontFamily: "'DM Sans', sans-serif", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>ETH / USD</p>
                        <p className="stat-number" style={{ fontSize: 22, color: "#1e0e04" }}>{isValidPrice ? `$${priceNum.toLocaleString()}` : "Loading…"}</p>
                    </div>
                    {priceHistory.length >= 2 && (
                        <div style={{ textAlign: "right" }}>
                            <p style={{ fontSize: 13, fontFamily: "'DM Mono', monospace", fontWeight: 500, color: chartColor }}>{isUp ? "▲" : "▼"} {Math.abs(parseFloat(stats.change))}%</p>
                            <p style={{ fontSize: 10, color: "#9b8677", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>H: ${parseFloat(stats.high).toLocaleString()} · L: ${parseFloat(stats.low).toLocaleString()}</p>
                        </div>
                    )}
                </div>
                {priceHistory.length >= 2 ? (
                    <div style={{ height: 64 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={priceHistory} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                                <defs>
                                    <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%"   stopColor={chartColor} stopOpacity={0.15} />
                                        <stop offset="100%" stopColor={chartColor} stopOpacity={0}    />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="time" hide />
                                <YAxis domain={["auto","auto"]} hide />
                                <Tooltip content={p => <ChartTip {...p} chartColor={chartColor} />} />
                                <Area type="monotone" dataKey="price" stroke={chartColor} strokeWidth={1.5} fill="url(#pg)" dot={false} activeDot={{ r: 3, fill: chartColor, strokeWidth: 0 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <p style={{ fontSize: 10, color: "#c4b5a8", fontFamily: "'DM Sans', sans-serif" }}>Collecting data… ({priceHistory.length}/2)</p>
                    </div>
                )}
            </div>

            <div>
                <DataRow label="Rule-Based Strike" sub="StrategyManager" value={strikePrice ? `$${parseFloat(strikePrice).toLocaleString()}` : "—"} color="#8a6020" />
                <DataRow label="AI Strike" sub="Python ML model"
                    value={aiRecommendedStrike ? `$${parseFloat(aiRecommendedStrike).toLocaleString()}` : "—"}
                    color={aiRecommendedStrike ? "#2d5986" : "#c4b5a8"}
                    badge={aiRecommendedStrike ? <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(45,89,134,0.1)", border: "1px solid rgba(45,89,134,0.2)", color: "#2d5986", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>AI</span> : null}
                />
                <DataRow label="Collateral Ratio" value={isHighVol ? "150%" : "110%"} />
                <DataRow label="Strike Multiplier" value={isHighVol ? "+20%" : "+10%"} color={isHighVol ? "#b85c38" : "#2d6a4f"}
                    badge={<span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: isHighVol ? "rgba(184,92,56,0.08)" : "rgba(45,106,79,0.08)", border: isHighVol ? "1px solid rgba(184,92,56,0.2)" : "1px solid rgba(45,106,79,0.2)", color: isHighVol ? "#b85c38" : "#2d6a4f", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 9 }}>{isHighVol ? "High Vol" : "Low Vol"}</span>}
                />
            </div>

            {strikePrice && currentPrice && (
                <div style={{ marginTop: 12, background: "#faf7f2", border: "1px solid #e8ddd0", borderRadius: 10, padding: "10px 12px" }}>
                    <p style={{ fontSize: 10, color: "#9b8677", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Strike Comparison</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div style={{ background: "rgba(201,148,58,0.06)", border: "1px solid rgba(201,148,58,0.18)", borderRadius: 8, padding: "10px", textAlign: "center" }}>
                            <p style={{ fontSize: 10, color: "#9b8677", fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>Rule-Based</p>
                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 15, fontWeight: 500, color: "#8a6020" }}>${parseFloat(strikePrice).toLocaleString()}</p>
                            <p style={{ fontSize: 10, color: "#c4b5a8", marginTop: 3 }}>+{(((parseFloat(strikePrice)-parseFloat(currentPrice))/parseFloat(currentPrice))*100).toFixed(1)}%</p>
                        </div>
                        <div style={{ background: aiRecommendedStrike ? "rgba(45,89,134,0.06)" : "rgba(0,0,0,0.02)", border: aiRecommendedStrike ? "1px solid rgba(45,89,134,0.18)" : "1px solid #e8ddd0", borderRadius: 8, padding: "10px", textAlign: "center", position: "relative" }}>
                            {aiRecommendedStrike && (
                                <div style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#c9943a,#b8822a)", color: "#fff", fontSize: 9, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, padding: "2px 8px", borderRadius: 10, whiteSpace: "nowrap" }}>✦ AI Pick</div>
                            )}
                            <p style={{ fontSize: 10, color: "#9b8677", fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>AI Model</p>
                            {aiRecommendedStrike ? (
                                <>
                                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 15, fontWeight: 500, color: "#2d5986" }}>${parseFloat(aiRecommendedStrike).toLocaleString()}</p>
                                    <p style={{ fontSize: 10, color: "#c4b5a8", marginTop: 3 }}>+{(((parseFloat(aiRecommendedStrike)-parseFloat(currentPrice))/parseFloat(currentPrice))*100).toFixed(1)}%</p>
                                </>
                            ) : <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: "#c4b5a8" }}>—</p>}
                        </div>
                    </div>
                </div>
            )}
            <p style={{ textAlign: "center", marginTop: 10, fontSize: 10, color: "#c4b5a8", fontFamily: "'DM Sans', sans-serif" }}>Updates every 5s · Binance API</p>
        </div>
    );
}