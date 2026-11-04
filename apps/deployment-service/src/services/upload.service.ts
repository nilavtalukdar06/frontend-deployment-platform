import { createReadStream } from "node:fs";
import path from "node:path";
import { Upload } from "@aws-sdk/lib-storage";
import { globby } from "globby";
import mime from "mime-types";
import type { Logger } from "pino";
import { env } from "../config/env";
import { DeploymentStep } from "../constants/deployment-step.enum";
import { s3 } from "../lib/s3";
import type { DeploymentLogCollector } from "../logging/deployment-log-collector";
import { DeploymentError } from "../utils/deployment-error";
import { mapWithConcurrency } from "../utils/map-with-concurrency";

export const outputKeyPrefix = (deploymentId: string): string =>
  `__outputs/${deploymentId}`;

export abstract class UploadService {
  static async uploadDirectory(params: {
    deploymentId: string;
    directory: string;
    logger: Logger;
    collector: DeploymentLogCollector;
  }): Promise<number> {
    const { deploymentId, directory, logger, collector } = params;

    const files = await globby("**/*", {
      cwd: directory,
      onlyFiles: true,
      dot: true,
      followSymbolicLinks: false,
    }).catch((err: unknown) => {
      throw new DeploymentError(
        DeploymentStep.UPLOAD,
        "build output directory could not be read",
        { cause: err },
      );
    });

    if (files.length === 0) {
      throw new DeploymentError(
        DeploymentStep.UPLOAD,
        "build output directory is empty or does not exist",
      );
    }

    const progressInterval = Math.max(Math.ceil(files.length / 10), 1);
    let uploadedCount = 0;

    collector.log(
      "info",
      DeploymentStep.UPLOAD,
      `uploading ${files.length} files`,
    );

    await mapWithConcurrency(files, env.UPLOAD_CONCURRENCY, async (file) => {
      const filePath = file.split(path.sep).join("/");
      const key = `${outputKeyPrefix(deploymentId)}/${filePath}`;

      try {
        await new Upload({
          client: s3,
          params: {
            Bucket: env.S3_BUCKET_NAME,
            Key: key,
            Body: createReadStream(path.join(directory, file)),
            ContentType: mime.lookup(file) || "application/octet-stream",
          },
        }).done();
      } catch (err) {
        throw new DeploymentError(
          DeploymentStep.UPLOAD,
          `failed to upload "${filePath}"`,
          { cause: err },
        );
      }

      logger.debug({ key }, "uploaded file");

      uploadedCount += 1;
      if (
        uploadedCount % progressInterval === 0 ||
        uploadedCount === files.length
      ) {
        collector.log(
          "info",
          DeploymentStep.UPLOAD,
          `uploaded ${uploadedCount}/${files.length} files`,
        );
      }
    });

    return files.length;
  }
}
