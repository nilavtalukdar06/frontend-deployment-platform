import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
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
import { formatDuration } from "../utils/format-duration";
import { mapWithConcurrency } from "../utils/map-with-concurrency";

const perFileLogLimit = 25;

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

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

    collector.log(
      "info",
      DeploymentStep.UPLOAD,
      `Scanning the build output directory for files to publish`,
    );

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

    const sizes = await Promise.all(
      files.map((file) =>
        stat(path.join(directory, file)).then((entry) => entry.size),
      ),
    );
    const totalBytes = sizes.reduce((sum, size) => sum + size, 0);
    const sizeByFile = new Map(
      files.map((file, index) => [file, sizes[index] ?? 0]),
    );
    const startedAt = Date.now();

    const progressInterval = Math.max(Math.ceil(files.length / 10), 1);
    let uploadedCount = 0;

    collector.log(
      "info",
      DeploymentStep.UPLOAD,
      `Found ${files.length} file${files.length === 1 ? "" : "s"} (${formatBytes(totalBytes)}). Uploading with up to ${env.UPLOAD_CONCURRENCY} parallel transfers`,
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

      if (files.length <= perFileLogLimit) {
        collector.log(
          "info",
          DeploymentStep.UPLOAD,
          `Uploaded ${filePath} (${formatBytes(sizeByFile.get(file) ?? 0)})`,
        );
      }

      if (
        uploadedCount % progressInterval === 0 ||
        uploadedCount === files.length
      ) {
        collector.log(
          "info",
          DeploymentStep.UPLOAD,
          `Uploaded ${uploadedCount}/${files.length} files (${Math.round((uploadedCount / files.length) * 100)}%)`,
        );
      }
    });

    collector.log(
      "info",
      DeploymentStep.UPLOAD,
      `All ${files.length} files (${formatBytes(totalBytes)}) uploaded in ${formatDuration(Date.now() - startedAt)}`,
    );

    return files.length;
  }
}
