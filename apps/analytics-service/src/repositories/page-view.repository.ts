import { randomUUID } from "node:crypto";
import type { PageViewEventPayload } from "@repo/contracts/events";
import { clickhouseClient } from "../db/clickhouse";

const PAGE_VIEWS_TABLE = "page_views";

interface PageViewRow {
  event_id: string;
  site: string;
  deployment_id: string;
  route: string;
}

export interface HourlyViews {
  hour: number;
  views: number;
}

export interface RouteViews {
  route: string;
  views: number;
}

export interface PeriodTotals {
  previousViews: number;
  uniqueRoutes: number;
}

const toRow = ({
  site,
  deploymentId,
  route,
}: PageViewEventPayload): PageViewRow => ({
  event_id: randomUUID(),
  site,
  deployment_id: deploymentId,
  route,
});

const queryRows = async <T>(
  query: string,
  queryParams: Record<string, unknown>,
): Promise<T[]> => {
  const result = await clickhouseClient.query({
    query,
    query_params: queryParams,
    format: "JSONEachRow",
  });

  return result.json<T>();
};

export abstract class PageViewRepository {
  static async insertMany(
    events: readonly PageViewEventPayload[],
  ): Promise<void> {
    if (events.length === 0) {
      return;
    }

    await clickhouseClient.insert({
      table: PAGE_VIEWS_TABLE,
      values: events.map(toRow),
      format: "JSONEachRow",
    });
  }

  static async hourlyViews(
    deploymentIds: readonly string[],
    fromEpochSeconds: number,
  ): Promise<HourlyViews[]> {
    const rows = await queryRows<{ bucket: number; views: number }>(
      `SELECT
         intDiv(toUnixTimestamp(timestamp), 3600) * 3600 AS bucket,
         count() AS views
       FROM ${PAGE_VIEWS_TABLE}
       WHERE deployment_id IN {deploymentIds:Array(String)}
         AND timestamp >= toDateTime({from:UInt32})
       GROUP BY bucket
       ORDER BY bucket`,
      { deploymentIds, from: fromEpochSeconds },
    );

    return rows.map((row) => ({
      hour: Number(row.bucket),
      views: Number(row.views),
    }));
  }

  static async topRoutes(
    deploymentIds: readonly string[],
    fromEpochSeconds: number,
    limit: number,
  ): Promise<RouteViews[]> {
    const rows = await queryRows<RouteViews>(
      `SELECT route, count() AS views
       FROM ${PAGE_VIEWS_TABLE}
       WHERE deployment_id IN {deploymentIds:Array(String)}
         AND timestamp >= toDateTime({from:UInt32})
       GROUP BY route
       ORDER BY views DESC, route ASC
       LIMIT {limit:UInt32}`,
      { deploymentIds, from: fromEpochSeconds, limit },
    );

    return rows.map((row) => ({ route: row.route, views: Number(row.views) }));
  }

  static async periodTotals(
    deploymentIds: readonly string[],
    fromEpochSeconds: number,
    previousFromEpochSeconds: number,
  ): Promise<PeriodTotals> {
    const [row] = await queryRows<PeriodTotals>(
      `SELECT
         countIf(timestamp < toDateTime({from:UInt32})) AS previousViews,
         uniqExactIf(route, timestamp >= toDateTime({from:UInt32})) AS uniqueRoutes
       FROM ${PAGE_VIEWS_TABLE}
       WHERE deployment_id IN {deploymentIds:Array(String)}
         AND timestamp >= toDateTime({previousFrom:UInt32})`,
      {
        deploymentIds,
        from: fromEpochSeconds,
        previousFrom: previousFromEpochSeconds,
      },
    );

    return {
      previousViews: Number(row?.previousViews ?? 0),
      uniqueRoutes: Number(row?.uniqueRoutes ?? 0),
    };
  }
}
