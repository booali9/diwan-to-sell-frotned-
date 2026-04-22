import { authFetch, getAuthHeaders } from '../lib/authFetch';

const API_URL = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api/trades`
    : 'https://diwantosell-backend.onrender.com/api/trades';

export const openTrade = async (tradeData: { asset: string, type: string, side: string, amount: number, price?: number, entryPrice?: number, leverage?: number, orderType?: string, limitPrice?: number }): Promise<any> => {
    const response = await authFetch(`${API_URL}/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(tradeData),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to open trade');
    }
    return response.json();
};

// Admin: open a trade on behalf of a specific user
export const adminOpenTrade = async (tradeData: {
    userId: string;
    asset: string;
    type: string;
    side: string;
    amount: number;
    price?: number;
    entryPrice?: number;
    leverage?: number;
}): Promise<any> => {
    const adminUrl = import.meta.env.VITE_API_BASE_URL
        ? `${import.meta.env.VITE_API_BASE_URL}/api/admin/trades`
        : 'https://diwantosell-backend.onrender.com/api/admin/trades';
    const response = await authFetch(`${adminUrl}/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(tradeData),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to open trade for user');
    }
    return response.json();
};

export const getMyOpenTrades = async (): Promise<any[]> => {
    const response = await authFetch(`${API_URL}/`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to fetch open trades');
    }
    return response.json();
};

export const closeTrade = async (tradeId: string): Promise<any> => {
    const response = await authFetch(`${API_URL}/${tradeId}/close`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to close trade');
    }
    return response.json();
};

// Get market prices — tries CryptoCompare first (CORS-allowed), then backend
export const getMarketPrices = async (symbols?: string[]): Promise<Record<string, number>> => {
    // Strip "/USDT" or "USDT" suffix to get base symbols (BTC, ETH, XRP, ...)
    const baseSymbols = symbols
        ? symbols.map(s => s.replace(/\/USDT$|USDT$/i, '')).filter(Boolean)
        : [];

    // 1. CryptoCompare pricemulti — CORS-allowed, batch in groups of 50
    if (baseSymbols.length > 0) {
        try {
            const map: Record<string, number> = {};
            const batchSize = 50;
            for (let i = 0; i < baseSymbols.length; i += batchSize) {
                const batch = baseSymbols.slice(i, i + batchSize);
                const r = await fetch(
                    `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${batch.join(',')}&tsyms=USD&relaxedValidation=true`,
                    { signal: AbortSignal.timeout(5000) }
                );
                if (r.ok) {
                    const data: Record<string, { USD: number }> = await r.json();
                    for (const base of batch) {
                        if (data[base]?.USD) {
                            map[base + '/USDT'] = data[base].USD;
                            map[base + 'USDT'] = data[base].USD;
                        }
                    }
                }
            }
            if (Object.keys(map).length === baseSymbols.length) return map;
            
            // If some symbols are missing (like stocks), fallback to backend for the remainder
            const missingSymbols = symbols?.filter(s => !map[s] && !map[s.replace('/', '')]) || [];
            if (missingSymbols.length > 0) {
                try {
                    const query = `?symbols=${missingSymbols.join(',')}`;
                    const response = await fetch(`${API_URL}/prices${query}`);
                    if (response.ok) {
                        const data = await response.json();
                        return { ...map, ...data };
                    }
                } catch { /* ignore */ }
            }
            return map;
        } catch { /* fall through */ }
    }

    // 3. Fallback: backend API
    try {
        const query = symbols ? `?symbols=${symbols.join(',')}` : '';
        const response = await fetch(`${API_URL}/prices${query}`);
        if (response.ok) {
            const data = await response.json();
            const hasRealPrices = data && Object.values(data).some((v) => (v as number) > 0);
            if (hasRealPrices) return data;
        }
    } catch { /* ignore */ }

    return {};
};

// Get detailed market data (price, 24h change, volume, market cap)
export const getDetailedMarketData = async (symbols?: string[]): Promise<Record<string, any>> => {
    const query = symbols ? `?symbols=${symbols.join(',')}` : '';
    const response = await fetch(`${API_URL}/market-data${query}`);
    if (!response.ok) {
        throw new Error('Failed to fetch market data');
    }
    return response.json();
};

// Get closed/historical trades (closed = manually closed, liquidated = force-closed by system)
export const getMyClosedTrades = async (): Promise<any[]> => {
    const response = await authFetch(`${API_URL}/?status=closed,liquidated`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to fetch closed trades');
    }
    return response.json();
};
