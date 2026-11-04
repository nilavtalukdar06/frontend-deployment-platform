import { existsSync } from "node:fs";
import path from "node:path";
import { KafkaJS } from "@confluentinc/kafka-javascript";
import { env } from "../config/env";
import { logger as rootLogger } from "./logger";
import { withTimeout } from "../utils/with-timeout";

export type KafkaProducer = KafkaJS.Producer;

const kafkaLogger = rootLogger.child({ component: "kafka" });

const createPinoKafkaLogger = (
  bindings: Record<string, unknown> = {},
): KafkaJS.Logger => {
  const child = kafkaLogger.child(bindings);

  return {
    info: (message, extra) => child.debug(extra ?? {}, message),
    debug: (message, extra) => child.trace(extra ?? {}, message),
    warn: (message, extra) => child.warn(extra ?? {}, message),
    error: (message, extra) => child.error(extra ?? {}, message),
    namespace: (namespace) => createPinoKafkaLogger({ ...bindings, namespace }),
    setLogLevel: () => undefined,
  };
};

const resolveCaCertificatePath = (): string => {
  const caPath = path.resolve(env.KAFKA_CA_CERT_PATH);

  if (!existsSync(caPath)) {
    throw new Error(`kafka ca certificate not found at "${caPath}"`);
  }

  return caPath;
};

const connectTimeoutMs = 20_000;

let producer: KafkaProducer | undefined;

const createProducer = (): KafkaProducer => {
  const kafka = new KafkaJS.Kafka({
    kafkaJS: {
      clientId: env.KAFKA_CLIENT_ID,
      brokers: env.KAFKA_BROKERS,
      ssl: true,
      sasl: {
        mechanism: env.KAFKA_SASL_MECHANISM,
        username: env.KAFKA_USERNAME,
        password: env.KAFKA_PASSWORD,
      },
      connectionTimeout: 10_000,
      authenticationTimeout: 10_000,
      requestTimeout: 30_000,
      logger: createPinoKafkaLogger(),
      logLevel: KafkaJS.logLevel.INFO,
    },
    "ssl.ca.location": resolveCaCertificatePath(),
    "ssl.endpoint.identification.algorithm": "https",
  });

  return kafka.producer({
    kafkaJS: {
      idempotent: true,
      acks: -1,
      maxInFlightRequests: 5,
      compression: KafkaJS.CompressionTypes.ZSTD,
      allowAutoTopicCreation: false,
    },
    "linger.ms": 20,
    "batch.num.messages": 10_000,
    "batch.size": 1_000_000,
    "message.timeout.ms": 30_000,
    "retry.backoff.ms": 200,
    "retry.backoff.max.ms": 2_000,
    "queue.buffering.max.messages": 100_000,
  });
};

export const connectProducer = async (): Promise<KafkaProducer> => {
  if (producer) {
    return producer;
  }

  const candidate = createProducer();

  try {
    await withTimeout(
      candidate.connect(),
      connectTimeoutMs,
      `kafka producer did not connect within ${connectTimeoutMs}ms`,
    );
  } catch (err) {
    await candidate.disconnect().catch(() => undefined);
    throw err;
  }

  producer = candidate;
  kafkaLogger.info(
    { brokers: env.KAFKA_BROKERS, topic: env.KAFKA_DEPLOYMENT_LOGS_TOPIC },
    "kafka producer connected",
  );
  return producer;
};

export const disconnectProducer = async (timeoutMs: number): Promise<void> => {
  const current = producer;
  producer = undefined;

  if (!current) {
    return;
  }

  try {
    await current.flush({ timeout: timeoutMs });
  } catch (err) {
    kafkaLogger.error({ err }, "kafka producer flush failed");
  }

  try {
    await withTimeout(
      current.disconnect(),
      timeoutMs,
      `kafka producer did not disconnect within ${timeoutMs}ms`,
    );
    kafkaLogger.info("kafka producer disconnected");
  } catch (err) {
    kafkaLogger.error({ err }, "kafka producer disconnect failed");
  }
};
