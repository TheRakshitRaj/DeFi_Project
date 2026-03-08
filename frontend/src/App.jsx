import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import IntroOverlay from "./components/IntroOverlay";
import DepositPanel from "./components/DepositPanel";
import VaultDashboard from "./components/VaultDashboard";
import StrategyMonitor from "./components/StrategyMonitor";
import BacktestPanel from "./components/BacktestPanel";
import AIStrategyPanel from "./components/AIStrategyPanel";
import AIChatWidget from "./components/AIChatWidget";
import { useVault } from "./hooks/useVault";
import { getProvider } from "./utils/contractHelpers";

// ── Shared logo mark SVG ─────────────────────────────────────
export const LogoMark = ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
        <defs>
            <linearGradient id="hlg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#e8b86d" />
                <stop offset="100%" stopColor="#c9943a" />
            </linearGradient>
        </defs>
        <circle cx="28" cy="28" r="26" stroke="url(#hlg)" strokeWidth="1.2" fill="rgba(201,148,58,0.06)" />
        <polygon points="28,10 42,19 42,37 28,46 14,37 14,19" fill="none" stroke="url(#hlg)" strokeWidth="0.8" opacity="0.35" />
        <path d="M18 18 L28 38 L38 18" stroke="url(#hlg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="28" cy="38" r="2" fill="url(#hlg)" />
    </svg>
);

// ── Card hover hook ──────────────────────────────────────────
export function useCardHover(ref) {
    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const onEnter = () => {
            gsap.to(el, {
                y: -4,
                boxShadow: "0 16px 48px rgba(61,31,10,0.14), 0 4px 16px rgba(61,31,10,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
                duration: 0.3, ease: "power2.out",
            });
        };
        const onLeave = () => {
            gsap.to(el, {
                y: 0,
                boxShadow: "0 2px 12px rgba(61,31,10,0.06), 0 1px 3px rgba(61,31,10,0.04)",
                duration: 0.35, ease: "power2.out",
            });
        };

        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
        return () => {
            el.removeEventListener("mouseenter", onEnter);
            el.removeEventListener("mouseleave", onLeave);
        };
    }, [ref]);
}

