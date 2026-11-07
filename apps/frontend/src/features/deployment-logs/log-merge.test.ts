import { describe, expect, it } from "vitest";
import {
  appendBySequence,
  hasEndEvent,
  hasSequenceGap,
  lastSequenceOf,
  mergeBySequence,
} from "@/features/deployment-logs/log-merge";
import type { DeploymentLog } from "@/features/deployment-logs/types";

const log = (
  sequence: number,
  overrides: Partial<DeploymentLog> = {},
): DeploymentLog => ({
  sequence,
  timestamp: new Date(Date.UTC(2026, 10, 7, 0, 41, sequence)).toISOString(),
  type: "log",
  level: "info",
  step: "build",
  source: "stdout",
  phase: null,
  status: null,
  message: `line ${sequence}`,
  ...overrides,
});

const sequences = (entries: readonly DeploymentLog[]) =>
  entries.map((entry) => entry.sequence);

describe("mergeBySequence", () => {
  it("merges history with the live buffer without duplicates", () => {
    const history = [log(1), log(2), log(3), log(4)];
    const buffered = [log(3), log(4), log(5), log(6)];

    expect(sequences(mergeBySequence(history, buffered))).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
  });

  it("orders out-of-order input by sequence", () => {
    expect(sequences(mergeBySequence([log(5), log(1)], [log(3)]))).toEqual([
      1, 3, 5,
    ]);
  });

  it("keeps the first copy of a duplicated sequence", () => {
    const merged = mergeBySequence(
      [log(1, { message: "from history" })],
      [log(1, { message: "from live" })],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0].message).toBe("from history");
  });

  it("accepts real gaps from dropped lines", () => {
    expect(sequences(mergeBySequence([log(1), log(2)], [log(7)]))).toEqual([
      1, 2, 7,
    ]);
  });
});

describe("appendBySequence", () => {
  it("appends newer live events on the fast path", () => {
    const current = [log(1), log(2)];
    const known = new Set([1, 2]);
    const next = appendBySequence(current, [log(3), log(4)], known);

    expect(sequences(next)).toEqual([1, 2, 3, 4]);
    expect(known.has(4)).toBe(true);
  });

  it("drops events that were already rendered", () => {
    const current = [log(1), log(2)];
    const known = new Set([1, 2]);
    const next = appendBySequence(current, [log(2)], known);

    expect(next).toBe(current);
  });

  it("inserts late events in sequence order", () => {
    const current = [log(1), log(3)];
    const known = new Set([1, 3]);

    expect(sequences(appendBySequence(current, [log(2)], known))).toEqual([
      1, 2, 3,
    ]);
  });

  it("deduplicates within the same batch", () => {
    const known = new Set<number>();

    expect(
      sequences(appendBySequence([], [log(4), log(4), log(5)], known)),
    ).toEqual([4, 5]);
  });
});

describe("reconnect catch-up", () => {
  it("fills missed events from history after the last rendered sequence", () => {
    const rendered = [log(1), log(2), log(3)];
    const missedHistory = [log(4), log(5)];
    const bufferedAfterResubscribe = [log(5), log(6)];

    expect(
      sequences(
        mergeBySequence(rendered, missedHistory, bufferedAfterResubscribe),
      ),
    ).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe("hasSequenceGap", () => {
  it("detects history lagging behind the live buffer", () => {
    expect(hasSequenceGap(3, [log(6), log(7)])).toBe(true);
  });

  it("reports no gap when the buffer continues history", () => {
    expect(hasSequenceGap(3, [log(4), log(5)])).toBe(false);
    expect(hasSequenceGap(5, [log(4), log(6)])).toBe(false);
  });

  it("reports no gap for an empty buffer", () => {
    expect(hasSequenceGap(3, [])).toBe(false);
  });
});

describe("helpers", () => {
  it("reads the last sequence", () => {
    expect(lastSequenceOf([])).toBe(0);
    expect(lastSequenceOf([log(1), log(9)])).toBe(9);
  });

  it("finds the end event", () => {
    expect(hasEndEvent([log(1)])).toBe(false);
    expect(hasEndEvent([log(1), log(2, { type: "end" })])).toBe(true);
  });
});
