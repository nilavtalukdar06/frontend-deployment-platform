import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ErrorCode } from "../constants/error-code.enum";
import {
  ErrorMessage,
  SuccessMessage,
} from "../constants/response-message.enum";
import { EnvironmentVariableService } from "../services/environment-variable.service";
import { ApiError, ApiResponse } from "@repo/http";

export abstract class EnvironmentVariableController {
  static async list(req: Request, res: Response): Promise<void> {
    const userId = EnvironmentVariableController.requireUserId(req);
    const environmentVariables = await EnvironmentVariableService.list(
      userId,
      req.params["id"] ?? "",
    );

    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          SuccessMessage.ENVIRONMENT_VARIABLES_RETRIEVED,
          environmentVariables,
        ),
      );
  }

  static async set(req: Request, res: Response): Promise<void> {
    const userId = EnvironmentVariableController.requireUserId(req);
    const { value } = req.body as { value: string };
    const environmentVariable = await EnvironmentVariableService.set(
      userId,
      req.params["id"] ?? "",
      req.params["key"] ?? "",
      value,
    );

    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          SuccessMessage.ENVIRONMENT_VARIABLE_SAVED,
          environmentVariable,
        ),
      );
  }

  static async remove(req: Request, res: Response): Promise<void> {
    const userId = EnvironmentVariableController.requireUserId(req);
    await EnvironmentVariableService.remove(
      userId,
      req.params["id"] ?? "",
      req.params["key"] ?? "",
    );

    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          SuccessMessage.ENVIRONMENT_VARIABLE_DELETED,
        ),
      );
  }

  private static requireUserId(req: Request): string {
    if (!req.user) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        ErrorMessage.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED,
      );
    }

    return req.user.id;
  }
}
