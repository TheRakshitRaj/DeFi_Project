export default function StrategyMonitor({ strategyData, aiRecommendedStrike }) {
    const { isHighVol } = strategyData;

    return (
        <div className="bg-vault-card border border-vault-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">🎯 Strategy Monitor</h2>

            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4 ${isHighVol
                ? "bg-vault-red/20 text-vault-red border border-vault-red/30"
                : "bg-vault-green/20 text-vault-green border border-vault-green/30"
                }`}>
                <span className={`w-2 h-2 rounded-full animate-pulse ${isHighVol ? "bg-vault-red" : "bg-vault-green"}`} />
                {isHighVol ? "HIGH VOLATILITY" : "LOW VOLATILITY"}
            </div>

            <div className="space-y-3">
                {[
                    ["ETH Price", `$${strategyData.currentPrice}`, "text-vault-accent"],
                    ["Rule-Based Strike", `$${strategyData.strikePrice}`, "text-vault-yellow"],
                    ["AI Strike", aiRecommendedStrike ? `$${aiRecommendedStrike}` : "—", "text-vault-accent font-bold"],
                    ["Collateral Ratio", `${strategyData.collateralRatio}%`, "text-white"],
                    ["Multiplier Mode", isHighVol ? "+20% (High Vol)" : "+10% (Low Vol)", "text-gray-300"]
                ].map(([k, v, c]) => (
                    <div key={k} className="flex justify-between border-b border-vault-border pb-2">
                        <span className="text-gray-400 text-sm">{k}</span>
                        <span className={`font-semibold text-sm ${c}`}>{v}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
