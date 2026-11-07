import { fetchDeploymentLogsAfter } from "@/features/deployment-logs/api";
import {
  appendBySequence,
  hasEndEvent,
  hasSequenceGap,
  lastSequenceOf,
  mergeBySequence,
} from "@/features/deployment-logs/log-merge";
import type {
  DeploymentLog,
  DeploymentLogMessage,
} from "@/features/deployment-logs/types";
import { isTerminalStatus } from "@/features/deployments/status";
import { ApiRequestError } from "@/lib/api-error";
import {
  acquireSocket,
  releaseSocket,
  type RealtimeSocket,
} from "@/lib/socket";

export type LogStreamPhase =
  | "connecting"
  | "syncing"
  | "live"
  | "reconnecting"
  | "offline"
  | "ended"
  | "error";

export interface DeploymentLogSnapshot {
  phase: LogStreamPhase;
  entries: readonly DeploymentLog[];
  error: unknown;
}

export interface DeploymentLogStoreOptions {
  deploymentId: string;
  isTerminal: boolean;
  onStatusEvent: () => void;
  onEnd: () => void;
}

type LiveSubscription = "subscribed" | "unavailable" | "not-found" | "skipped";

const SUBSCRIBE_TIMEOUT_MS = 5000;
const CONNECT_GRACE_MS = 4000;
const GAP_RETRY_ATTEMPTS = 3;
const GAP_RETRY_DELAY_MS = 750;
const END_RETRY_ATTEMPTS = 3;
const END_RETRY_DELAY_MS = 1000;
const OFFLINE_RESYNC_MS = 3000;
const TERMINAL_SETTLE_MS = 1500;
const HIDDEN_FLUSH_DELAY_MS = 250;

const initialSnapshot: DeploymentLogSnapshot = {
  phase: "connecting",
  entries: [],
  error: null,
};

const wait = (milliseconds: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, milliseconds);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });

const toDeploymentLog = ({
  sequence,
  timestamp,
  type,
  level,
  step,
  source,
  phase,
  status,
  message,
}: DeploymentLogMessage): DeploymentLog => ({
  sequence,
  timestamp,
  type,
  level,
  step,
  source,
  phase,
  status,
  message,
});

export class DeploymentLogStore {
  private snapshot: DeploymentLogSnapshot = initialSnapshot;
  private readonly listeners = new Set<() => void>();
  private readonly buffer = new Map<number, DeploymentLog>();
  private known = new Set<number>();
  private pending: DeploymentLog[] = [];
  private cancelFlush: (() => void) | null = null;
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();
  private socket: RealtimeSocket | null = null;
  private abortController: AbortController | null = null;
  private generation = 0;
  private buffering = true;
  private subscribed = false;
  private running = false;
  private finished = false;
  private endReceived = false;
  private terminal: boolean;
  private readonly options: DeploymentLogStoreOptions;

