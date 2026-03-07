import { useState, useEffect } from "react";
import DepositPanel from "./components/DepositPanel";
import VaultDashboard from "./components/VaultDashboard";
import StrategyMonitor from "./components/StrategyMonitor";
import BacktestPanel from "./components/BacktestPanel";
import { useVault } from "./hooks/useVault";
import { getProvider } from "./utils/contractHelpers";

export default function App() {
    const [account, setAccount] = useState(null);
    const { vault, strategy, loading, deposit, withdraw } = useVault(account);

    const connect = async () => {
        try {
            const p = getProvider();
            const accs = await p.send("eth_requestAccounts", []);
            setAccount(accs[0]);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on("accountsChanged", a => setAccount(a[0] || null));
        }
    }, []);

    return (
        <div className="min-h-screen bg-vault-bg text-white">
            <header className="border-b border-vault-border px-6 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-vault-accent">⚡ DynVault</h1>
                    <p className="text-xs text-gray-500">Dynamic ETH Options Vault</p>
                </div>
                <button onClick={connect} className="bg-vault-accent text-vault-bg px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90">
                    {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
                </button>
            </header>
            <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <DepositPanel deposit={deposit} withdraw={withdraw} loading={loading} userBalance={vault.userBalance} />
                <VaultDashboard vaultData={vault} />
                <StrategyMonitor strategyData={strategy} />
                <div className="md:col-span-2 xl:col-span-3">
                    <BacktestPanel />
                </div>
            </main>
        </div>
    );
}
