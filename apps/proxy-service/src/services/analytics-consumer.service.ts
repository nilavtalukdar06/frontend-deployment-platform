import type { KafkaJS } from "@confluentinc/kafka-javascript";
import { env } from "../config/env";
import { connectConsumer } from "../lib/kafka";
import { logger as rootLogger } from "../lib/logger";
import { PageViewRepository } from "../repositories/page-view.repository";
import {
  pageViewEventSchema,
  type PageViewEventPayload,
} from "../schemas/page-view-event.schema";

const logger = rootLogger.child({ component: "analytics-consumer" });

const INSERT_RETRY_DELAY_MS = 1_000;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const parseEvent = (
  message: KafkaJS.KafkaMessage,
  partition: number,
): PageViewEventPayload | undefined => {
  const location = { partition, offset: message.offset };

  let value: unknown;
  try {
    value = JSON.parse(message.value?.toString("utf8") ?? "");
  } catch {
    logger.warn(location, "skipping page view event that is not json");
    return undefined;
  }

  const parsed = pageViewEventSchema.safeParse(value);

  if (!parsed.success) {
    logger.warn(
      { ...location, issues: parsed.error.issues },
      "skipping malformed page view event",
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
    await PageViewRepository.insertMany(events);
  } catch (err) {
    logger.error(
      { err, partition: batch.partition, size: events.length },
      "failed to insert page views into clickhouse, batch will be retried",
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
    "page views stored",
  );
};

export const AnalyticsConsumerService = {
  async start(): Promise<void> {
    const consumer = await connectConsumer();

    await consumer.subscribe({ topics: [env.KAFKA_ANALYTICS_TOPIC] });
    await consumer.run({ eachBatch: handleBatch });

    logger.info(
      {
        topic: env.KAFKA_ANALYTICS_TOPIC,
        groupId: env.KAFKA_CONSUMER_GROUP_ID,
      },
      "analytics consumer ready",
    );
  },
};
