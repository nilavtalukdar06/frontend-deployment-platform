import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  DeploymentLog,
  DeploymentLogMessage,
} from "@/features/deployment-logs/types";

const DEPLOYMENT_ID = "0192f5a4-8c2f-7d4b-ae3f-6a9b2c3d4e5f";

type Handler = (...args: unknown[]) => void;

const fakeSocket = {
  connected: true,
  handlers: new Map<string, Set<Handler>>(),
  emitted: [] as { event: string; payload: unknown }[],
  subscribeAck: {
    ok: true,
    data: { deploymentId: DEPLOYMENT_ID, status: "building" },
  } as unknown,
  on(event: string, handler: Handler) {
    const handlers = this.handlers.get(event) ?? new Set<Handler>();
    handlers.add(handler);
    this.handlers.set(event, handlers);
  },
  off(event: string, handler: Handler) {
    this.handlers.get(event)?.delete(handler);
  },
  emit(event: string, payload: unknown, ack?: () => void) {
    this.emitted.push({ event, payload });
    ack?.();
  },
  timeout() {
    return {
      emitWithAck: async (event: string, payload: unknown) => {
        this.emitted.push({ event, payload });
        return this.subscribeAck;
      },
    };
  },
  deliver(message: DeploymentLogMessage) {
    for (const handler of this.handlers.get("deployment:log") ?? []) {
      handler(message);
    }
  },
};

const historyCalls: number[] = [];
let historyResponder: (after: number) => Promise<DeploymentLog[]>;

vi.mock("@/lib/socket", () => ({
  acquireSocket: () => fakeSocket,
  releaseSocket: () => undefined,
}));

vi.mock("@/features/deployment-logs/api", () => ({
  fetchDeploymentLogsAfter: (_id: string, after: number) => {
    historyCalls.push(after);
    return historyResponder(after);
  },
}));

const { DeploymentLogStore } =
  await import("@/features/deployment-logs/deployment-log-store");

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

const live = (sequence: number, overrides: Partial<DeploymentLog> = {}) => ({
  ...log(sequence, overrides),
  deploymentId: DEPLOYMENT_ID,
});

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => log(from + index));

const sequencesOf = (store: InstanceType<typeof DeploymentLogStore>) =>
  store.getSnapshot().entries.map((entry) => entry.sequence);

const createStore = (overrides: { isTerminal?: boolean } = {}) => {
  const callbacks = { onStatusEvent: vi.fn(), onEnd: vi.fn() };
  const store = new DeploymentLogStore({
    deploymentId: DEPLOYMENT_ID,
    isTerminal: overrides.isTerminal ?? false,
    ...callbacks,
  });

  return { store, ...callbacks };
};

