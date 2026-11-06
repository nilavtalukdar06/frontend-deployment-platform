import type { Logger } from "pino";
import { withTimeout } from "@repo/utils";
import { createKafka, type KafkaConnectionConfig, type KafkaJS } from "./kafka";

export type KafkaConsumer = KafkaJS.Consumer;

export interface KafkaConsumerOptions {
  connection: KafkaConnectionConfig;
  kafkaLogger: Logger;
  groupId: string;
  fromBeginning: boolean;
  topic: string;
}

export interface KafkaConsumerConnection {
  connect(): Promise<KafkaConsumer>;
  disconnect(timeoutMs: number): Promise<void>;
}

const connectTimeoutMs = 20_000;

export const createKafkaConsumerConnection = ({
  connection,
  kafkaLogger,
  groupId,
  fromBeginning,
  topic,
}: KafkaConsumerOptions): KafkaConsumerConnection => {
  let consumer: KafkaConsumer | undefined;

  const createConsumer = (): KafkaConsumer =>
    createKafka(connection, kafkaLogger).consumer({
      kafkaJS: {
        groupId,
        fromBeginning,
        sessionTimeout: 30_000,
        heartbeatInterval: 3_000,
      },
    });

  const connect = async (): Promise<KafkaConsumer> => {
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
      { brokers: connection.brokers, groupId, topic },
      "kafka consumer connected",
    );
    return consumer;
  };

  const disconnect = async (timeoutMs: number): Promise<void> => {
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

  return { connect, disconnect };
};
