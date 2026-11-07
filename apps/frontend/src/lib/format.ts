import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  format,
  isSameYear,
} from "date-fns";

const toDate = (value: string | Date): Date =>
  typeof value === "string" ? new Date(value) : value;

export const formatRelativeTime = (
  value: string | Date,
  now: Date = new Date(),
): string => {
  const date = toDate(value);
  const seconds = differenceInSeconds(now, date);

  if (seconds < 60) {
    return "just now";
  }

  const minutes = differenceInMinutes(now, date);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = differenceInHours(now, date);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = differenceInDays(now, date);

  if (days < 7) {
    return `${days}d ago`;
  }

  return isSameYear(now, date)
    ? format(date, "MMM d")
    : format(date, "MMM d, yyyy");
};

export const formatShortDate = (value: string | Date): string => {
  const date = toDate(value);

  return isSameYear(new Date(), date)
    ? format(date, "MMM d")
    : format(date, "MMM d, yyyy");
};

export const formatDateTime = (value: string | Date): string =>
  format(toDate(value), "MMM d, h:mm a");

export const formatLogTime = (value: string): string => {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "" : format(date, "HH:mm:ss.SSS");
};

export const formatElapsed = (milliseconds: number): string => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
};

export const formatStepDuration = (milliseconds: number): string => {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));

  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  return `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s`;
};

export const formatNumber = (value: number): string =>
  value.toLocaleString("en-US");

export const formatPercent = (value: number): string => `${value.toFixed(1)}%`;

export const shortSha = (sha: string | null): string =>
  sha ? sha.slice(0, 7) : "—";

export const shortId = (id: string): string => id.replaceAll("-", "").slice(-9);

export const hostFromUrl = (url: string): string => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

export const repositoryNameFromUrl = (url: string): string => {
  try {
    return new URL(url).pathname.replace(/^\/|\.git$/g, "");
  } catch {
    return url;
  }
};
