import { useState, useEffect, useCallback, useRef } from "react";

const AI_API_BASE = "http://localhost:8000";
const BINANCE_PRICE_URL = "https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT";

export const useAIStrategy = (currentPriceProp, volatilityProp, onStrikeUpdate) => {
    const [livePrice, setLivePrice] = useState(null);
    const [aiData, setAiData] = useState({
        recommended_strike: null,
        multiplier: null,
        confidence: null,
        risk_level: null,
        loading: true,
        error: null,
        serviceOnline: false,
        livePrice: null
    });
    const onStrikeUpdateRef = useRef(onStrikeUpdate);
    onStrikeUpdateRef.current = onStrikeUpdate;

    // Fetch live ETH price from Binance (wallet-independent)
    const fetchLivePrice = useCallback(async () => {
        try {
            const res = await fetch(BINANCE_PRICE_URL, { signal: AbortSignal.timeout(5000) });
            if (!res.ok) throw new Error("Binance API error");
            const data = await res.json();
            const price = parseFloat(data.price);
            if (price > 0) {
                setLivePrice(price);
                return price;
            }
        } catch {
            // If Binance fails, fall back to prop-supplied price
        }
        return null;
    }, []);

    // Check AI service health
    const checkHealth = useCallback(async () => {
        try {
            const healthRes = await fetch(`${AI_API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
            if (!healthRes.ok) return false;
            const health = await healthRes.json();
            return health.model_loaded === true;
        } catch {
            return false;
        }
    }, []);

    const fetchPrediction = useCallback(async () => {
        // 1. Get live price independently from Binance
        const binancePrice = await fetchLivePrice();
        // Use Binance price, or prop price, or null
        const price = binancePrice || (currentPriceProp && Number(currentPriceProp) > 0 ? Number(currentPriceProp) : null);

        // 2. Check AI service health
        const isOnline = await checkHealth();

        // Default volatility if none provided (moderate)
        const volatility = volatilityProp || 0.035;

        if (!isOnline) {
            setAiData(prev => ({
                ...prev,
                loading: false,
                error: "AI service offline",
                serviceOnline: false,
                livePrice: price
            }));
            return;
        }

        if (!price) {
            setAiData(prev => ({
                ...prev,
                serviceOnline: true,
                loading: false,
                error: "Could not fetch ETH price",
                livePrice: null
            }));
            return;
        }

        setAiData(prev => ({ ...prev, loading: true, error: null, serviceOnline: true, livePrice: price }));

        try {
            const url = `${AI_API_BASE}/predict?price=${price}&volatility=${volatility}`;
            const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            const data = await res.json();

            setAiData({
                recommended_strike: data.recommended_strike,
                multiplier: data.multiplier,
                confidence: data.confidence,
                risk_level: data.risk_level,
                loading: false,
                error: null,
                serviceOnline: true,
                livePrice: price
            });

            if (onStrikeUpdateRef.current && data.recommended_strike) {
                onStrikeUpdateRef.current(data.recommended_strike);
            }
        } catch (err) {
            setAiData(prev => ({
                ...prev,
                loading: false,
                error: err.message || "Prediction failed",
                serviceOnline: true,
                livePrice: price
            }));
        }
    }, [currentPriceProp, volatilityProp, fetchLivePrice, checkHealth]);

    // Fetch on mount and refresh every 30s
    useEffect(() => {
        fetchPrediction();
        const interval = setInterval(fetchPrediction, 30000);
        return () => clearInterval(interval);
    }, [fetchPrediction]);

    return { aiData, refetch: fetchPrediction, livePrice };
};
