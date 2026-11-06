import { existsSync } from "node:fs";
import path from "node:path";
import { KafkaJS } from "@confluentinc/kafka-javascript";
import { env } from "../config/env";
import { withTimeout } from "../utils/with-timeout";
import { logger as rootLogger } from "./logger";

export type KafkaProducer = KafkaJS.Producer;

const kafkaLogger = rootLogger.child({ component: "kafka" });

const connectTimeoutMs = 20_000;

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

let kafka: KafkaJS.Kafka | undefined;

const getKafka = (): KafkaJS.Kafka => {
  kafka ??= new KafkaJS.Kafka({
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