  constructor(options: DeploymentLogStoreOptions) {
    this.options = options;
    this.terminal = options.isTerminal;
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.snapshot;

  start = () => {
    if (this.running) {
      return;
    }

    this.running = true;
    this.finished = false;

    if (this.terminal) {
      void this.sync();
      return;
    }

    const socket = acquireSocket();
    this.socket = socket;
    socket.on("deployment:log", this.handleLog);
    socket.on("connect", this.handleConnect);
    socket.on("disconnect", this.handleDisconnect);

    if (socket.connected) {
      void this.sync();
      return;
    }

    this.schedule(() => {
      if (!this.socket?.connected && this.snapshot.phase === "connecting") {
        void this.sync();
      }
    }, CONNECT_GRACE_MS);
  };

  stop = () => {
    this.running = false;
    this.generation += 1;
    this.abortController?.abort();
    this.abortController = null;
    this.clearTimers();
    this.cancelFlush?.();
    this.cancelFlush = null;
    this.pending = [];
    this.buffer.clear();
    this.buffering = true;
    this.detachSocket();
  };

  retry = () => {
    this.stop();
    this.snapshot = { ...this.snapshot, phase: "connecting", error: null };
    this.emit();
    this.start();
  };

  markTerminal = () => {
    if (this.terminal) {
      return;
    }

    this.terminal = true;

    if (!this.running || this.finished) {
      return;
    }

    this.schedule(() => {
      void this.sync();
    }, TERMINAL_SETTLE_MS);
  };

  private emit() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private update(next: Partial<DeploymentLogSnapshot>) {
    this.snapshot = { ...this.snapshot, ...next };
    this.emit();
  }

  private schedule(callback: () => void, delay: number) {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      callback();
    }, delay);
    this.timers.add(timer);
  }

  private clearTimers() {
    for (const timer of this.timers) {
      clearTimeout(timer);
    }

    this.timers.clear();
  }

  private async subscribeToLive(): Promise<LiveSubscription> {
    const socket = this.socket;

    if (!socket || this.terminal) {
      return "skipped";
    }

    if (!socket.connected) {
      return "unavailable";
    }

    try {
      const ack = await socket
        .timeout(SUBSCRIBE_TIMEOUT_MS)
        .emitWithAck("deployment:subscribe", {
          deploymentId: this.options.deploymentId,
        });

      if (ack.ok) {
        this.subscribed = true;

        if (isTerminalStatus(ack.data.status)) {
          this.terminal = true;
        }

        return "subscribed";
      }

      return ack.code === "NOT_FOUND" ? "not-found" : "unavailable";
    } catch {
      return "unavailable";
    }
  }

  private async fetchHistory(
    entries: readonly DeploymentLog[],
    signal: AbortSignal,
  ): Promise<DeploymentLog[]> {
    let merged = mergeBySequence(
      entries,
      await fetchDeploymentLogsAfter(
        this.options.deploymentId,
        lastSequenceOf(entries),
        signal,
      ),
    );

    for (
      let attempt = 0;
      attempt < GAP_RETRY_ATTEMPTS &&
      hasSequenceGap(lastSequenceOf(merged), this.buffer.values());
      attempt += 1
    ) {
      await wait(GAP_RETRY_DELAY_MS, signal);
      merged = mergeBySequence(
        merged,
        await fetchDeploymentLogsAfter(
          this.options.deploymentId,
          lastSequenceOf(merged),
          signal,
        ),
      );
    }

    for (
      let attempt = 0;
      attempt < END_RETRY_ATTEMPTS &&
      this.terminal &&
      !this.options.isTerminal &&
      !hasEndEvent(merged) &&
      !hasEndEvent(Array.from(this.buffer.values()));
      attempt += 1
    ) {
      await wait(END_RETRY_DELAY_MS, signal);
      merged = mergeBySequence(
        merged,
        await fetchDeploymentLogsAfter(
          this.options.deploymentId,
          lastSequenceOf(merged),
          signal,
        ),
      );
    }

    return merged;
  }

  private async sync() {
    if (this.pending.length > 0) {
      this.cancelFlush?.();
      this.flush();
    }

    if (this.finished) {
      return;
    }

    const generation = ++this.generation;
    this.abortController?.abort();
    const abortController = new AbortController();
    this.abortController = abortController;
    this.clearTimers();
    this.buffering = true;

    const hasEntries = this.snapshot.entries.length > 0;

    if (!hasEntries && this.snapshot.phase !== "connecting") {
      this.update({ phase: "connecting", error: null });
    }

    const live = await this.subscribeToLive();

    if (generation !== this.generation) {
      return;
    }

    if (live === "not-found") {
      this.update({
        phase: "error",
        error: new ApiRequestError(
          404,
          "NOT_FOUND",
          "The requested deployment could not be found",
        ),
      });
      return;
    }

    if (!hasEntries) {
      this.update({ phase: "syncing" });
    }

    try {
      const history = await this.fetchHistory(
        this.snapshot.entries,
        abortController.signal,
      );

      if (generation !== this.generation) {
        return;
      }

      const entries = mergeBySequence(history, this.buffer.values());
      this.known = new Set(entries.map((entry) => entry.sequence));
      this.buffer.clear();
      this.buffering = false;

      if (this.terminal || hasEndEvent(entries)) {
        this.terminal = true;
        this.snapshot = { phase: "ended", entries, error: null };
        this.emit();
        this.finish();
        return;
      }

      this.snapshot = {
        phase: live === "subscribed" ? "live" : "offline",
        entries,
        error: null,
      };
      this.emit();

      if (live !== "subscribed") {
        this.schedule(() => {
          void this.sync();
        }, OFFLINE_RESYNC_MS);
      }
    } catch (error) {
      if (generation !== this.generation || abortController.signal.aborted) {
        return;
      }

      if (this.snapshot.entries.length > 0) {
        this.update({ phase: "offline" });
        this.schedule(() => {
          void this.sync();
        }, OFFLINE_RESYNC_MS);
        return;
      }

      this.update({ phase: "error", error });
    }
  }

  private finish() {
    if (this.finished) {
      return;
    }

    this.finished = true;
    this.clearTimers();
    this.detachSocket();

    if (!this.options.isTerminal) {
      this.options.onEnd();
    }
  }

  private detachSocket() {
    const socket = this.socket;

    if (!socket) {
      return;
    }

    socket.off("deployment:log", this.handleLog);
    socket.off("connect", this.handleConnect);
    socket.off("disconnect", this.handleDisconnect);

    if (this.subscribed && socket.connected) {
      socket.emit(
        "deployment:unsubscribe",
        { deploymentId: this.options.deploymentId },
        () => undefined,
      );
    }

    this.subscribed = false;
    this.socket = null;
    releaseSocket();
  }

  private handleLog = (message: DeploymentLogMessage) => {
    if (message.deploymentId !== this.options.deploymentId) {
      return;
    }

    const entry = toDeploymentLog(message);

    if (this.buffering) {
      if (!this.buffer.has(entry.sequence)) {
        this.buffer.set(entry.sequence, entry);
      }
      return;
    }

    if (this.known.has(entry.sequence)) {
      return;
    }

    this.pending.push(entry);

    if (entry.type === "status") {
      this.options.onStatusEvent();
    }

    if (entry.type === "end") {
      this.endReceived = true;
      this.terminal = true;
    }

    this.scheduleFlush();
  };

  private handleConnect = () => {
    if (!this.running || this.finished) {
      return;
    }

    void this.sync();
  };

  private handleDisconnect = () => {
    if (!this.running || this.finished) {
      return;
    }

    this.subscribed = false;
    this.update({ phase: "reconnecting" });
    this.schedule(() => {
      if (this.running && !this.finished && !this.socket?.connected) {
        void this.sync();
      }
    }, OFFLINE_RESYNC_MS);
  };

  private scheduleFlush() {
    if (this.cancelFlush) {
      return;
    }

    if (
      typeof document === "undefined" ||
      typeof requestAnimationFrame === "undefined" ||
      document.hidden
    ) {
      const timer = setTimeout(this.flush, HIDDEN_FLUSH_DELAY_MS);
      this.cancelFlush = () => clearTimeout(timer);
      return;
    }

    const frame = requestAnimationFrame(this.flush);
    this.cancelFlush = () => cancelAnimationFrame(frame);
  }

  private flush = () => {
    this.cancelFlush = null;
    const incoming = this.pending;
    this.pending = [];

    const entries = appendBySequence(
      this.snapshot.entries,
      incoming,
      this.known,
    );

    if (this.endReceived) {
      this.snapshot = { phase: "ended", entries, error: null };
      this.emit();
      this.finish();
      return;
    }

    if (entries !== this.snapshot.entries) {
      this.update({ entries });
    }
  };
}
