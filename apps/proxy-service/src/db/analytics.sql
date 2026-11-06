CREATE TABLE page_views (
  event_id UUID,
  timestamp DateTime MATERIALIZED now(),
  site String,
  deployment_id String,
  route String
)
ENGINE=MergeTree PARTITION BY toYYYYMM(timestamp)
ORDER BY (deployment_id, route, timestamp);
