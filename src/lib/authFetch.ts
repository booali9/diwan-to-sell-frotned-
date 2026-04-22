/**
 * authFetch – drop-in replacement for fetch() for authenticated API calls.
 * If the backend returns 401 (token expired / unauthorized), it clears the
 * stored credentials and redirects the user to /login automatically.
 */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const response = await fetch(input, init);

    if (response.status === 401) {
        // Clone so we can still read the body for the error message
        const cloned = response.clone();
        try {
            const data = await cloned.json();
            const msg: string = data?.message || '';
            // Only force-logout on token issues, not other 401 causes
            if (
                msg.toLowerCase().includes('token') ||
                msg.toLowerCase().includes('unauthorized') ||
                msg.toLowerCase().includes('expired') ||
                msg.toLowerCase().includes('invalid')
            ) {
                localStorage.removeItem('userInfo');
                // Redirect to login (avoid infinite loop if already there)
                if (!window.location.pathname.startsWith('/login')) {
                    window.location.href = '/login';
                }
            }
        } catch {
            // JSON parse failed – still redirect for any 401
            localStorage.removeItem('userInfo');
            if (!window.location.pathname.startsWith('/login')) {
                window.location.href = '/login';
            }
        }
    }

    return response;
}

export const getAuthHeaders = (): Record<string, string> => {
    const userInfo = localStorage.getItem('userInfo');
    const token = userInfo ? JSON.parse(userInfo).token : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};
