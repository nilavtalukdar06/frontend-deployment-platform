export const ClientEvent = {
  SUBSCRIBE: "deployment:subscribe",
  UNSUBSCRIBE: "deployment:unsubscribe",
} as const;

export const ServerEvent = {
  LOG: "deployment:log",
  AUTH_EXPIRED: "auth:expired",
} as const;

export const deploymentRoom = (deploymentId: string): string =>
  `deployment:${deploymentId}`;
