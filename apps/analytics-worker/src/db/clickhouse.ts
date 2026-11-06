import { createClient } from "@clickhouse/client";
import { env } from "../config/env";

export const clickhouseClient = createClient({
  url: env.CLICKHOUSE_URL,
  username: env.CLICKHOUSE_USERNAME,
  password: env.CLICKHOUSE_PASSWORD,
});
