import { authFetch, getAuthHeaders } from '../lib/authFetch';

const API_URL = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api/staking`
    : 'https://diwantosell-backend.onrender.com/api/staking';

export interface StakingPool {
    id: string;
    name: string;
    apy: number;
    duration: number;
    description: string;
}

export const getStakingPools = async (): Promise<StakingPool[]> => {
    const response = await fetch(`${API_URL}/pools`);
    if (!response.ok) {
        throw new Error('Failed to fetch staking pools');
    }
    return response.json();
};

export const stakeAsset = async (data: { amount: number, duration: number, autoCompound?: boolean }) => {
    const response = await authFetch(`${API_URL}/stake`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Staking failed');
    }
    return response.json();
};

export const getMyStakes = async () => {
    const response = await authFetch(`${API_URL}/my-stakes`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch stakes');
    }
    return response.json();
};

export const unstakeAsset = async (id: string) => {
    const response = await authFetch(`${API_URL}/unstake/${id}`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Unstaking failed');
    }
    return response.json();
};
