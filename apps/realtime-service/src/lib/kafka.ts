import { existsSync } from "node:fs";
import path from "node:path";
import { KafkaJS } from "@confluentinc/kafka-javascript";
import { env } from "../config/env";
import { logger as rootLogger } from "./logger";
import { withTimeout } from "../utils/with-timeout";

export type KafkaConsumer = KafkaJS.Consumer;

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

let consumer: KafkaConsumer | undefined;

const createConsumer = (): KafkaConsumer => {
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

  return kafka.consumer({
    kafkaJS: {
      groupId: env.KAFKA_CONSUMER_GROUP_ID,
      fromBeginning: env.KAFKA_CONSUMER_FROM_BEGINNING,
      sessionTimeout: 30_000,
      heartbeatInterval: 3_000,
    },
  });
};

export const connectConsumer = async (): Promise<KafkaConsumer> => {
  if (consumer) {
    return consumer;
  }

  const candidate = createConsumer();

  try {
    await withTimeout(
      candidate.connect(),
      connectTimeoutMs,
      `kafka consumer did not connect within ${connectTimeoutMs}ms`,
    );
  } catch (err) {
    await candidate.disconnect().catch(() => undefined);
    throw err;
  }

  consumer = candidate;
  kafkaLogger.info(
    {
      brokers: env.KAFKA_BROKERS,
      groupId: env.KAFKA_CONSUMER_GROUP_ID,
      topic: env.KAFKA_DEPLOYMENT_LOGS_TOPIC,
    },
    "kafka consumer connected",
  );
  return consumer;
};

export const disconnectConsumer = async (timeoutMs: number): Promise<void> => {
  const current = consumer;
  consumer = undefined;

  if (!current) {
    return;
  }

  try {
    await withTimeout(
      current.disconnect(),
      timeoutMs,
      `kafka consumer did not disconnect within ${timeoutMs}ms`,
    );
    kafkaLogger.info("kafka consumer disconnected");
  } catch (err) {
    kafkaLogger.error({ err }, "kafka consumer disconnect failed");
  }
};
