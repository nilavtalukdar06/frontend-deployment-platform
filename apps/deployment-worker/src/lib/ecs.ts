import { ECSClient } from "@aws-sdk/client-ecs";
import { awsClientConfig } from "@repo/utils";
import { env } from "../config/env";

export const ecs = new ECSClient(
  awsClientConfig({
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  }),
);
