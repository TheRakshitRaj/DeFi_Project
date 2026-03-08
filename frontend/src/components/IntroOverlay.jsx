import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const STEPS = [
    { icon: "◈", num: "01", title: "Connect Wallet",   desc: "Link MetaMask to authenticate on-chain",         color: "#c9943a" },
    { icon: "◆", num: "02", title: "Deposit ETH",       desc: "Add collateral to the vault as backing",          color: "#e8b86d" },
    { icon: "◉", num: "03", title: "AI Picks Strike",   desc: "Random Forest model optimises your strike price", color: "#c9943a" },
    { icon: "✦", num: "04", title: "Earn Yield",        desc: "Premiums collected automatically each cycle",     color: "#e8b86d" },
];

// ── SVG Logo Mark ──────────────────────────────────────────
const LogoMark = ({ size = 56 }) => (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
        <defs>
            <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#e8b86d" />
                <stop offset="100%" stopColor="#c9943a" />
            </linearGradient>
            <linearGradient id="lg2" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#c9943a" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#e8b86d" stopOpacity="0.1" />
            </linearGradient>
        </defs>
        {/* Outer ring */}
        <circle cx="28" cy="28" r="26" stroke="url(#lg1)" strokeWidth="1.2" fill="url(#lg2)" />
        {/* Inner hexagon */}
        <polygon points="28,10 42,19 42,37 28,46 14,37 14,19" fill="none" stroke="url(#lg1)" strokeWidth="1" opacity="0.5" />
        {/* Bold V */}
        <path d="M18 18 L28 38 L38 18" stroke="url(#lg1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Center dot */}
        <circle cx="28" cy="38" r="2" fill="url(#lg1)" />
    </svg>
);

