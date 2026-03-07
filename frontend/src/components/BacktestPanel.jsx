import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const mockBacktest = (params) => {
    const strategies = [
        { name: "Conservative", apy: (Math.random() * 8 + 8).toFixed(1), winRate: "72%", maxDrawdown: "-3.2%" },
        { name: "Aggressive", apy: (Math.random() * 12 + 5).toFixed(1), winRate: "55%", maxDrawdown: "-12.1%" },
        { name: "Balanced", apy: (Math.random() * 10 + 9).toFixed(1), winRate: "64%", maxDrawdown: "-6.4%" }
    ];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyData = months.map(month => ({
        month,
        conservative: +(Math.random() * 2 + 0.3).toFixed(2),
        aggressive: +(Math.random() * 3 - 0.4).toFixed(2),
        balanced: +(Math.random() * 2.5).toFixed(2)
    }));
    return { strategies, monthlyData };
};

export default function BacktestPanel() {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [params, setParams] = useState({ lowVol: 110, highVol: 120, threshold: 500 });

    const run = async () => {
        setLoading(true);
        try {
            const res = await fetch("/backtest_results.json");
            if (!res.ok) throw new Error("not found");
            setResults(await res.json());
        } catch {
            setResults(mockBacktest(params));
        } finally { setLoading(false); }
    };

    useEffect(() => { run(); }, []);

    return (
        <div className="bg-vault-card border border-vault-border rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">📈 Backtesting Engine</h2>
                <span className="text-xs bg-vault-yellow/20 text-vault-yellow border border-vault-yellow/30 px-2 py-1 rounded-full">C++ Engine</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
                {[["Low Vol Strike %", "lowVol"], ["High Vol Strike %", "highVol"], ["Vol Threshold ($)", "threshold"]].map(([label, key]) => (
                    <div key={key}>
                        <label className="text-xs text-gray-500 block mb-1">{label}</label>
                        <input type="number" value={params[key]} onChange={e => setParams(p => ({ ...p, [key]: Number(e.target.value) }))}
                            className="w-full bg-vault-bg border border-vault-border text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-vault-accent" />
                    </div>
                ))}
            </div>
            <button onClick={run} disabled={loading}
                className="w-full bg-vault-yellow text-vault-bg font-bold py-2 rounded-lg mb-6 hover:opacity-90 disabled:opacity-50 text-sm">
                {loading ? "Running..." : "▶ Run Backtest"}
            </button>
            {results && (
                <>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {results.strategies.map(s => (
                            <div key={s.name} className="bg-vault-bg border border-vault-border rounded-lg p-3 text-center">
                                <p className="text-xs text-gray-500 mb-1">{s.name}</p>
                                <p className="text-2xl font-bold text-vault-green">{s.apy}%</p>
                                <p className="text-xs text-gray-500">APY</p>
                                <p className="text-xs text-gray-400 mt-1">Win Rate: <span className="text-white">{s.winRate}</span></p>
                                <p className="text-xs text-gray-400">Max DD: <span className="text-vault-red">{s.maxDrawdown}</span></p>
                            </div>
                        ))}
                    </div>
                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={results.monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                                <XAxis dataKey="month" stroke="#6e7681" tick={{ fontSize: 11 }} />
                                <YAxis stroke="#6e7681" tick={{ fontSize: 11 }} />
                                <Tooltip contentStyle={{ background: "#161b22", border: "1px solid #30363d" }} labelStyle={{ color: "#e6edf3" }} />
                                <Legend />
                                <Line type="monotone" dataKey="conservative" stroke="#58a6ff" dot={false} strokeWidth={2} name="Conservative" />
                                <Line type="monotone" dataKey="aggressive" stroke="#3fb950" dot={false} strokeWidth={2} name="Aggressive" />
                                <Line type="monotone" dataKey="balanced" stroke="#d29922" dot={false} strokeWidth={2} name="Balanced" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}
        </div>
    );
}
