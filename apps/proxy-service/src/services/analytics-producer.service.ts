import { env } from "../config/env";
import { connectProducer } from "../lib/kafka";
import { logger as rootLogger } from "../lib/logger";
import type { PageViewEventPayload } from "../schemas/page-view-event.schema";

const logger = rootLogger.child({ component: "analytics-producer" });

const MAX_ROUTE_LENGTH = 2_048;

export const toRoute = (urlPath: string): string => {
  const trimmed =
    urlPath.length > 1 ? urlPath.replace(/\/+$/, "") || "/" : urlPath;

  return trimmed.slice(0, MAX_ROUTE_LENGTH);
};

const publish = async (event: PageViewEventPayload): Promise<void> => {
  const producer = await connectProducer();

  await producer.send({
    topic: env.KAFKA_ANALYTICS_TOPIC,
    messages: [{ key: event.deploymentId, value: JSON.stringify(event) }],
  });
};

export const AnalyticsProducerService = {
  recordPageView(event: PageViewEventPayload): void {
    publish(event).catch((err: unknown) => {
      logger.warn({ err, route: event.route }, "failed to publish page view");
    });
  },

  async warmUp(): Promise<void> {
    await connectProducer();
  },
};