export default function IntroOverlay({ onDone }) {
    const overlayRef = useRef(null);
    const logoRef    = useRef(null);
    const lineRef    = useRef(null);
    const tagRef     = useRef(null);
    const stepsRef   = useRef([]);
    const skipRef    = useRef(null);
    const barRef     = useRef(null);
    const glowRef    = useRef(null);

    useEffect(() => {
        const tl = gsap.timeline({ onComplete: dismiss });

        // Glow pulse
        tl.fromTo(glowRef.current,
            { scale: 0, opacity: 0 },
            { scale: 1, opacity: 1, duration: 1.2, ease: "power2.out" }
        );

        // Logo drops + bounces
        tl.fromTo(logoRef.current,
            { opacity: 0, y: 30, scale: 0.8 },
            { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "back.out(1.6)" },
            "-=0.8"
        );

        // Gold line expands
        tl.fromTo(lineRef.current,
            { scaleX: 0 },
            { scaleX: 1, duration: 0.6, ease: "power3.inOut" },
            "-=0.2"
        );

        // Tagline
        tl.fromTo(tagRef.current,
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
            "-=0.15"
        );

        // Steps stagger with blur
        tl.fromTo(stepsRef.current,
            { opacity: 0, x: -24, filter: "blur(4px)" },
            { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.45, stagger: 0.1, ease: "power2.out" },
            "-=0.1"
        );

        // Skip
        tl.fromTo(skipRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 0.3 },
            "-=0.1"
        );

        // Progress bar
        tl.fromTo(barRef.current,
            { scaleX: 0 },
            { scaleX: 1, duration: 4.2, ease: "none", transformOrigin: "left" },
            "-=0.3"
        );

        return () => tl.kill();
    }, []);

    const dismiss = () => {
        gsap.to(overlayRef.current, {
            y: "-100%",
            duration: 1.0,
            ease: "power4.inOut",
            onComplete: onDone,
        });
    };

    return (
        <div ref={overlayRef} style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "#09060d",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            overflow: "hidden",
        }}>
            {/* Ambient glow */}
            <div ref={glowRef} style={{
                position: "absolute",
                width: 600, height: 600,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(201,148,58,0.12) 0%, rgba(201,148,58,0.03) 40%, transparent 70%)",
                top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
            }} />

            {/* Subtle grid */}
            <div style={{
                position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.4,
                backgroundImage: "linear-gradient(rgba(201,148,58,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,148,58,0.04) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
            }} />

            {/* Corner ornaments */}
            {[
                { top: 24, left: 24, rotate: 0 },
                { top: 24, right: 24, rotate: 90 },
                { bottom: 24, right: 24, rotate: 180 },
                { bottom: 24, left: 24, rotate: 270 },
            ].map((s, i) => (
                <div key={i} style={{ position: "absolute", ...s, width: 20, height: 20, opacity: 0.3 }}>
                    <svg viewBox="0 0 20 20" fill="none">
                        <path d="M0 10 L0 0 L10 0" stroke="#c9943a" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                </div>
            ))}

            {/* Progress bar */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "rgba(201,148,58,0.1)" }}>
                <div ref={barRef} style={{
                    height: "100%",
                    background: "linear-gradient(90deg, #c9943a, #e8b86d, #c9943a)",
                    transformOrigin: "left", scaleX: 0,
                    boxShadow: "0 0 12px rgba(201,148,58,0.7)",
                }} />
            </div>

            {/* Content */}
            <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 440, padding: "0 28px" }}>

                {/* Logo */}
                <div ref={logoRef} style={{ textAlign: "center", marginBottom: 24, opacity: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 4 }}>
                        <LogoMark size={52} />
                        <div style={{ textAlign: "left" }}>
                            <h1 style={{
                                fontFamily: "'Playfair Display', serif",
                                fontWeight: 800, fontSize: 42,
                                background: "linear-gradient(135deg, #e8b86d 0%, #c9943a 50%, #e8b86d 100%)",
                                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                                letterSpacing: "-0.02em", lineHeight: 1,
                            }}>DynVault</h1>
                            <p style={{
                                fontFamily: "'DM Mono', monospace",
                                fontSize: 10, color: "rgba(201,148,58,0.5)",
                                letterSpacing: "0.22em", textTransform: "uppercase",
                                marginTop: 4,
                            }}>ETH OPTIONS VAULT</p>
                        </div>
                    </div>
                </div>

                {/* Gold line */}
                <div ref={lineRef} style={{
                    height: 1,
                    background: "linear-gradient(90deg, transparent, #c9943a, transparent)",
                    transformOrigin: "center", scaleX: 0, marginBottom: 16,
                }} />

                {/* Tagline */}
                <p ref={tagRef} style={{
                    textAlign: "center", fontSize: 11,
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 500, letterSpacing: "0.2em",
                    textTransform: "uppercase", color: "rgba(201,148,58,0.45)",
                    marginBottom: 22, opacity: 0,
                }}>
                    How it works
                </p>

                {/* Steps */}
                <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 26 }}>
                    {STEPS.map((s, i) => (
                        <div key={i} ref={el => stepsRef.current[i] = el} style={{
                            background: "rgba(255,255,255,0.03)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid rgba(201,148,58,0.12)",
                            borderRadius: 12,
                            padding: "12px 16px",
                            display: "flex", alignItems: "center", gap: 14,
                            opacity: 0, position: "relative", overflow: "hidden",
                        }}>
                            {/* Shimmer top line */}
                            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${s.color}40, transparent)` }} />
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(201,148,58,0.4)", width: 18, flexShrink: 0 }}>{s.num}</span>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                background: `rgba(201,148,58,0.08)`, border: `1px solid rgba(201,148,58,0.15)`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 15, color: s.color,
                                fontFamily: "'Playfair Display', serif",
                            }}>{s.icon}</div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, color: "rgba(255,255,255,0.88)", marginBottom: 2 }}>{s.title}</p>
                                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{s.desc}</p>
                            </div>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, boxShadow: `0 0 8px ${s.color}80`, flexShrink: 0 }} />
                        </div>
                    ))}
                </div>

                {/* Skip */}
                <div ref={skipRef} style={{ textAlign: "center", opacity: 0 }}>
                    <button onClick={dismiss} style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500,
                        letterSpacing: "0.15em", textTransform: "uppercase",
                        color: "rgba(201,148,58,0.35)", background: "none", border: "none",
                        cursor: "pointer", padding: "6px 12px", transition: "color 0.2s",
                    }}
                        onMouseEnter={e => e.target.style.color = "#c9943a"}
                        onMouseLeave={e => e.target.style.color = "rgba(201,148,58,0.35)"}
                    >Skip intro →</button>
                </div>
            </div>
        </div>
    );
}