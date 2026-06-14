import { useState, useEffect } from 'react';

const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

type Breakpoint = keyof typeof BREAKPOINTS;

function getBreakpoint(width: number): Breakpoint {
  if (width < BREAKPOINTS.sm) return 'xs';
  if (width < BREAKPOINTS.md) return 'sm';
  if (width < BREAKPOINTS.lg) return 'md';
  if (width < BREAKPOINTS.xl) return 'lg';
  return 'xl';
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`);
}

function useIsTablet(): boolean {
  return useMediaQuery(
    `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`
  );
}

function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
}

function useIsXS(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.xs - 1}px)`);
}

function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() => {
    if (typeof window === 'undefined') return 'lg';
    return getBreakpoint(window.innerWidth);
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mqls = Object.entries(BREAKPOINTS).map(([name, width]) =>
      window.matchMedia(`(min-width: ${width}px)`)
    );

    const handler = () => setBreakpoint(getBreakpoint(window.innerWidth));
    mqls.forEach(mql => mql.addEventListener('change', handler));
    return () => mqls.forEach(mql => mql.removeEventListener('change', handler));
  }, []);

  return breakpoint;
}

function useWindowSize(): { width: number; height: number } {
  const [size, setSize] = useState(() => {
    if (typeof window === 'undefined') return { width: 0, height: 0 };
    return { width: window.innerWidth, height: window.innerHeight };
  });

  useEffect(() => {
    let frameId: number;
    const handler = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() =>
        setSize({ width: window.innerWidth, height: window.innerHeight })
      );
    };
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('resize', handler);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return size;
}

export {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsXS,
  useBreakpoint,
  useWindowSize,
  BREAKPOINTS,
};

export type { Breakpoint };
