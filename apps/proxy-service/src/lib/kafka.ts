import { createKafka, createKafkaLogger, KafkaJS } from "@repo/kafka";
import { withTimeout } from "@repo/utils";
import { env } from "../config/env";
import { logger } from "./logger";

export type KafkaProducer = KafkaJS.Producer;

const kafkaLogger = createKafkaLogger(logger);

const connectTimeoutMs = 20_000;

let kafka: KafkaJS.Kafka | undefined;

const getKafka = (): KafkaJS.Kafka => {
  kafka ??= createKafka(
    {
      clientId: env.KAFKA_CLIENT_ID,
      brokers: env.KAFKA_BROKERS,
      saslMechanism: env.KAFKA_SASL_MECHANISM,
      username: env.KAFKA_USERNAME,
      password: env.KAFKA_PASSWORD,
      caCertPath: env.KAFKA_CA_CERT_PATH,
    },
    kafkaLogger,
  );

  return kafka;
};

let producerConnection: Promise<KafkaProducer> | undefined;

const openProducer = async (): Promise<KafkaProducer> => {
  const candidate = getKafka().producer({
    kafkaJS: { acks: 1, allowAutoTopicCreation: false },
  });

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

  kafkaLogger.info(
    { brokers: env.KAFKA_BROKERS, topic: env.KAFKA_ANALYTICS_TOPIC },
    "kafka producer connected",
  );
  return candidate;
};

export const connectProducer = (): Promise<KafkaProducer> => {
  if (!producerConnection) {
    const connection = openProducer();
    producerConnection = connection;
    connection.catch(() => {
      if (producerConnection === connection) {
        producerConnection = undefined;
      }
    });
  }

  return producerConnection;
};

export const disconnectProducer = async (timeoutMs: number): Promise<void> => {
  const connection = producerConnection;
  producerConnection = undefined;

  if (!connection) {
    return;
  }

  try {
    const current = await connection;
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
