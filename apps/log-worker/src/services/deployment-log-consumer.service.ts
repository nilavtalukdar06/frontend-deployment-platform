import type { KafkaJS } from "@confluentinc/kafka-javascript";
import { env } from "../config/env";
import { connectConsumer } from "../lib/kafka";
import { logger as rootLogger } from "../lib/logger";
import { LogEventRepository } from "../repositories/log-event.repository";
import {
  deploymentLogEventSchema,
  type DeploymentLogEventPayload,
} from "../schemas/deployment-log-event.schema";

const logger = rootLogger.child({ component: "deployment-log-consumer" });

const INSERT_RETRY_DELAY_MS = 1_000;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const parseEvent = (
  message: KafkaJS.KafkaMessage,
  partition: number,
): DeploymentLogEventPayload | undefined => {
  const location = { partition, offset: message.offset };

  let value: unknown;
  try {
    value = JSON.parse(message.value?.toString("utf8") ?? "");
  } catch {
    logger.warn(location, "skipping deployment log event that is not json");
    return undefined;
  }

  const parsed = deploymentLogEventSchema.safeParse(value);

  if (!parsed.success) {
    logger.warn(
      { ...location, issues: parsed.error.issues },
      "skipping malformed deployment log event",
    );
    return undefined;
  }

  return parsed.data;
};

const handleBatch: KafkaJS.EachBatchHandler = async ({ batch, heartbeat }) => {
  const events = batch.messages.flatMap((message) => {
    const event = parseEvent(message, batch.partition);
    return event ? [event] : [];
  });

  try {
    await LogEventRepository.insertMany(events);
  } catch (err) {
    logger.error(
      { err, partition: batch.partition, size: events.length },
      "failed to insert deployment log events into clickhouse, batch will be retried",
    );
    await sleep(INSERT_RETRY_DELAY_MS);
    await heartbeat();
    throw err;
  }

  logger.debug(
    {
      partition: batch.partition,
      firstOffset: batch.firstOffset(),
      lastOffset: batch.lastOffset(),
      consumed: batch.messages.length,
      inserted: events.length,
    },
    "deployment log events stored",
  );
};

export const DeploymentLogConsumerService = {
  async start(): Promise<void> {
    const consumer = await connectConsumer();

    await consumer.subscribe({ topics: [env.KAFKA_DEPLOYMENT_LOGS_TOPIC] });
    await consumer.run({ eachBatch: handleBatch });

    logger.info(
      {
        topic: env.KAFKA_DEPLOYMENT_LOGS_TOPIC,
        groupId: env.KAFKA_CONSUMER_GROUP_ID,
      },
      "log-worker ready",
    );
  },
};
