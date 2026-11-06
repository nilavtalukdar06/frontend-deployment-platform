import { randomUUID } from "node:crypto";
import { clickhouseClient } from "../db/clickhouse";
import type { PageViewEventPayload } from "@repo/contracts/events";

const PAGE_VIEWS_TABLE = "page_views";

interface PageViewRow {
  event_id: string;
  site: string;
  deployment_id: string;
  route: string;
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
}
