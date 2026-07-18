'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/Button'

export function ThemeToggle() {
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(true);

    // Suppress hydration mismatch error.
    // Linter complains about this, but it's the recommended way to handle this issue in Next.js
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => setMounted(true), []);

    const isDark = resolvedTheme === 'dark';

    return (
        <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle Theme"
            onClick={() => setTheme(isDark ? "light" : "dark")}
        >

            {mounted && isDark ? (<Sun className="size-4.5" />) : (<Moon className="size-4.5" />)}
        </Button>
    );
}
