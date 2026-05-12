import { authFetch, getAuthHeaders } from '../lib/authFetch';

const getBaseUrl = (url: string) => url.startsWith('http') ? url : `https://${url}`;

const API_URL = import.meta.env.VITE_API_BASE_URL
    ? `${getBaseUrl(import.meta.env.VITE_API_BASE_URL)}/api/p2p`
    : 'https://stingray-app-2pifp.ondigitalocean.app/api/p2p';

// ─── ADS ────────────────────────────────────────────────────────────────────────

export const getP2PAds = async (params: Record<string, string> = {}): Promise<any> => {
    const query = new URLSearchParams(params).toString();
    const res = await authFetch(`${API_URL}/ads?${query}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch ads');
    return res.json();
};

export const createP2PAd = async (data: any): Promise<any> => {
    const res = await authFetch(`${API_URL}/ads`, {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to create ad');
    return res.json();
};

export const getMyP2PAds = async (): Promise<any[]> => {
    const res = await authFetch(`${API_URL}/ads/my`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to fetch your ads');
    return res.json();
};

export const toggleP2PAd = async (id: string): Promise<any> => {
    const res = await authFetch(`${API_URL}/ads/${id}/toggle`, {
        method: 'PUT', headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed');
    return res.json();
};

export const deleteP2PAd = async (id: string): Promise<any> => {
    const res = await authFetch(`${API_URL}/ads/${id}`, {
        method: 'DELETE', headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed');
    return res.json();
};

// ─── ORDERS ─────────────────────────────────────────────────────────────────────

export const createP2POrder = async (data: { adId: string; amount: number; paymentMethod?: string }): Promise<any> => {
    const res = await authFetch(`${API_URL}/orders`, {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to create order');
    return res.json();
};

export const getMyP2POrders = async (status?: string): Promise<any[]> => {
    const query = status && status !== 'all' ? `?status=${status}` : '';
    const res = await authFetch(`${API_URL}/orders${query}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed');
    return res.json();
};

export const getP2POrderDetail = async (id: string): Promise<any> => {
    const res = await authFetch(`${API_URL}/orders/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed');
    return res.json();
};

export const markP2PPaymentSent = async (id: string, paymentProof?: string): Promise<any> => {
    const res = await authFetch(`${API_URL}/orders/${id}/pay`, {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ paymentProof }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed');
    return res.json();
};

export const releaseP2PCrypto = async (id: string): Promise<any> => {
    const res = await authFetch(`${API_URL}/orders/${id}/release`, {
        method: 'POST', headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed');
    return res.json();
};

export const cancelP2POrder = async (id: string, reason?: string): Promise<any> => {
    const res = await authFetch(`${API_URL}/orders/${id}/cancel`, {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed');
    return res.json();
};

// ─── CHAT ───────────────────────────────────────────────────────────────────────

export const sendP2PMessage = async (orderId: string, data: { text?: string; type?: string; imageUrl?: string }): Promise<any> => {
    const res = await authFetch(`${API_URL}/orders/${orderId}/messages`, {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed');
    return res.json();
};

export const getP2PMessages = async (orderId: string): Promise<any[]> => {
    const res = await authFetch(`${API_URL}/orders/${orderId}/messages`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed');
    return res.json();
};

// ─── STATS ──────────────────────────────────────────────────────────────────────

export const getP2PStats = async (): Promise<any> => {
    const res = await authFetch(`${API_URL}/stats`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed');
    return res.json();
};
