import { clickhouseClient } from "../lib/clickhouse";

const LOG_EVENTS_TABLE = "log_events";

export interface DeploymentLogRow {
  id: string;
  sequence: number;
  loggedAt: string;
  metadata: string | null;
  message: string;
}

export abstract class DeploymentLogRepository {
  static async list(
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
