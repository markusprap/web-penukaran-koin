'use client';

import { useTheme } from '@/components/ThemeProvider';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative overflow-hidden"
            aria-label="Toggle Theme"
        >
            <div className="relative w-5 h-5">
                <Sun
                    size={20}
                    className={`absolute top-0 left-0 transition-all duration-300 transform ${theme === 'dark' ? 'rotate-90 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'
                        }`}
                />
                <Moon
                    size={20}
                    className={`absolute top-0 left-0 transition-all duration-300 transform ${theme === 'dark' ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'
                        }`}
                />
            </div>
        </button>
    );
}
