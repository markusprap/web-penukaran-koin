import { useAuthStore } from '@/store/useAuthStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    // Get token from auth store (works outside React components)
    const token = useAuthStore.getState().token;

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    // Auto-logout on 401 (token expired or invalid)
    if (response.status === 401) {
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        // Don't auto-logout if we're on a login page
        if (!currentPath.includes('/login')) {
            useAuthStore.getState().logout();
            if (typeof window !== 'undefined') {
                // Redirect to appropriate login page
                if (currentPath.startsWith('/admin')) {
                    window.location.href = '/admin/login';
                } else {
                    window.location.href = '/app/login';
                }
            }
        }
    }

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API request failed');
    }

    return response.json();
};
