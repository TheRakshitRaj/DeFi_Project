import { useState, useEffect, useCallback } from "react";

const AI_API_BASE = "http://localhost:8000";

export const useAIStrategy = (currentPrice, volatility) => {
    const [aiData, setAiData] = useState({
        recommended_strike: null,
        multiplier: null,
        confidence: null,
        risk_level: null,
        loading: false,
        error: null,
        serviceOnline: false
    });

    const fetchPrediction = useCallback(async () => {
        // Don't fetch if no valid price/volatility
        if (!currentPrice || !volatility || Number(currentPrice) <= 0) return;

        setAiData(prev => ({ ...prev, loading: true, error: null }));

        try {
            // First check health
            const healthRes = await fetch(`${AI_API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
            if (!healthRes.ok) throw new Error("AI service offline");
            const health = await healthRes.json();
            if (!health.model_loaded) throw new Error("Model not loaded on server");

            // Fetch prediction
            const url = `${AI_API_BASE}/predict?price=${currentPrice}&volatility=${volatility}`;
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
                serviceOnline: true
            });
        } catch (err) {
            setAiData(prev => ({
                ...prev,
                loading: false,
                error: err.message || "AI service unavailable",
                serviceOnline: false
            }));
        }
    }, [currentPrice, volatility]);

    // Fetch on mount and whenever price/volatility change
    useEffect(() => {
        fetchPrediction();
        const interval = setInterval(fetchPrediction, 30000); // refresh every 30s
        return () => clearInterval(interval);
    }, [fetchPrediction]);

    return { aiData, refetch: fetchPrediction };
};
