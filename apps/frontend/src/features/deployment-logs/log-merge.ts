import type { DeploymentLog } from "@/features/deployment-logs/types";

const bySequence = (left: DeploymentLog, right: DeploymentLog) =>
  left.sequence - right.sequence;

export const lastSequenceOf = (entries: readonly DeploymentLog[]): number =>
  entries.length === 0 ? 0 : entries[entries.length - 1].sequence;

export const mergeBySequence = (
  ...sources: Iterable<DeploymentLog>[]
): DeploymentLog[] => {
  const unique = new Map<number, DeploymentLog>();

  for (const source of sources) {
    for (const entry of source) {
      if (!unique.has(entry.sequence)) {
        unique.set(entry.sequence, entry);
      }
    }
  }

  return Array.from(unique.values()).sort(bySequence);
};

export const appendBySequence = (
  current: readonly DeploymentLog[],
  incoming: readonly DeploymentLog[],
  known: Set<number>,
): DeploymentLog[] => {
  const fresh: DeploymentLog[] = [];

  for (const entry of incoming) {
    if (!known.has(entry.sequence)) {
      known.add(entry.sequence);
      fresh.push(entry);
    }
  }

  if (fresh.length === 0) {
    return current as DeploymentLog[];
  }

  fresh.sort(bySequence);

  if (fresh[0].sequence > lastSequenceOf(current)) {
    return current.concat(fresh);
  }

  return mergeBySequence(current, fresh);
};

export const hasSequenceGap = (
  historyLastSequence: number,
  buffered: Iterable<DeploymentLog>,
): boolean => {
  let lowest = Number.POSITIVE_INFINITY;

  for (const entry of buffered) {
    lowest = Math.min(lowest, entry.sequence);
  }

  return Number.isFinite(lowest) && lowest > historyLastSequence + 1;
};

export const hasEndEvent = (entries: readonly DeploymentLog[]): boolean =>
  entries.some((entry) => entry.type === "end");
