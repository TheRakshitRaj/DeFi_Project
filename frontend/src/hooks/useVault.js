import { useState, useEffect, useCallback } from "react";
import { getVaultContract, getStrategyContract, fmt } from "../utils/contractHelpers";
import { ethers } from "ethers";

export const useVault = (account) => {
    const [vault, setVault] = useState({ tvl: "0", apy: "0", pnl: "0", userBalance: "0", activeCycle: null, cycleCount: 0 });
    const [strategy, setStrategy] = useState({ currentPrice: "0", strikePrice: "0", collateralRatio: "0", isHighVol: false });
    const [loading, setLoading] = useState(false);

    const refresh = useCallback(async () => {
        try {
            const vc = await getVaultContract();
            const sc = await getStrategyContract();
            const [tvl, apy, pnl, userBal, count] = await Promise.all([
                vc.getVaultTVL(), vc.getAPY(), vc.getPnL(),
                account ? vc.getUserBalance(account) : ethers.BigNumber.from(0),
                vc.getOptionCyclesCount()
            ]);
            let activeCycle = null;
            if (count.gt(0)) {
                const c = await vc.getActiveCycle();
                activeCycle = {
                    optionTokenAddress: c.optionTokenAddress,
                    strikePrice: (Number(c.strikePrice) / 1e8).toFixed(2),
                    collateralLocked: fmt(c.collateralLocked),
                    premiumCollected: fmt(c.premiumCollected),
                    expiry: new Date(c.expiry.toNumber() * 1000).toLocaleString(),
                    settled: c.settled
                };
            }
            setVault({ tvl: fmt(tvl), apy: (Number(apy) / 100).toFixed(2), pnl: fmt(pnl), userBalance: fmt(userBal), activeCycle, cycleCount: count.toNumber() });
            const [price, strike, collateral, highVol] = await sc.getStrategyParams();
            setStrategy({ currentPrice: (Number(price) / 1e8).toFixed(2), strikePrice: (Number(strike) / 1e8).toFixed(2), collateralRatio: collateral.toString(), isHighVol: highVol });
        } catch (e) { console.error(e); }
    }, [account]);

    useEffect(() => {
        refresh();
        const id = setInterval(refresh, 5000);
        return () => clearInterval(id);
    }, [refresh]);

    const deposit = async (amount) => {
        setLoading(true);
        try {
            const vc = await getVaultContract(true);
            await (await vc.deposit({ value: ethers.utils.parseEther(amount) })).wait();
            await refresh();
        } finally { setLoading(false); }
    };

    const withdraw = async (amount) => {
        setLoading(true);
        try {
            const vc = await getVaultContract(true);
            await (await vc.withdraw(ethers.utils.parseEther(amount))).wait();
            await refresh();
        } finally { setLoading(false); }
    };

    return { vault, strategy, loading, deposit, withdraw, refresh };
};
