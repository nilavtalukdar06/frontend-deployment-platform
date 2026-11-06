import { existsSync } from "node:fs";
import path from "node:path";
import { KafkaJS } from "@confluentinc/kafka-javascript";
import type { Logger } from "pino";

export { KafkaJS };

export type KafkaSaslMechanism = "scram-sha-256" | "scram-sha-512" | "plain";

export interface KafkaConnectionConfig {
  clientId: string;
  brokers: string[];
  saslMechanism: KafkaSaslMechanism;
  username: string;
  password: string;
  caCertPath: string;
}

export const createKafkaLogger = (logger: Logger): Logger =>
  logger.child({ component: "kafka" });

const createPinoKafkaLogger = (
  logger: Logger,
  bindings: Record<string, unknown> = {},
): KafkaJS.Logger => {
  const child = logger.child(bindings);

  return {
    info: (message, extra) => child.debug(extra ?? {}, message),
    debug: (message, extra) => child.trace(extra ?? {}, message),
    warn: (message, extra) => child.warn(extra ?? {}, message),
    error: (message, extra) => child.error(extra ?? {}, message),
    namespace: (namespace) =>
      createPinoKafkaLogger(logger, { ...bindings, namespace }),
    setLogLevel: () => undefined,
  };
};

const resolveCaCertificatePath = (caCertPath: string): string => {
  const caPath = path.resolve(caCertPath);

  if (!existsSync(caPath)) {
    throw new Error(`kafka ca certificate not found at "${caPath}"`);
  }

  return caPath;
};

export const createKafka = (
  config: KafkaConnectionConfig,
  kafkaLogger: Logger,
): KafkaJS.Kafka =>
  new KafkaJS.Kafka({
    kafkaJS: {
      clientId: config.clientId,
      brokers: config.brokers,
      ssl: true,
      sasl: {
        mechanism: config.saslMechanism,
        username: config.username,
        password: config.password,
      },
      connectionTimeout: 10_000,
      authenticationTimeout: 10_000,
      requestTimeout: 30_000,
      logger: createPinoKafkaLogger(kafkaLogger),
      logLevel: KafkaJS.logLevel.INFO,
    },
    "ssl.ca.location": resolveCaCertificatePath(config.caCertPath),
    "ssl.endpoint.identification.algorithm": "https",
  });