export default function App() {
    const [account,   setAccount]   = useState(null);
    const [aiStrike,  setAiStrike]  = useState(null);
    const [showIntro, setShowIntro] = useState(true);

    const headerRef = useRef(null);
    const rowRefs   = useRef([]);

    const { vault, strategy, loading, deposit, withdraw } = useVault(account);

    const connect = async () => {
        try {
            const p    = getProvider();
            const accs = await p.send("eth_requestAccounts", []);
            setAccount(accs[0]);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on("accountsChanged", a => setAccount(a[0] || null));
        }
    }, []);

    const handleIntroDone = () => {
        setShowIntro(false);
        gsap.fromTo(headerRef.current,
            { y: -48, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }
        );
        gsap.fromTo(rowRefs.current.filter(Boolean),
            { y: 44, opacity: 0, scale: 0.97 },
            { y: 0, opacity: 1, scale: 1, duration: 0.65, stagger: 0.12, ease: "power3.out", delay: 0.25 }
        );
    };

    const pnl   = parseFloat(vault.pnl);
    const pnlUp = pnl >= 0;

    return (
        <>
            {showIntro && <IntroOverlay onDone={handleIntroDone} />}

            <div style={{ display: showIntro ? "none" : "block", minHeight: "100vh", background: "#faf7f2" }}>
                {/* Background texture */}
                <div className="bg-texture" />

                {/* ── HEADER ─────────────────────────────── */}
                <header ref={headerRef} className="site-header" style={{ opacity: 0 }}>
                    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

                        {/* Brand — new logo */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <LogoMark size={34} />
                            <div>
                                <h1 style={{
                                    fontFamily: "'Playfair Display', serif",
                                    fontWeight: 800, fontSize: 20,
                                    background: "linear-gradient(135deg, #3d1f0a 0%, #7a4520 100%)",
                                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                                    backgroundClip: "text",
                                    lineHeight: 1, letterSpacing: "-0.01em",
                                }}>DynVault</h1>
                                <p style={{ fontSize: 10, color: "#9b8677", fontFamily: "'DM Mono', monospace", marginTop: 2, letterSpacing: "0.1em" }}>
                                    ETH OPTIONS VAULT
                                </p>
                            </div>
                        </div>

                        {/* Inline stats strip (xl screens) */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }} className="hidden xl:flex">
                            {[
                                { l: "TVL",    v: `${Number(vault.tvl).toFixed(3)} ETH`,               c: "#2d5986" },
                                { l: "APY",    v: `${vault.apy}%`,                                       c: "#2d6a4f" },
                                { l: "P/L",    v: `${pnlUp?"+":""}${pnl.toFixed(3)} ETH`,               c: pnlUp?"#2d6a4f":"#b85c38" },
                                { l: "Cycles", v: vault.cycleCount,                                       c: "#8a6020" },
                            ].map(({ l, v, c }) => (
                                <div key={l} style={{ padding: "5px 12px", borderRadius: 8, background: "#fff", border: "1px solid #e8ddd0", boxShadow: "0 1px 3px rgba(61,31,10,0.04)", minWidth: 82, textAlign: "center" }}>
                                    <span style={{ fontSize: 9, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, color: "#9b8677", letterSpacing: "0.09em", textTransform: "uppercase", display: "block" }}>{l}</span>
                                    <span style={{ fontSize: 13, fontFamily: "'DM Mono', monospace", fontWeight: 500, color: c, marginTop: 1, display: "block" }}>{v}</span>
                                </div>
                            ))}
                        </div>

                        {/* Right controls */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "#e8f5ef", border: "1px solid rgba(45,106,79,0.2)", borderRadius: 20, fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#2d6a4f" }} className="hidden sm:flex">
                                <span className="live-dot" style={{ width: 6, height: 6 }} />
                                Live Feed
                            </div>
                            <div style={{ padding: "5px 10px", borderRadius: 20, fontSize: 11, background: "rgba(201,148,58,0.1)", border: "1px solid rgba(201,148,58,0.25)", color: "#8a6020", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }} className="hidden md:block">
                                ◈ Sepolia
                            </div>
                            <button
                                className="btn-gold"
                                onClick={connect}
                                style={{ padding: "8px 18px", fontSize: 13, minWidth: 130 }}
                                onMouseEnter={e => gsap.to(e.currentTarget, { scale: 1.03, duration: 0.2 })}
                                onMouseLeave={e => gsap.to(e.currentTarget, { scale: 1, duration: 0.2 })}
                            >
                                {account ? (
                                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2d6a4f", display: "inline-block", boxShadow: "0 0 6px #2d6a4f" }} />
                                        {account.slice(0,6)}…{account.slice(-4)}
                                    </span>
                                ) : "Connect Wallet"}
                            </button>
                        </div>
                    </div>
                </header>

                {/* ── MAIN ────────────────────────────────── */}
                <main className="dashboard-scroll relative z-10" style={{ maxWidth: 1400, margin: "0 auto", padding: "16px 20px 20px" }}>

                    {/* Mobile stats bar */}
                    <div ref={el => rowRefs.current[0] = el} style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14, opacity: 0 }} className="xl:hidden">
                        {[
                            { l: "TVL",    v: `${Number(vault.tvl).toFixed(3)} ETH`, c: "#2d5986" },
                            { l: "APY",    v: `${vault.apy}%`,                        c: "#2d6a4f" },
                            { l: "P/L",    v: `${pnlUp?"+":""}${pnl.toFixed(3)} ETH`, c: pnlUp?"#2d6a4f":"#b85c38" },
                            { l: "Cycles", v: vault.cycleCount,                        c: "#8a6020" },
                        ].map(({ l, v, c }) => (
                            <div key={l} className="stat-pill">
                                <p className="label" style={{ marginBottom: 4 }}>{l}</p>
                                <p className="stat-number" style={{ fontSize: 15, color: c }}>{v}</p>
                            </div>
                        ))}
                    </div>

                    {/* Row 1 — 3 panels */}
                    <div ref={el => rowRefs.current[1] = el} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12, opacity: 0 }}>
                        <DepositPanel    deposit={deposit} withdraw={withdraw} loading={loading} userBalance={vault.userBalance} />
                        <StrategyMonitor strategyData={strategy} aiRecommendedStrike={aiStrike} />
                        <AIStrategyPanel currentPrice={strategy.currentPrice} strategyData={strategy} onStrikeUpdate={setAiStrike} />
                    </div>

                    {/* Row 2 — Dashboard + Backtest */}
                    <div ref={el => rowRefs.current[2] = el} style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, opacity: 0 }}>
                        <VaultDashboard vaultData={vault} />
                        <BacktestPanel />
                    </div>

                    <p style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: "#c4b5a8", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.07em" }}>
                        DynVault · ETH Options Vault · Binance Live Price Feed
                    </p>
                </main>

                {/* ── Floating AI Chat Widget ── */}
                <AIChatWidget
                    currentPrice={strategy.currentPrice}
                    strategyData={strategy}
                    vaultData={vault}
                />
            </div>
        </>
    );
}