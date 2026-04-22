import { authFetch, getAuthHeaders } from '../lib/authFetch';

const API_URL = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api/users`
    : 'https://diwantosell-backend.onrender.com/api/users';

export const loginUser = async (emailOrPhone: string, password: string, isEmail: boolean): Promise<any> => {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            [isEmail ? 'email' : 'phone']: emailOrPhone,
            password,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    localStorage.setItem('userInfo', JSON.stringify(data));
    return data;
};

export const registerUser = async (name: string, email: string, phone: string, password: string): Promise<any> => {
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Registration failed');
    }

    const data = await response.json();
    // Store token but don't mark as fully logged in yet (need OTP)
    localStorage.setItem('userInfo', JSON.stringify(data));
    return data;
};

export const verifyOTP = async (email: string, otp: string): Promise<any> => {
    const response = await fetch(`${API_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'OTP verification failed');
    }

    return response.json();
};

export const resendOTP = async (email: string): Promise<any> => {
    const response = await fetch(`${API_URL}/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to resend OTP');
    }

    return response.json();
};

export const forgotPassword = async (email: string): Promise<any> => {
    const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to send reset code');
    }

    return response.json();
};

export const verifyResetOTP = async (email: string, otp: string): Promise<any> => {
    const response = await fetch(`${API_URL}/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Invalid reset code');
    }

    return response.json();
};

export const resetPassword = async (email: string, resetToken: string, newPassword: string): Promise<any> => {
    const response = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetToken, newPassword }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Password reset failed');
    }

    return response.json();
};

export const getProfile = async (): Promise<any> => {
    const response = await authFetch(`${API_URL}/profile`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to get profile');
    }

    return response.json();
};

export const submitKYC = async (documentType: string, documentFront: string, documentBack: string, selfie: string): Promise<any> => {
    const response = await authFetch(`${API_URL}/kyc`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ documentType, documentFront, documentBack, selfie }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'KYC submission failed');
    }

    return response.json();
};

export const getKYCStatus = async (): Promise<any> => {
    const response = await authFetch(`${API_URL}/kyc-status`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to get KYC status');
    }

    return response.json();
};

export const logoutUser = () => {
    localStorage.removeItem('userInfo');
};

// ========== NOTIFICATIONS ==========

export const getNotifications = async (): Promise<any[]> => {
    const response = await authFetch(`${API_URL}/notifications`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
};

export const markNotificationRead = async (id: string): Promise<any> => {
    const response = await authFetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to mark notification as read');
    return response.json();
};

export const getUnreadNotificationCount = async (): Promise<number> => {
    const response = await authFetch(`${API_URL}/notifications/unread-count`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to get unread count');
    const data = await response.json();
    return data.count;
};
export const updateUserProfile = async (profileData: { name?: string, phone?: string, country?: string }): Promise<any> => {
    const response = await authFetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to update profile');
    }

    const data = await response.json();
    // Update local storage with new profile data and mark profile as complete
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    localStorage.setItem('userInfo', JSON.stringify({ ...userInfo, ...data, isProfileComplete: true }));
    return data;
};

// ========== SECURITY ==========

export const changePassword = async (currentPassword: string, newPassword: string): Promise<any> => {
    const response = await authFetch(`${API_URL}/change-password`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to change password');
    }

    return response.json();
};

export const changeEmail = async (newEmail: string, password: string): Promise<any> => {
    const response = await authFetch(`${API_URL}/change-email`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ newEmail, password }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to change email');
    }

    const data = await response.json();
    // Update local storage email
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    localStorage.setItem('userInfo', JSON.stringify({ ...userInfo, email: data.email }));
    return data;
};

export const deleteAccountService = async (password: string): Promise<any> => {
    const response = await authFetch(`${API_URL}/account`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ password }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to delete account');
    }

    localStorage.removeItem('userInfo');
    return response.json();
};
