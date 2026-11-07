import { useCallback, useState } from "react";

const STORAGE_PREFIX = "deploy:v1:";

const readStoredValue = <T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T,
): T => {
  try {
    const stored = window.localStorage.getItem(STORAGE_PREFIX + key);
    return allowed.find((value) => value === stored) ?? fallback;
  } catch {
    return fallback;
  }
};

export const useLocalStorageState = <T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T,
) => {
  const [value, setValue] = useState<T>(() =>
    readStoredValue(key, allowed, fallback),
  );

  const update = useCallback(
    (next: T) => {
      setValue(next);

      try {
        window.localStorage.setItem(STORAGE_PREFIX + key, next);
      } catch {
        return;
      }
    },
    [key],
  );

  return [value, update] as const;
};
