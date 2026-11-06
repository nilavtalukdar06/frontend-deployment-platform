import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ApiError, ApiResponse } from "@repo/http";
import type { AnalyticsRange } from "../constants/analytics-range";
import { ErrorCode } from "../constants/error-code.enum";
import {
  ErrorMessage,
  SuccessMessage,
} from "../constants/response-message.enum";
import { AnalyticsService } from "../services/analytics.service";

export abstract class AnalyticsController {
  static async getProjectAnalytics(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        ErrorMessage.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED,
      );
    }

    const { projectId } = req.params as { projectId: string };
    const { range } = req.query as unknown as { range: AnalyticsRange };
    const analytics = await AnalyticsService.getProjectAnalytics(
      req.user.id,
      projectId,
      range,
    );

    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          SuccessMessage.ANALYTICS_RETRIEVED,
          analytics,
        ),
      );
  }
}
