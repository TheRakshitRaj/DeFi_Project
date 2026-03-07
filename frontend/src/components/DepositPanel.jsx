import { useState } from "react";

export default function DepositPanel({ deposit, withdraw, loading, userBalance }) {
    const [amount, setAmount] = useState("");
    const [mode, setMode] = useState("deposit");

    const handle = async () => {
        if (!amount || Number(amount) <= 0) return;
        mode === "deposit" ? await deposit(amount) : await withdraw(amount);
        setAmount("");
    };

    return (
        <div className="bg-vault-card border border-vault-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">💰 Manage Position</h2>
            <p className="text-sm text-gray-400 mb-4">
                Your Balance: <span className="text-vault-accent font-bold">{Number(userBalance).toFixed(4)} ETH</span>
            </p>
            <div className="flex rounded-lg overflow-hidden mb-4 border border-vault-border">
                {["deposit", "withdraw"].map(m => (
                    <button key={m} onClick={() => setMode(m)}
                        className={`flex-1 py-2 text-sm font-semibold capitalize transition-colors ${mode === m ? "bg-vault-accent text-vault-bg" : "bg-transparent text-gray-400 hover:text-white"}`}>
                        {m}
                    </button>
                ))}
            </div>
            <input type="number" placeholder="Amount in ETH" value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full bg-vault-bg border border-vault-border text-white rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-vault-accent" />
            <button onClick={handle} disabled={loading}
                className="w-full bg-vault-accent text-vault-bg font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50">
                {loading ? "Processing..." : mode === "deposit" ? "Deposit ETH" : "Withdraw ETH"}
            </button>
        </div>
    );
}
