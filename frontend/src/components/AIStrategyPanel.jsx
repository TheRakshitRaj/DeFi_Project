import { useState } from "react";
import { useAIStrategy } from "../hooks/useAIStrategy";
import { getVaultContract } from "../utils/contractHelpers";
import { ethers } from "ethers";

// Confidence bar component
const ConfidenceBar = ({ value }) => {
    const pct = Math.round(value * 100);
    const color = pct >= 75 ? "#3fb950" : pct >= 55 ? "#d29922" : "#f85149";
    return (
        <div className="w-full">
            <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-400">Confidence</span>
                <span className="text-xs font-bold" style={{ color }}>{pct}%</span>
            </div>
            <div className="w-full bg-vault-bg rounded-full h-2">
                <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );
};

// Risk badge
const RiskBadge = ({ level }) => {
    const styles = {
        LOW: "bg-green-900/40 text-green-400 border-green-700/40",
        MEDIUM: "bg-yellow-900/40 text-yellow-400 border-yellow-700/40",
        HIGH: "bg-red-900/40 text-red-400 border-red-700/40"
    };
    return (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${styles[level] || styles.MEDIUM}`}>
            {level} RISK
        </span>
    );
};

export default function AIStrategyPanel({ currentPrice, strategyData }) {
    // Derive volatility from strategy data collateral ratio as a proxy
    // In a real system this would come from a rolling std calculation
    const volatility = strategyData?.isHighVol ? 0.055 : 0.025;

    const { aiData, refetch } = useAIStrategy(currentPrice, volatility);
    const [txStatus, setTxStatus] = useState(null);
    const [applying, setApplying] = useState(false);

    // Send the AI-recommended strike to the smart contract
    const applyToContract = async () => {
        if (!aiData.recommended_strike) return;
        setApplying(true);
        setTxStatus(null);
        try {
            const vault = await getVaultContract(true);
            // Convert strike price to the format the contract expects (USD * 1e8)
            const strikePriceOnChain = Math.round(aiData.recommended_strike * 1e8);
            // Call writeCoveredCallWithStrike — the new overloaded function
            const tx = await vault.writeCoveredCallWithStrike(
                strikePriceOnChain,
                604800 // 7 days expiry in seconds
            );
            await tx.wait();
            setTxStatus({ success: true, msg: `✅ Covered call written at $${aiData.recommended_strike}` });
        } catch (err) {
            setTxStatus({ success: false, msg: `❌ ${err.reason || err.message}` });
        } finally {
            setApplying(false);
        }
    };

    return (
        <div className="bg-vault-card border border-vault-border rounded-xl p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-5">
                <div>
                    <h2 className="text-xl font-bold text-white">🤖 AI Strategy Engine</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Random Forest Model · Updates every 30s</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${aiData.serviceOnline ? "bg-vault-green animate-pulse" : "bg-vault-red"}`} />
                    <span className={`text-xs font-semibold ${aiData.serviceOnline ? "text-vault-green" : "text-vault-red"}`}>
                        {aiData.serviceOnline ? "ONLINE" : "OFFLINE"}
                    </span>
                </div>
            </div>

            {/* Offline state */}
            {!aiData.serviceOnline && (
                <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 mb-4">
                    <p className="text-red-400 text-sm font-semibold mb-1">AI Service Not Running</p>
                    <p className="text-gray-400 text-xs">Start the Python API to enable AI recommendations:</p>
                    <code className="block text-xs text-vault-yellow mt-2 bg-vault-bg p-2 rounded">
                        cd ai-strategy && source venv/bin/activate && python3 api.py
                    </code>
                    <button onClick={refetch} className="mt-3 text-xs text-vault-accent hover:underline">
                        Retry connection →
                    </button>
                </div>
            )}

            {/* Loading state */}
            {aiData.loading && (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                    <div className="w-4 h-4 border-2 border-vault-accent border-t-transparent rounded-full animate-spin" />
                    Fetching AI recommendation...
                </div>
            )}

            {/* Main prediction display */}
            {aiData.serviceOnline && !aiData.loading && aiData.recommended_strike && (
                <>
                    {/* Input summary */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-vault-bg border border-vault-border rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Current ETH Price</p>
                            <p className="text-lg font-bold text-vault-accent">${Number(currentPrice).toLocaleString()}</p>
                        </div>
                        <div className="bg-vault-bg border border-vault-border rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Market Volatility</p>
                            <p className="text-lg font-bold text-vault-yellow">{(volatility * 100).toFixed(1)}%</p>
                        </div>
                    </div>

                    {/* AI Recommendation */}
                    <div className="bg-gradient-to-br from-blue-900/20 to-vault-bg border border-vault-accent/30 rounded-xl p-4 mb-4">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Recommended Strike Price</p>
                                <p className="text-3xl font-bold text-vault-accent">
                                    ${aiData.recommended_strike.toLocaleString()}
                                </p>
                            </div>
                            <RiskBadge level={aiData.risk_level || "MEDIUM"} />
                        </div>

                        <div className="flex justify-between text-sm mb-4">
                            <span className="text-gray-400">
                                Multiplier: <span className="text-white font-semibold">{aiData.multiplier?.toFixed(3)}x</span>
                            </span>
                            <span className="text-gray-400">
                                vs rule-based: <span className="text-vault-yellow font-semibold">
                                    ${strategyData?.isHighVol
                                        ? (Number(currentPrice) * 1.20).toFixed(0)
                                        : (Number(currentPrice) * 1.10).toFixed(0)}
                                </span>
                            </span>
                        </div>

                        <ConfidenceBar value={aiData.confidence || 0} />
                    </div>

                    {/* Apply to contract button */}
                    <button
                        onClick={applyToContract}
                        disabled={applying}
                        className="w-full bg-vault-accent text-vault-bg font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity mb-3"
                    >
                        {applying ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-vault-bg border-t-transparent rounded-full animate-spin" />
                                Writing to contract...
                            </span>
                        ) : (
                            `⚡ Apply AI Strike ($${aiData.recommended_strike}) to Vault`
                        )}
                    </button>

                    {/* Transaction status */}
                    {txStatus && (
                        <div className={`text-sm p-3 rounded-lg ${txStatus.success ? "bg-green-900/20 text-vault-green border border-green-700/30" : "bg-red-900/20 text-vault-red border border-red-700/30"}`}>
                            {txStatus.msg}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
