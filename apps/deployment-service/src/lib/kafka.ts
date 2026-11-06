import { createKafka, createKafkaLogger, KafkaJS } from "@repo/kafka";
import { withTimeout } from "@repo/utils";
import { env } from "../config/env";
import { logger } from "./logger";

export type KafkaProducer = KafkaJS.Producer;

const kafkaLogger = createKafkaLogger(logger);

const connectTimeoutMs = 20_000;

let producer: KafkaProducer | undefined;

const createProducer = (): KafkaProducer =>
  createKafka(
    {
      clientId: env.KAFKA_CLIENT_ID,
      brokers: env.KAFKA_BROKERS,
      saslMechanism: env.KAFKA_SASL_MECHANISM,
      username: env.KAFKA_USERNAME,
      password: env.KAFKA_PASSWORD,
      caCertPath: env.KAFKA_CA_CERT_PATH,
    },
    kafkaLogger,
  ).producer({
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
