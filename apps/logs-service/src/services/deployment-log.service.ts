import { StatusCodes } from "http-status-codes";
import { ApiError } from "@repo/http";
import { ErrorCode } from "../constants/error-code.enum";
import { ErrorMessage } from "../constants/response-message.enum";
import { DeploymentRepository } from "../repositories/deployment.repository";
import { LogEventRepository } from "../repositories/log-event.repository";

export interface PublicDeploymentLog {
  id: string;
  sequence: number;
  timestamp: string;
  type: string | null;
  level: string | null;
  step: string | null;
  source: string | null;
  phase: string | null;
  status: string | null;
  message: string;
}

export interface DeploymentLogPage {
  items: PublicDeploymentLog[];
  nextAfter: number;
  hasMore: boolean;
}

type EventMetadata = Record<string, unknown>;

const parseMetadata = (raw: string | null): EventMetadata => {
  if (!raw) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as EventMetadata)
      : {};
  } catch {
    return {};
  }
};

const stringOrNull = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const toIsoTimestamp = (value: string): string =>
  new Date(`${value.replace(" ", "T")}Z`).toISOString();

export abstract class DeploymentLogService {
  static async list(
    userId: string,
    deploymentId: string,
    after: number,
    limit: number,
  ): Promise<DeploymentLogPage> {
    const ownsDeployment = await DeploymentRepository.existsForUser(
      deploymentId,
      userId,
    );

    if (!ownsDeployment) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        ErrorMessage.DEPLOYMENT_NOT_FOUND,
        ErrorCode.NOT_FOUND,
      );
    }

    const rows = await LogEventRepository.listForDeployment(
      deploymentId,
      after,
      limit + 1,
    );
    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit).map((row): PublicDeploymentLog => {
      const metadata = parseMetadata(row.metadata);

      return {
        id: row.id,
        sequence: Number(row.sequence),
        timestamp:
          stringOrNull(metadata["timestamp"]) ?? toIsoTimestamp(row.loggedAt),
        type: stringOrNull(metadata["type"]),
        level: stringOrNull(metadata["level"]),
        step: stringOrNull(metadata["step"]),
        source: stringOrNull(metadata["source"]),
        phase: stringOrNull(metadata["phase"]),
        status: stringOrNull(metadata["status"]),
        message: row.message,
      };
    });

    return {
      items,
      nextAfter: items.at(-1)?.sequence ?? after,
      hasMore,
    };
  }
}
