import { useEffect, useState } from "react";

export const useNow = (enabled: boolean, intervalMs = 1000): number => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const timer = setInterval(() => setNow(Date.now()), intervalMs);

    return () => clearInterval(timer);
  }, [enabled, intervalMs]);

  return now;
};
