const Stat = ({ label, value, color }) => (
    <div className="bg-vault-bg border border-vault-border rounded-lg p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
);

export default function VaultDashboard({ vaultData }) {
    const pnl = parseFloat(vaultData.pnl);
    return (
        <div className="bg-vault-card border border-vault-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">📊 Vault Dashboard</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
                <Stat label="TVL" value={`${Number(vaultData.tvl).toFixed(4)} ETH`} color="text-vault-accent" />
                <Stat label="APY" value={`${vaultData.apy}%`} color="text-vault-green" />
                <Stat label="P/L" value={`${pnl >= 0 ? "+" : ""}${pnl.toFixed(4)} ETH`} color={pnl >= 0 ? "text-vault-green" : "text-vault-red"} />
                <Stat label="Cycles" value={vaultData.cycleCount} color="text-vault-yellow" />
            </div>
            {vaultData.activeCycle && (
                <div className="bg-vault-bg border border-vault-border rounded-lg p-4 text-sm space-y-1">
                    <p className="font-semibold text-gray-400 mb-2">Active Option Cycle</p>
                    {[["Strike", `$${vaultData.activeCycle.strikePrice}`],
                    ["Collateral", `${vaultData.activeCycle.collateralLocked} ETH`],
                    ["Premium", `${vaultData.activeCycle.premiumCollected} ETH`],
                    ["Expiry", vaultData.activeCycle.expiry],
                    ["Status", vaultData.activeCycle.settled ? "Settled" : "Active ●"]
                    ].map(([k, v]) => (
                        <p key={k}><span className="text-gray-500">{k}:</span>{" "}
                            <span className={k === "Status" && !vaultData.activeCycle.settled ? "text-vault-green" : "text-white"}>{v}</span>
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
}