beforeEach(() => {
  vi.useFakeTimers();
  fakeSocket.connected = true;
  fakeSocket.handlers.clear();
  fakeSocket.emitted = [];
  fakeSocket.subscribeAck = {
    ok: true,
    data: { deploymentId: DEPLOYMENT_ID, status: "building" },
  };
  historyCalls.length = 0;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("DeploymentLogStore", () => {
  it("subscribes before loading history and merges the buffered live events", async () => {
    historyResponder = async () => {
      fakeSocket.deliver(live(3));
      fakeSocket.deliver(live(4));
      fakeSocket.deliver(live(5));
      return range(1, 4);
    };
    const { store } = createStore();

    store.start();
    await vi.advanceTimersByTimeAsync(0);

    expect(fakeSocket.emitted[0]).toEqual({
      event: "deployment:subscribe",
      payload: { deploymentId: DEPLOYMENT_ID },
    });
    expect(historyCalls).toEqual([0]);
    expect(store.getSnapshot().phase).toBe("live");
    expect(sequencesOf(store)).toEqual([1, 2, 3, 4, 5]);

    store.stop();
  });

  it("does not render live events until history has been merged", async () => {
    let releaseHistory: (entries: DeploymentLog[]) => void = () => undefined;
    historyResponder = () =>
      new Promise((resolve) => {
        releaseHistory = resolve;
      });
    const { store } = createStore();

    store.start();
    await vi.advanceTimersByTimeAsync(0);
    fakeSocket.deliver(live(3));
    await vi.advanceTimersByTimeAsync(500);

    expect(store.getSnapshot().phase).toBe("syncing");
    expect(store.getSnapshot().entries).toHaveLength(0);

    releaseHistory(range(1, 2));
    await vi.advanceTimersByTimeAsync(0);

    expect(sequencesOf(store)).toEqual([1, 2, 3]);
    store.stop();
  });

  it("appends live events in live mode and drops duplicates", async () => {
    historyResponder = async () => range(1, 2);
    const { store } = createStore();

    store.start();
    await vi.advanceTimersByTimeAsync(0);
    fakeSocket.deliver(live(2));
    fakeSocket.deliver(live(3));
    fakeSocket.deliver(live(3));
    fakeSocket.deliver(live(4));
    await vi.advanceTimersByTimeAsync(300);

    expect(sequencesOf(store)).toEqual([1, 2, 3, 4]);
    store.stop();
  });

  it("refetches history while it lags behind the live buffer", async () => {
    historyResponder = async (after) => {
      if (after === 0) {
        fakeSocket.deliver(live(5));
        fakeSocket.deliver(live(6));
        return range(1, 2);
      }

      return range(3, 4);
    };
    const { store } = createStore();

    store.start();
    await vi.advanceTimersByTimeAsync(2000);

    expect(historyCalls).toEqual([0, 2]);
    expect(sequencesOf(store)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(store.getSnapshot().phase).toBe("live");
    store.stop();
  });

  it("accepts real gaps after the retry budget", async () => {
    historyResponder = async (after) => {
      if (after === 0) {
        fakeSocket.deliver(live(9));
        return range(1, 2);
      }

      return [];
    };
    const { store } = createStore();

    store.start();
    await vi.advanceTimersByTimeAsync(5000);

    expect(sequencesOf(store)).toEqual([1, 2, 9]);
    expect(store.getSnapshot().phase).toBe("live");
    store.stop();
  });

  it("ends the stream on the end event and unsubscribes", async () => {
    historyResponder = async () => range(1, 2);
    const { store, onEnd, onStatusEvent } = createStore();

    store.start();
    await vi.advanceTimersByTimeAsync(0);
    fakeSocket.deliver(live(3, { type: "status", status: "ready" }));
    fakeSocket.deliver(live(4, { type: "end", status: "ready" }));
    await vi.advanceTimersByTimeAsync(300);

    expect(store.getSnapshot().phase).toBe("ended");
    expect(sequencesOf(store)).toEqual([1, 2, 3, 4]);
    expect(onStatusEvent).toHaveBeenCalledTimes(1);
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(fakeSocket.emitted.at(-1)?.event).toBe("deployment:unsubscribe");
  });

  it("catches up after a reconnect from the last rendered sequence", async () => {
    historyResponder = async () => range(1, 3);
    const { store } = createStore();

    store.start();
    await vi.advanceTimersByTimeAsync(0);

    fakeSocket.connected = false;
    for (const handler of fakeSocket.handlers.get("disconnect") ?? []) {
      handler();
    }
    expect(store.getSnapshot().phase).toBe("reconnecting");

    historyResponder = async () => {
      fakeSocket.deliver(live(6));
      return range(4, 6);
    };
    fakeSocket.connected = true;
    for (const handler of fakeSocket.handlers.get("connect") ?? []) {
      handler();
    }
    await vi.advanceTimersByTimeAsync(0);

    expect(historyCalls).toEqual([0, 3]);
    expect(sequencesOf(store)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(store.getSnapshot().phase).toBe("live");
    store.stop();
  });

  it("loads history only for a deployment that already finished", async () => {
    historyResponder = async () => [...range(1, 2), log(3, { type: "end" })];
    const { store, onEnd } = createStore({ isTerminal: true });

    store.start();
    await vi.advanceTimersByTimeAsync(0);

    expect(fakeSocket.emitted).toHaveLength(0);
    expect(store.getSnapshot().phase).toBe("ended");
    expect(sequencesOf(store)).toEqual([1, 2, 3]);
    expect(onEnd).not.toHaveBeenCalled();
  });

  it("reports a deployment the realtime service cannot find", async () => {
    fakeSocket.subscribeAck = {
      ok: false,
      code: "NOT_FOUND",
      message: "missing",
    };
    historyResponder = async () => [];
    const { store } = createStore();

    store.start();
    await vi.advanceTimersByTimeAsync(0);

    expect(store.getSnapshot().phase).toBe("error");
    expect(historyCalls).toEqual([]);
    store.stop();
  });

  it("falls back to polling history when live updates are unavailable", async () => {
    fakeSocket.subscribeAck = {
      ok: false,
      code: "SUBSCRIPTION_LIMIT",
      message: "too many",
    };
    historyResponder = async (after) =>
      after === 0 ? range(1, 2) : range(3, 3);
    const { store } = createStore();

    store.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getSnapshot().phase).toBe("offline");

    await vi.advanceTimersByTimeAsync(3000);

    expect(sequencesOf(store)).toEqual([1, 2, 3]);
    expect(store.getSnapshot().phase).toBe("offline");
    store.stop();
  });
});
