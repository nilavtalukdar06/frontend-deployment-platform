import { randomUUID } from "node:crypto";
import { clickhouseClient } from "../db/clickhouse";
import type { DeploymentLogEventPayload } from "../schemas/deployment-log-event.schema";

const LOG_EVENTS_TABLE = "log_events";

export interface DeploymentLogRow {
  id: string;
  sequence: number;
  loggedAt: string;
  metadata: string | null;
  message: string;
}

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

  static async listForDeployment(
    deploymentId: string,
    after: number,
    limit: number,
  ): Promise<DeploymentLogRow[]> {
    const result = await clickhouseClient.query({
      query: `
        SELECT
          toString(event_id) AS id,
          JSONExtractUInt(metadata, 'sequence') AS sequence,
          toString(timestamp) AS loggedAt,
          metadata,
          log AS message
        FROM ${LOG_EVENTS_TABLE}
        WHERE deployment_id = {deploymentId:String}
          AND sequence > {after:UInt64}
        ORDER BY sequence ASC, timestamp ASC
        LIMIT 1 BY sequence
        LIMIT {limit:UInt32}
      `,
      query_params: { deploymentId, after, limit },
      format: "JSONEachRow",
    });

    return result.json<DeploymentLogRow>();
  }
}
