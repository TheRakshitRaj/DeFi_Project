import { usePriceHistory } from "../hooks/usePriceHistory";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from "recharts";

// ─────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────

const VolatilityBadge = ({ isHighVol }) => (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border
    ${isHighVol
            ? "bg-red-900/30 text-red-400 border-red-700/40"
            : "bg-green-900/30 text-green-400 border-green-700/40"
        }`}>
        <span className={`w-2 h-2 rounded-full animate-pulse
      ${isHighVol ? "bg-red-400" : "bg-green-400"}`}
        />
        {isHighVol ? "HIGH VOLATILITY" : "LOW VOLATILITY"}
    </div>
);

const DataRow = ({ label, value, valueColor = "text-white", badge = null, sublabel = null }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-vault-border last:border-0">
        <div>
            <span className="text-gray-400 text-sm">{label}</span>
            {sublabel && (
                <p className="text-xs text-gray-600 mt-0.5">{sublabel}</p>
            )}
        </div>
        <div className="flex items-center gap-2">
            {badge}
            <span className={`font-bold text-sm ${valueColor}`}>{value}</span>
        </div>
    </div>
);

const StrikeComparison = ({ ruleBased, aiStrike, currentPrice }) => {
    if (!ruleBased || !currentPrice) return null;

    const ruleNum = parseFloat(ruleBased);
    const aiNum = parseFloat(aiStrike);
    const priceNum = parseFloat(currentPrice);

    const ruleAbove = ruleNum > 0 ? (((ruleNum - priceNum) / priceNum) * 100).toFixed(1) : "—";
    const aiAbove = aiNum > 0 ? (((aiNum - priceNum) / priceNum) * 100).toFixed(1) : "—";

    const aiIsBetter = aiNum > 0 && Math.abs(aiNum - priceNum) > Math.abs(ruleNum - priceNum);

    return (
        <div className="mt-3 p-3 bg-vault-bg rounded-lg border border-vault-border">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">
                Strike Comparison
            </p>
            <div className="grid grid-cols-2 gap-2">
                {/* Rule-Based */}
                <div className="bg-yellow-900/10 border border-yellow-700/20 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-gray-500 mb-1">Rule-Based</p>
                    <p className="text-base font-bold text-yellow-400">${ruleNum.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">+{ruleAbove}% above</p>
                    <div className="mt-1.5 text-xs bg-yellow-900/20 rounded px-1.5 py-0.5 text-yellow-500">
                        Fixed Formula
                    </div>
                </div>

                {/* AI Strike */}
                <div className={`border rounded-lg p-2.5 text-center relative
          ${aiNum > 0
                        ? "bg-blue-900/10 border-blue-700/20"
                        : "bg-gray-900/20 border-gray-700/20"
                    }`}>
                    {aiIsBetter && aiNum > 0 && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2
              bg-vault-accent text-vault-bg text-xs px-2 py-0.5 rounded-full font-bold">
                            ✨ AI Pick
                        </div>
                    )}
                    <p className="text-xs text-gray-500 mb-1">AI Model</p>
                    {aiNum > 0 ? (
                        <>
                            <p className="text-base font-bold text-vault-accent">${aiNum.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-1">+{aiAbove}% above</p>
                            <div className="mt-1.5 text-xs bg-blue-900/20 rounded px-1.5 py-0.5 text-blue-400">
                                ML Optimized
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-base font-bold text-gray-500">—</p>
                            <p className="text-xs text-gray-600 mt-1">Start AI service</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const PriceChart = ({ priceHistory, stats }) => {
    if (priceHistory.length < 2) {
        return (
            <div className="h-28 flex items-center justify-center border border-dashed border-vault-border rounded-lg">
                <p className="text-xs text-gray-600">
                    Waiting for price data... ({priceHistory.length}/2 readings)
                </p>
            </div>
        );
    }

    const isUp = stats.direction === "up";
    const chartColor = isUp ? "#3fb950" : "#f85149";

    // Custom tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-vault-card border border-vault-border rounded-lg px-3 py-2 text-xs shadow-lg">
                    <p className="text-gray-400">{payload[0].payload.time}</p>
                    <p className="font-bold" style={{ color: chartColor }}>
                        ${payload[0].value.toLocaleString()}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div>
            {/* Stats bar */}
            <div className="flex justify-between text-xs mb-2 px-1">
                <span className="text-gray-500">
                    H: <span className="text-white font-semibold">${parseFloat(stats.high).toLocaleString()}</span>
                </span>
                <span className={`font-bold ${isUp ? "text-vault-green" : "text-vault-red"}`}>
                    {isUp ? "▲" : "▼"} {Math.abs(parseFloat(stats.change))}%
                </span>
                <span className="text-gray-500">
                    L: <span className="text-white font-semibold">${parseFloat(stats.low).toLocaleString()}</span>
                </span>
            </div>

            {/* Chart */}
            <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={priceHistory} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                        <defs>
                            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chartColor} stopOpacity={0.25} />
                                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="time"
                            tick={{ fontSize: 9, fill: "#6e7681" }}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            domain={["auto", "auto"]}
                            tick={{ fontSize: 9, fill: "#6e7681" }}
                            tickLine={false}
                            axisLine={false}
                            width={55}
                            tickFormatter={(v) => `$${v.toLocaleString()}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="price"
                            stroke={chartColor}
                            strokeWidth={2}
                            fill="url(#priceGradient)"
                            dot={false}
                            activeDot={{ r: 3, fill: chartColor }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────

export default function StrategyMonitor({ strategyData, aiRecommendedStrike, binancePrice }) {
    const { currentPrice, strikePrice, collateralRatio, isHighVol } = strategyData;
    // Use contract price if valid, otherwise fall back to Binance live price
    const contractPrice = parseFloat(currentPrice);
    const effectivePrice = contractPrice > 100 ? currentPrice : (binancePrice ? String(binancePrice) : currentPrice);
    const { priceHistory, stats } = usePriceHistory(effectivePrice);

    // Multiplier info
    const multiplierText = isHighVol ? "+20%" : "+10%";
    const multiplierLabel = isHighVol ? "High Vol Mode" : "Low Vol Mode";
    const collateralText = isHighVol ? "150%" : "110%";

    // Live source indicator
    const priceNum = parseFloat(effectivePrice);
    const isValidPrice = priceNum > 100; // sanity check

    return (
        <div className="bg-vault-card border border-vault-border rounded-xl p-5">

            {/* ── Header ── */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-lg font-bold text-white">🎯 Strategy Monitor</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Live market conditions</p>
                </div>
                <div className="flex items-center gap-1.5 bg-vault-bg border border-vault-border rounded-full px-2.5 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-vault-green animate-pulse" />
                    <span className="text-xs text-gray-400">Binance Live</span>
                </div>
            </div>

            {/* ── Volatility Badge ── */}
            <div className="mb-4">
                <VolatilityBadge isHighVol={isHighVol} />
            </div>

            {/* ── Price Chart ── */}
            <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">
                    ETH Price History
                </p>
                <PriceChart priceHistory={priceHistory} stats={stats} />
            </div>

            {/* ── Data Rows ── */}
            <div className="space-y-0">

                <DataRow
                    label="ETH Price"
                    sublabel="Binance → MockV3Aggregator"
                    value={isValidPrice ? `$${priceNum.toLocaleString()}` : "Loading..."}
                    valueColor="text-vault-accent"
                />

                <DataRow
                    label="Rule-Based Strike"
                    sublabel="StrategyManager contract"
                    value={strikePrice ? `$${parseFloat(strikePrice).toLocaleString()}` : "—"}
                    valueColor="text-yellow-400"
                />

                <DataRow
                    label="AI Strike"
                    sublabel="Python ML model"
                    value={aiRecommendedStrike ? `$${parseFloat(aiRecommendedStrike).toLocaleString()}` : "—"}
                    valueColor={aiRecommendedStrike ? "text-vault-accent" : "text-gray-500"}
                    badge={
                        aiRecommendedStrike ? (
                            <span className="text-xs bg-blue-900/30 text-blue-400 border border-blue-700/30
                px-1.5 py-0.5 rounded-full">
                                AI
                            </span>
                        ) : null
                    }
                />

                <DataRow
                    label="Collateral Ratio"
                    sublabel={isHighVol ? "Higher — volatile market" : "Standard — calm market"}
                    value={collateralText}
                    valueColor="text-white"
                />

                <DataRow
                    label="Strike Multiplier"
                    value={multiplierText}
                    valueColor={isHighVol ? "text-vault-red" : "text-vault-green"}
                    badge={
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border
              ${isHighVol
                                ? "bg-red-900/20 text-red-400 border-red-700/30"
                                : "bg-green-900/20 text-green-400 border-green-700/30"
                            }`}>
                            {multiplierLabel}
                        </span>
                    }
                />

            </div>

            {/* ── Strike Comparison Card ── */}
            <StrikeComparison
                ruleBased={strikePrice}
                aiStrike={aiRecommendedStrike}
                currentPrice={effectivePrice}
            />

            {/* ── Footer note ── */}
            <p className="text-xs text-gray-600 mt-3 text-center">
                Updates every 5s from contract · Price feed: Binance API
            </p>

        </div>
    );
}
