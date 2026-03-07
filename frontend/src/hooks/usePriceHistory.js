import { useState, useEffect, useRef } from "react";

const MAX_HISTORY = 20; // Keep last 20 price readings

export const usePriceHistory = (currentPrice) => {
    const [priceHistory, setPriceHistory] = useState([]);
    const prevPriceRef = useRef(null);

    useEffect(() => {
        const price = parseFloat(currentPrice);
        if (!price || price <= 0) return;

        // Only add if price actually changed
        if (prevPriceRef.current === price) return;
        prevPriceRef.current = price;

        const now = new Date();
        const timeLabel = now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });

        setPriceHistory(prev => {
            const newEntry = {
                time: timeLabel,
                price: price,
                timestamp: Date.now()
            };

            const updated = [...prev, newEntry];

            // Keep only last MAX_HISTORY entries
            if (updated.length > MAX_HISTORY) {
                return updated.slice(updated.length - MAX_HISTORY);
            }
            return updated;
        });
    }, [currentPrice]);

    // Calculate stats from history
    const stats = {
        high: priceHistory.length > 0
            ? Math.max(...priceHistory.map(p => p.price)).toFixed(2)
            : "—",
        low: priceHistory.length > 0
            ? Math.min(...priceHistory.map(p => p.price)).toFixed(2)
            : "—",
        change: priceHistory.length >= 2
            ? (((priceHistory[priceHistory.length - 1].price - priceHistory[0].price)
                / priceHistory[0].price) * 100).toFixed(2)
            : "0.00",
        direction: priceHistory.length >= 2
            ? priceHistory[priceHistory.length - 1].price >= priceHistory[0].price
                ? "up" : "down"
            : "neutral"
    };

    return { priceHistory, stats };
};
