import { useEffect, useState, useRef } from 'react';

/**
 * Hook for debouncing a value. Returns the debounced value after the specified delay.
 * Useful for preventing re-renders on every keystroke.
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 150ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 150): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup on unmount or value change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for throttling a function. Ensures the function is called at most once per interval.
 * Useful for streaming updates to prevent render storms.
 * 
 * @param callback - The function to throttle
 * @param delay - Minimum time between calls in milliseconds (default: 50ms ~20fps)
 * @returns Throttled version of the callback
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 50
): T {
  const lastRun = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout>();

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRun.current;

    if (timeSinceLastRun >= delay) {
      // Enough time has passed, run immediately
      lastRun.current = now;
      callback(...args);
    } else {
      // Schedule for later
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        lastRun.current = Date.now();
        callback(...args);
      }, delay - timeSinceLastRun);
    }
  }) as T;
}
