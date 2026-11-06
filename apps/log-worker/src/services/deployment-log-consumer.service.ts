import type { KafkaJS } from "@confluentinc/kafka-javascript";
import { env } from "../config/env";
import { connectConsumer } from "../lib/kafka";
import { logger as rootLogger } from "../lib/logger";

const logger = rootLogger.child({ component: "deployment-log-consumer" });

const decodeHeaders = (
  headers: KafkaJS.IHeaders | undefined,
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(headers ?? {}).map(([name, value]) => [
      name,
      String(Array.isArray(value) ? value.join(",") : value),
    ]),
  );

const parseValue = (value: Buffer | null): unknown => {
  const raw = value?.toString("utf8") ?? "";

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

const handleMessage: KafkaJS.EachMessageHandler = async ({
  topic,
  partition,
  message,
}) => {
  logger.info(
    {
      topic,
      partition,
      offset: message.offset,
      key: message.key?.toString("utf8") ?? null,
      headers: decodeHeaders(message.headers),
      event: parseValue(message.value),
    },
    "deployment log event consumed",
  );
};

export const DeploymentLogConsumerService = {
  async start(): Promise<void> {
    const consumer = await connectConsumer();

    await consumer.subscribe({ topics: [env.KAFKA_DEPLOYMENT_LOGS_TOPIC] });
    await consumer.run({ eachMessage: handleMessage });

    logger.info(
      {
        topic: env.KAFKA_DEPLOYMENT_LOGS_TOPIC,
        groupId: env.KAFKA_CONSUMER_GROUP_ID,
      },
      "log-worker ready",
    );
  },
};
