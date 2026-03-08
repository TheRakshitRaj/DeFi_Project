export default {
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    theme: {
        extend: {
            fontFamily: {
                display: ["'Playfair Display'", "serif"],
                mono:    ["'DM Mono'", "monospace"],
                sans:    ["'DM Sans'", "sans-serif"],
            },
            colors: {
                v: {
                    bg:       "#faf7f2",
                    surface:  "#ffffff",
                    card:     "#fffcf8",
                    border:   "#e8ddd0",
                    border2:  "#d4c4b0",
                    brown:    "#3d1f0a",
                    espresso: "#1e0e04",
                    gold:     "#c9943a",
                    gold2:    "#e8b86d",
                    sand:     "#f0e8dc",
                    muted:    "#9b8677",
                    muted2:   "#c4b5a8",
                    green:    "#2d6a4f",
                    greenl:   "#e8f5ef",
                    red:      "#b85c38",
                    redl:     "#fdf0eb",
                    blue:     "#2d5986",
                    bluel:    "#eaf0f8",
                }
            },
            boxShadow: {
                card:    "0 2px 12px rgba(61,31,10,0.07), 0 1px 3px rgba(61,31,10,0.05)",
                "card-hover": "0 8px 32px rgba(61,31,10,0.12), 0 2px 8px rgba(61,31,10,0.06)",
                gold:    "0 0 20px rgba(201,148,58,0.25)",
                inner:   "inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(61,31,10,0.04)",
            },
            backgroundImage: {
                "warm-grain":
                    "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
                "card-shine":
                    "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,252,248,0.6) 100%)",
                "gold-gradient":
                    "linear-gradient(135deg, #c9943a 0%, #e8b86d 100%)",
                "brown-gradient":
                    "linear-gradient(135deg, #3d1f0a 0%, #5c3318 100%)",
            },
            keyframes: {
                "fade-up": {
                    "0%":   { opacity: "0", transform: "translateY(16px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                shimmer: {
                    "0%":   { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
                "scale-in": {
                    "0%":   { opacity: "0", transform: "scale(0.96)" },
                    "100%": { opacity: "1", transform: "scale(1)" },
                },
                "slide-down": {
                    "0%":   { opacity: "0", transform: "translateY(-20px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "progress-fill": {
                    "0%":   { transform: "scaleX(0)" },
                    "100%": { transform: "scaleX(1)" },
                },
                "tick": {
                    "0%,100%": { opacity: "1" },
                    "50%":     { opacity: "0.4" },
                },
            },
            animation: {
                "fade-up":   "fade-up 0.5s ease forwards",
                "scale-in":  "scale-in 0.4s ease forwards",
                "slide-down":"slide-down 0.5s ease forwards",
                shimmer:     "shimmer 2s infinite",
                tick:        "tick 1.5s ease-in-out infinite",
            },
        },
    },
    plugins: [],
};