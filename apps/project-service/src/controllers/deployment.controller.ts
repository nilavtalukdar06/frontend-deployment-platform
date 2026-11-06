import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ErrorCode } from "../constants/error-code.enum";
import {
  ErrorMessage,
  SuccessMessage,
} from "../constants/response-message.enum";
import { DeploymentLogService } from "../services/deployment-log.service";
import { ApiError, ApiResponse } from "@repo/http";

export abstract class DeploymentController {
  static async listLogs(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        ErrorMessage.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED,
      );
    }

    const { after, limit } = req.query as unknown as {
      after: number;
      limit: number;
    };
    const logs = await DeploymentLogService.list(
      req.user.id,
      req.params["id"] ?? "",
      after,
      limit,
    );

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
