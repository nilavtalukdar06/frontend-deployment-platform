import { DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { env } from "../config/env";
import { logger } from "../lib/logger";
import { s3 } from "../lib/s3";

const outputKeyPrefix = (deploymentId: string): string =>
  `__outputs/${deploymentId}/`;

export abstract class DeploymentStorageService {
  static async deleteOutputs(deploymentId: string): Promise<number> {
    const prefix = outputKeyPrefix(deploymentId);
    let continuationToken: string | undefined;
    let deleted = 0;

    do {
      const page = await s3.send(
        new ListObjectsV2Command({
          Bucket: env.S3_BUCKET_NAME,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );
      const keys = (page.Contents ?? []).flatMap(({ Key }) =>
        Key ? [{ Key }] : [],
      );

      if (keys.length > 0) {
        const result = await s3.send(
          new DeleteObjectsCommand({
            Bucket: env.S3_BUCKET_NAME,
            Delete: { Objects: keys, Quiet: true },
          }),
        );

        if (result.Errors && result.Errors.length > 0) {
          const [first] = result.Errors;
          throw new Error(
            `failed to delete ${result.Errors.length} output objects of deployment ${deploymentId}: ${first?.Key} ${first?.Code} ${first?.Message}`,
          );
        }

        deleted += keys.length;
      }

      continuationToken = page.IsTruncated
        ? page.NextContinuationToken
        : undefined;
    } while (continuationToken);

    logger.info({ deploymentId, deleted }, "deployment outputs deleted");

    return deleted;
  }
}
