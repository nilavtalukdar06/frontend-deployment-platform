import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ApiError, ApiResponse } from "@repo/http";
import { ErrorCode } from "../constants/error-code.enum";
import {
  ErrorMessage,
  SuccessMessage,
} from "../constants/response-message.enum";
import { DeploymentLogService } from "../services/deployment-log.service";

export abstract class DeploymentLogController {
  static async list(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        ErrorMessage.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED,
      );
    }

    const { id } = req.params as { id: string };
    const { after, limit } = req.query as unknown as {
      after: number;
      limit: number;
    };
    const logs = await DeploymentLogService.list(req.user.id, id, after, limit);

    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          SuccessMessage.DEPLOYMENT_LOGS_RETRIEVED,
          logs,
        ),
      );
  }
}
