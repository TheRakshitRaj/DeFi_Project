import { useState, useEffect } from "react";
import DepositPanel from "./components/DepositPanel";
import VaultDashboard from "./components/VaultDashboard";
import StrategyMonitor from "./components/StrategyMonitor";
import BacktestPanel from "./components/BacktestPanel";
import AIStrategyPanel from "./components/AIStrategyPanel";
import { useVault } from "./hooks/useVault";

export default function App() {
    const [account, setAccount] = useState(null);
    const [aiStrike, setAiStrike] = useState(null);
    const [binancePrice, setBinancePrice] = useState(null);
    const { vault, strategy, loading, deposit, withdraw } = useVault(account);

    const connect = async () => {
        try {
            if (!window.ethereum) {
                alert("MetaMask not found. Install MetaMask to connect your wallet.");
                return;
            }
            const p = new (await import("ethers")).ethers.providers.Web3Provider(window.ethereum);
            const accs = await p.send("eth_requestAccounts", []);
            setAccount(accs[0]);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on("accountsChanged", (a) => setAccount(a[0] || null));
        }
    }, []);

    return (
        <div className="min-h-screen bg-vault-bg text-white">
            {/* Header */}
            <header className="border-b border-vault-border px-6 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-vault-accent">⚡ DynVault</h1>
                    <p className="text-xs text-gray-500">Dynamic ETH Options Vault · Powered by Binance Live Prices</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-vault-card
            border border-vault-border px-3 py-1.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-vault-green animate-pulse" />
                        Live ETH Feed
                    </div>
                    <button
                        onClick={connect}
                        className="bg-vault-accent text-vault-bg px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90"
                    >
                        {account
                            ? `${account.slice(0, 6)}...${account.slice(-4)}`
                            : "Connect Wallet"}
                    </button>
                </div>
            </header>

            {/* Grid */}
            <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <DepositPanel
                    deposit={deposit}
                    withdraw={withdraw}
                    loading={loading}
                    userBalance={vault.userBalance}
                />
                <VaultDashboard vaultData={vault} />

                {/* Strategy Monitor gets aiStrike + binancePrice from shared state */}
                <StrategyMonitor
                    strategyData={strategy}
                    aiRecommendedStrike={aiStrike}
                    binancePrice={binancePrice}
                />

                {/* AI Panel sets the shared aiStrike + binancePrice state */}
                <AIStrategyPanel
                    currentPrice={strategy.currentPrice}
                    strategyData={strategy}
                    onStrikeUpdate={(strike) => setAiStrike(strike)}
                    onPriceUpdate={(price) => setBinancePrice(price)}
                />

                <div className="md:col-span-2 xl:col-span-3">
                    <BacktestPanel />
                </div>
            </main>
        </div>
    );
}