import { randomUUID } from "node:crypto";
import { clickhouseClient } from "../db/clickhouse";
import type { DeploymentLogEventPayload } from "../schemas/deployment-log-event.schema";

const LOG_EVENTS_TABLE = "log_events";

interface LogEventRow {
  event_id: string;
  deployment_id: string;
  project_id: string;
  log: string;
  metadata: string | null;
}

const toRow = ({
  deploymentId,
  projectId,
  message,
  ...metadata
}: DeploymentLogEventPayload): LogEventRow => ({
  event_id: randomUUID(),
  deployment_id: deploymentId,
  project_id: projectId ?? "",
  log: message,
  metadata: JSON.stringify(metadata),
});

export abstract class LogEventRepository {
  static async insertMany(
    events: readonly DeploymentLogEventPayload[],
  ): Promise<void> {
    if (events.length === 0) {
      return;
    }

    await clickhouseClient.insert({
      table: LOG_EVENTS_TABLE,
      values: events.map(toRow),
      format: "JSONEachRow",
    });
  }
}
