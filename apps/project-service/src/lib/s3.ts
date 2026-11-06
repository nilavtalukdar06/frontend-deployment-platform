import { S3Client } from "@aws-sdk/client-s3";
import { awsClientConfig } from "@repo/utils";
import { env } from "../config/env";

export const s3 = new S3Client(
  awsClientConfig({
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  }),
);
