export const formatDuration = (durationMs: number): string => {
  if (durationMs < 1_000) {
    return `${durationMs}ms`;
  }

  const totalSeconds = durationMs / 1_000;

  if (totalSeconds < 60) {
    return `${totalSeconds.toFixed(1)}s`;
  }

  return `${Math.floor(totalSeconds / 60)}m ${Math.round(totalSeconds % 60)}s`;
};
