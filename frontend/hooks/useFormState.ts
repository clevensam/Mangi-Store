import { useState, useCallback } from 'react';

export function useFormState<T extends Record<string, any>>(initial: T) {
  const [values, setValues] = useState<T>(initial);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setValues((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

  const updateField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setValues(initial);
  }, [initial]);

  return { values, handleChange, updateField, setValues, reset };
}
