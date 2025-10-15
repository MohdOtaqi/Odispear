import { useState, useEffect, useRef, useMemo } from 'react';

interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

/**
 * Virtual scrolling hook for large lists
 * Renders only visible items for better performance
 */
export function useVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions
) {
  const { itemHeight, containerHeight, overscan = 3 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { visibleRange, totalHeight, offsetY } = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const start = Math.floor(scrollTop / itemHeight);
    const rangeStart = Math.max(0, start - overscan);
    const rangeEnd = Math.min(items.length, start + visibleCount + overscan);

    return {
      visibleRange: { start: rangeStart, end: rangeEnd },
      totalHeight: items.length * itemHeight,
      offsetY: rangeStart * itemHeight,
    };
  }, [items.length, itemHeight, scrollTop, containerHeight, overscan]);

  const visibleItems = useMemo(
    () => items.slice(visibleRange.start, visibleRange.end),
    [items, visibleRange]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return {
    containerRef,
    visibleItems,
    totalHeight,
    offsetY,
    startIndex: visibleRange.start,
  };
}
