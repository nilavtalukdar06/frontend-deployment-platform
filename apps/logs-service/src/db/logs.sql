CREATE TABLE log_events (
  event_id UUID,
  timestamp DateTime MATERIALIZED now(),
  deployment_id String,
  project_id String,
  log String,
  metadata Nullable(String)
)
ENGINE=MergeTree PARTITION BY toYYYYMM(timestamp)
ORDER BY (timestamp);
