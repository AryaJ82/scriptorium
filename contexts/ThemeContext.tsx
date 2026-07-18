
'use client'

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps, } from 'next-themes'
import { useEffect, useState } from 'react';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  // Suppress hydration mismatch error.
  // Linter complains about this, but it's the recommended way to handle this issue in Next.js
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (<>{children}</>); // Render children without ThemeProvider during SSR
  }

  return (<NextThemesProvider {...props}>{children}</NextThemesProvider>);
}