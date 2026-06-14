import { useState, useCallback } from 'react';

export function useToggle(initial = false) {
  const [value, setValue] = useState(initial);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  return [value, toggle] as const;
}
