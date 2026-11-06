export interface AwsClientEnv {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

export interface AwsClientConfig {
  region: string;
  credentials?: { accessKeyId: string; secretAccessKey: string };
}

export const awsClientConfig = ({
  region,
  accessKeyId,
  secretAccessKey,
}: AwsClientEnv): AwsClientConfig => ({
  region,
  credentials:
    accessKeyId && secretAccessKey
      ? { accessKeyId, secretAccessKey }
      : undefined,
});
