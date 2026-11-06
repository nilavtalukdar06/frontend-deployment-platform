import type { KafkaJS } from "@confluentinc/kafka-javascript";
import type { Server } from "socket.io";
import { env } from "../config/env";
import { ServerEvent, deploymentRoom } from "../constants/socket-events";
import { connectConsumer } from "../lib/kafka";
import { logger as rootLogger } from "../lib/logger";
import {
  deploymentLogEventSchema,
  type DeploymentLogEvent,
} from "../schemas/deployment-log-event.schema";

const logger = rootLogger.child({ component: "deployment-log-stream" });

export interface DeploymentLogMessage {
  deploymentId: string;
  sequence: number;
  timestamp: string;
  type: string | null;
  level: string | null;
  step: string | null;
  source: string | null;
  phase: string | null;
  status: string | null;
  message: string;
}

const stringOrNull = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const toLogMessage = (event: DeploymentLogEvent): DeploymentLogMessage => ({
  deploymentId: event.deploymentId,
  sequence: event.sequence,
  timestamp: event.timestamp ?? new Date().toISOString(),
  type: stringOrNull(event["type"]),
  level: stringOrNull(event["level"]),
  step: stringOrNull(event["step"]),
  source: stringOrNull(event["source"]),
  phase: stringOrNull(event["phase"]),
  status: stringOrNull(event["status"]),
  message: event.message,
});

const parseEvent = (
  message: KafkaJS.KafkaMessage,
  partition: number,
): DeploymentLogEvent | undefined => {
  try {
    const parsed = deploymentLogEventSchema.safeParse(
      JSON.parse(message.value?.toString("utf8") ?? ""),
    );
    return parsed.success ? parsed.data : undefined;
  } catch {
    logger.warn(
      { partition, offset: message.offset },
      "skipping deployment log event that is not json",
    );
    return undefined;
  }
};

export const DeploymentLogStreamService = {
  async start(io: Server): Promise<void> {
    const consumer = await connectConsumer();

    await consumer.subscribe({ topics: [env.KAFKA_DEPLOYMENT_LOGS_TOPIC] });
    await consumer.run({
      eachBatch: async ({ batch }) => {
        for (const message of batch.messages) {
          const event = parseEvent(message, batch.partition);

          if (event) {
            io.to(deploymentRoom(event.deploymentId)).emit(
              ServerEvent.LOG,
              toLogMessage(event),
            );
          }
        }
      },
    });

    logger.info(
      {
        topic: env.KAFKA_DEPLOYMENT_LOGS_TOPIC,
        groupId: env.KAFKA_CONSUMER_GROUP_ID,
      },
      "streaming deployment logs to subscribed clients",
    );
  },
};
