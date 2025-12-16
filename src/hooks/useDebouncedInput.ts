import { useState, useEffect, useCallback, useRef } from "react";

export function useDebouncedInput<T = string>(
  initialValue: T,
  onDebouncedChange: (value: T) => void,
  delay: number = 300
) {
  const [localValue, setLocalValue] = useState<T>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setLocalValue(initialValue);
  }, [initialValue]);

  const handleChange = useCallback(
    (value: T) => {
      setLocalValue(value);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        onDebouncedChange(value);
      }, delay);
    },
    [onDebouncedChange, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [localValue, handleChange] as const;
}
