import { useState, useRef } from "react";
import { gsap } from "gsap";
import { useCardHover } from "../App";

export default function DepositPanel({ deposit, withdraw, loading, userBalance }) {
    const [amount, setAmount] = useState("");
    const [mode,   setMode]   = useState("deposit");
    const cardRef = useRef(null);
    const btnRef  = useRef(null);
    const bodyRef = useRef(null);
    useCardHover(cardRef);

    const handle = async () => {
        if (!amount || Number(amount) <= 0) return;
        gsap.fromTo(btnRef.current, { scale: 0.96 }, { scale: 1, duration: 0.3, ease: "back.out(2)" });
        mode === "deposit" ? await deposit(amount) : await withdraw(amount);
        setAmount("");
    };

    const switchMode = m => {
        if (m === mode) return;
        gsap.fromTo(bodyRef.current, { opacity: 0.6, x: m === "deposit" ? 8 : -8 }, { opacity: 1, x: 0, duration: 0.25, ease: "power2.out" });
        setMode(m);
    };

    const isDeposit = mode === "deposit";

    return (
        <div ref={cardRef} className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                    <h2 className="heading" style={{ fontSize: 17 }}>Manage Position</h2>
                    <p style={{ fontSize: 11, color: "#9b8677", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>Deposit or withdraw collateral</p>
                </div>
                <div style={{ width: 34, height: 34, borderRadius: 10, fontSize: 16, background: "linear-gradient(135deg, rgba(201,148,58,0.12), rgba(201,148,58,0.05))", border: "1px solid rgba(201,148,58,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>💰</div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, marginBottom: 14, background: "#faf7f2", border: "1px solid #e8ddd0" }}>
                <span style={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif", color: "#9b8677", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>Your Balance</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 500, color: "#3d1f0a" }}>{Number(userBalance).toFixed(4)} ETH</span>
            </div>

            <div className="tab-wrap" style={{ marginBottom: 14 }}>
                <button className={`tab-item ${mode === "deposit" ? "active" : ""}`} onClick={() => switchMode("deposit")}>↓ Deposit</button>
                <button className={`tab-item ${mode === "withdraw" ? "active" : ""}`} onClick={() => switchMode("withdraw")}>↑ Withdraw</button>
            </div>

            <div ref={bodyRef} style={{ marginBottom: 14 }}>
                <div style={{ position: "relative" }}>
                    <input type="number" placeholder="0.000" value={amount} onChange={e => setAmount(e.target.value)} className="warm-input" style={{ paddingRight: 72, fontSize: 16 }} />
                    <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 6 }}>
                        <button onClick={() => setAmount(Number(userBalance).toFixed(6))} style={{ fontSize: 9, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, padding: "3px 7px", borderRadius: 5, cursor: "pointer", background: "rgba(201,148,58,0.1)", border: "1px solid rgba(201,148,58,0.25)", color: "#8a6020", letterSpacing: "0.06em" }}>MAX</button>
                        <span style={{ fontSize: 11, color: "#9b8677", fontFamily: "'DM Mono', monospace" }}>ETH</span>
                    </div>
                </div>
                {amount && Number(amount) > 0 && (
                    <p style={{ fontSize: 11, color: "#9b8677", marginTop: 5, paddingLeft: 2, fontFamily: "'DM Sans', sans-serif" }}>≈ ${(Number(amount) * 3200).toLocaleString()} USD</p>
                )}
            </div>

            <button ref={btnRef} onClick={handle} disabled={loading || !amount || Number(amount) <= 0}
                className={isDeposit ? "btn-gold" : "btn-brown"} style={{ width: "100%", padding: "12px", fontSize: 14 }}>
                {loading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "transparent", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                        Processing…
                    </span>
                ) : isDeposit ? "↓ Deposit ETH" : "↑ Withdraw ETH"}
            </button>

            <p style={{ textAlign: "center", marginTop: 10, fontSize: 10, color: "#c4b5a8", fontFamily: "'DM Sans', sans-serif" }}>
                Transactions are final · Gas fees apply
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}