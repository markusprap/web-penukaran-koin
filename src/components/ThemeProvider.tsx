'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}


export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('light');

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme) {
            setTheme(savedTheme);
        } else {
            // Force default to light as requested
            setTheme('light');
        }
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;

        const applyTheme = (t: Theme) => {
            root.classList.remove('light', 'dark');

            if (t === 'system') {
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                root.classList.add(systemTheme);
            } else {
                root.classList.add(t);
            }
        };

        applyTheme(theme);

        if (theme !== 'system') {
            localStorage.setItem('theme', theme);
        } else {
            localStorage.removeItem('theme');
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}


