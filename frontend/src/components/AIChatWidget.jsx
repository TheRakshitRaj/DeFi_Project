import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";

const AI_API_BASE = "http://localhost:8000";

// ── Logo mark (small) ────────────────────────────────────────
const LogoMark = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
        <defs>
            <linearGradient id="clg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#e8b86d" />
                <stop offset="100%" stopColor="#c9943a" />
            </linearGradient>
        </defs>
        <circle cx="28" cy="28" r="26" stroke="url(#clg)" strokeWidth="1.5" fill="rgba(201,148,58,0.08)" />
        <path d="M18 18 L28 38 L38 18" stroke="url(#clg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="28" cy="38" r="2.5" fill="url(#clg)" />
    </svg>
);

const QUICK = [
    "What's the optimal strike price now?",
    "Explain the current volatility regime",
    "Should I deposit more ETH?",
    "How is APY calculated?",
];

const SYSTEM = `You are DynVault's AI strategy assistant — an expert in DeFi options vaults, covered call strategies, and ETH volatility. 
You help users understand their vault position, strategy decisions, and market conditions.
Be concise, precise, and use DeFi terminology naturally. Keep answers under 120 words.
Format numbers clearly. If asked about strikes/prices, give concrete numbers when possible.`;

export default function AIChatWidget({ currentPrice, strategyData, vaultData }) {
    const [open,     setOpen]     = useState(false);
    const [messages, setMessages] = useState([
        { role: "assistant", text: "Hello! I'm your DynVault strategy assistant. Ask me anything about your vault position, strike prices, or market conditions." }
    ]);
    const [input,    setInput]    = useState("");
    const [thinking, setThinking] = useState(false);

    const panelRef  = useRef(null);
    const btnRef    = useRef(null);
    const msgsRef   = useRef(null);
    const inputRef  = useRef(null);

    // Panel open/close animation
    useEffect(() => {
        if (!panelRef.current) return;
        if (open) {
            gsap.fromTo(panelRef.current,
                { opacity: 0, y: 24, scale: 0.95, transformOrigin: "bottom right" },
                { opacity: 1, y: 0,  scale: 1,    duration: 0.4, ease: "back.out(1.4)" }
            );
            setTimeout(() => inputRef.current?.focus(), 450);
        } else {
            gsap.to(panelRef.current,
                { opacity: 0, y: 16, scale: 0.95, duration: 0.25, ease: "power2.in" }
            );
        }
    }, [open]);

    // Scroll to bottom on new message
    useEffect(() => {
        if (msgsRef.current) {
            msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
        }
    }, [messages]);

    const toggleOpen = () => {
        // Button spring
        gsap.fromTo(btnRef.current,
            { scale: 0.88 },
            { scale: 1, duration: 0.4, ease: "back.out(2.5)" }
        );
        setOpen(o => !o);
    };

    const buildContext = () =>
        `Current ETH price: $${currentPrice}. ` +
        `Vault TVL: ${vaultData?.tvl || "?"} ETH. ` +
        `APY: ${vaultData?.apy || "?"}%. ` +
        `P/L: ${vaultData?.pnl || "?"} ETH. ` +
        `Market: ${strategyData?.isHighVol ? "HIGH volatility" : "LOW volatility"}. ` +
        `Rule-based strike: $${strategyData?.strikePrice || "?"}. ` +
        `Active cycle: ${vaultData?.activeCycle ? `strike $${vaultData.activeCycle.strikePrice}, expiry ${vaultData.activeCycle.expiry}` : "none"}.`;

    const send = async (text) => {
        const msg = (text || input).trim();
        if (!msg) return;
        setInput("");
        setMessages(prev => [...prev, { role: "user", text: msg }]);
        setThinking(true);

        try {
            const history = messages.map(m => ({
                role: m.role === "assistant" ? "assistant" : "user",
                content: m.text,
            }));

            const res = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514",
                    max_tokens: 300,
                    system: SYSTEM + "\n\nVault context: " + buildContext(),
                    messages: [...history, { role: "user", content: msg }],
                }),
            });

            const data = await res.json();
            const reply = data.content?.[0]?.text || "Sorry, I couldn't get a response right now.";
            setMessages(prev => [...prev, { role: "assistant", text: reply }]);
        } catch {
            setMessages(prev => [...prev, { role: "assistant", text: "⚠️ Couldn't connect to AI. Check your API key or network." }]);
        } finally {
            setThinking(false);
        }
    };

    const onKey = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    };

    return (
        <>
            {/* ── Chat Panel ── */}
            {open && (
                <div ref={panelRef} style={{
                    position: "fixed", bottom: 88, right: 24, zIndex: 999,
                    width: 360, maxHeight: 520,
                    background: "#fffcf8",
                    border: "1px solid #e8ddd0",
                    borderRadius: 18,
                    boxShadow: "0 24px 64px rgba(61,31,10,0.18), 0 4px 16px rgba(61,31,10,0.08)",
                    display: "flex", flexDirection: "column",
                    overflow: "hidden",
                    opacity: 0,
                }}>
                    {/* Header */}
                    <div style={{
                        padding: "14px 18px",
                        background: "linear-gradient(135deg, #3d1f0a, #5c3318)",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        flexShrink: 0,
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <LogoMark size={28} />
                            <div>
                                <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 15, color: "#fff", lineHeight: 1 }}>
                                    DynVault AI
                                </p>
                                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "rgba(232,184,109,0.7)", marginTop: 2, letterSpacing: "0.06em" }}>
                                    Strategy Assistant
                                </p>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {/* Live context badge */}
                            <div style={{
                                display: "flex", alignItems: "center", gap: 4,
                                padding: "3px 8px", borderRadius: 20,
                                background: "rgba(201,148,58,0.15)", border: "1px solid rgba(201,148,58,0.25)",
                                fontSize: 9, fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                                color: "#e8b86d", letterSpacing: "0.06em",
                            }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#e8b86d", boxShadow: "0 0 6px #e8b86d80", display: "inline-block" }} />
                                LIVE CONTEXT
                            </div>
                            <button onClick={() => setOpen(false)} style={{
                                width: 26, height: 26, borderRadius: 8, border: "none",
                                background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)",
                                cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "background 0.2s",
                            }}
                                onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.2)"}
                                onMouseLeave={e => e.target.style.background = "rgba(255,255,255,0.1)"}
                            >✕</button>
                        </div>
                    </div>

                    {/* Context strip */}
                    <div style={{
                        padding: "8px 16px",
                        background: "rgba(201,148,58,0.05)",
                        borderBottom: "1px solid rgba(201,148,58,0.1)",
                        display: "flex", alignItems: "center", gap: 12,
                        flexShrink: 0,
                    }}>
                        {[
                            { l: "ETH", v: `$${Number(currentPrice).toLocaleString()}` },
                            { l: "APY", v: `${vaultData?.apy || "—"}%` },
                            { l: "Vol", v: strategyData?.isHighVol ? "HIGH" : "LOW" },
                        ].map(({ l, v }) => (
                            <div key={l} style={{ textAlign: "center" }}>
                                <p style={{ fontSize: 9, color: "#9b8677", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{l}</p>
                                <p style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", fontWeight: 500, color: "#3d1f0a" }}>{v}</p>
                            </div>
                        ))}
                    </div>

                    {/* Messages */}
                    <div ref={msgsRef} style={{
                        flex: 1, overflowY: "auto", padding: "14px 16px",
                        display: "flex", flexDirection: "column", gap: 10,
                        minHeight: 0,
                    }}>
                        {messages.map((m, i) => (
                            <div key={i} style={{
                                display: "flex",
                                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                            }}>
                                {m.role === "assistant" && (
                                    <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg,#c9943a,#b8822a)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 8, marginTop: 2 }}>
                                        <LogoMark size={14} />
                                    </div>
                                )}
                                <div style={{
                                    maxWidth: "78%",
                                    padding: "10px 13px",
                                    borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                                    background: m.role === "user"
                                        ? "linear-gradient(135deg, #3d1f0a, #5c3318)"
                                        : "#fff",
                                    border: m.role === "user" ? "none" : "1px solid #e8ddd0",
                                    color: m.role === "user" ? "#fff" : "#1e0e04",
                                    fontSize: 13,
                                    fontFamily: "'DM Sans', sans-serif",
                                    lineHeight: 1.55,
                                    boxShadow: m.role === "user"
                                        ? "0 2px 8px rgba(61,31,10,0.2)"
                                        : "0 1px 4px rgba(61,31,10,0.06)",
                                }}>
                                    {m.text}
                                </div>
                            </div>
                        ))}

                        {/* Thinking bubble */}
                        {thinking && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg,#c9943a,#b8822a)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <LogoMark size={14} />
                                </div>
                                <div style={{
                                    padding: "10px 14px", borderRadius: "14px 14px 14px 4px",
                                    background: "#fff", border: "1px solid #e8ddd0",
                                    display: "flex", alignItems: "center", gap: 5,
                                }}>
                                    {[0, 0.2, 0.4].map(d => (
                                        <span key={d} style={{
                                            width: 6, height: 6, borderRadius: "50%",
                                            background: "#c9943a", display: "inline-block",
                                            animation: `bounce 1.2s ease-in-out ${d}s infinite`,
                                        }} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick prompts */}
                    <div style={{
                        padding: "8px 12px",
                        borderTop: "1px solid #f0e8dc",
                        display: "flex", gap: 5, flexWrap: "wrap",
                        flexShrink: 0,
                    }}>
                        {QUICK.map((q, i) => (
                            <button key={i} onClick={() => send(q)} style={{
                                fontSize: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                                padding: "4px 9px", borderRadius: 20, cursor: "pointer",
                                background: "rgba(201,148,58,0.08)", border: "1px solid rgba(201,148,58,0.2)",
                                color: "#8a6020", transition: "all 0.15s ease",
                                whiteSpace: "nowrap",
                            }}
                                onMouseEnter={e => { e.target.style.background = "rgba(201,148,58,0.15)"; e.target.style.borderColor = "rgba(201,148,58,0.35)"; }}
                                onMouseLeave={e => { e.target.style.background = "rgba(201,148,58,0.08)"; e.target.style.borderColor = "rgba(201,148,58,0.2)"; }}
                            >{q}</button>
                        ))}
                    </div>

                    {/* Input */}
                    <div style={{
                        padding: "10px 14px 14px",
                        borderTop: "1px solid #f0e8dc",
                        display: "flex", gap: 8, alignItems: "flex-end",
                        flexShrink: 0,
                    }}>
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={onKey}
                            placeholder="Ask about your vault strategy…"
                            rows={1}
                            style={{
                                flex: 1, resize: "none", background: "#faf7f2",
                                border: "1.5px solid #e8ddd0", borderRadius: 10,
                                padding: "9px 12px", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                                color: "#1e0e04", outline: "none", maxHeight: 80,
                                transition: "border-color 0.2s",
                            }}
                            onFocus={e => e.target.style.borderColor = "#c9943a"}
                            onBlur={e => e.target.style.borderColor = "#e8ddd0"}
                        />
                        <button
                            onClick={() => send()}
                            disabled={!input.trim() || thinking}
                            style={{
                                width: 38, height: 38, borderRadius: 10, border: "none",
                                background: input.trim() ? "linear-gradient(135deg,#c9943a,#b8822a)" : "#f0e8dc",
                                color: input.trim() ? "#fff" : "#c4b5a8",
                                cursor: input.trim() ? "pointer" : "default",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 16, flexShrink: 0,
                                transition: "all 0.2s",
                                boxShadow: input.trim() ? "0 2px 8px rgba(201,148,58,0.3)" : "none",
                            }}
                        >↑</button>
                    </div>
                </div>
            )}

            {/* ── FAB Button ── */}
            <button ref={btnRef} onClick={toggleOpen} style={{
                position: "fixed", bottom: 24, right: 24, zIndex: 1000,
                width: 56, height: 56, borderRadius: 18, border: "none",
                background: "linear-gradient(135deg, #3d1f0a, #5c3318)",
                boxShadow: open
                    ? "0 4px 20px rgba(61,31,10,0.35)"
                    : "0 8px 28px rgba(61,31,10,0.3), 0 0 0 1px rgba(201,148,58,0.2)",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "box-shadow 0.3s ease",
            }}
                onMouseEnter={e => {
                    gsap.to(e.currentTarget, { scale: 1.08, duration: 0.2, ease: "power2.out" });
                    e.currentTarget.style.boxShadow = "0 12px 36px rgba(61,31,10,0.4), 0 0 0 1px rgba(201,148,58,0.35)";
                }}
                onMouseLeave={e => {
                    gsap.to(e.currentTarget, { scale: 1, duration: 0.2, ease: "power2.out" });
                    e.currentTarget.style.boxShadow = "0 8px 28px rgba(61,31,10,0.3), 0 0 0 1px rgba(201,148,58,0.2)";
                }}
            >
                {open ? (
                    <span style={{ color: "rgba(232,184,109,0.8)", fontSize: 20, lineHeight: 1 }}>✕</span>
                ) : (
                    <LogoMark size={30} />
                )}
                {/* Notification dot when closed */}
                {!open && (
                    <div style={{
                        position: "absolute", top: 10, right: 10,
                        width: 9, height: 9, borderRadius: "50%",
                        background: "#c9943a",
                        border: "1.5px solid #5c3318",
                        boxShadow: "0 0 8px rgba(201,148,58,0.8)",
                        animation: "pulsedot 2s ease-in-out infinite",
                    }} />
                )}
            </button>

            <style>{`
                @keyframes bounce {
                    0%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-5px); }
                }
                @keyframes pulsedot {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.3); opacity: 0.7; }
                }
            `}</style>
        </>
    );
}