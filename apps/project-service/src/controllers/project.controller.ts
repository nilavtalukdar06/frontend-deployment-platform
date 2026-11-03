import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ErrorCode } from "../constants/error-code.enum";
import {
  ErrorMessage,
  SuccessMessage,
} from "../constants/response-message.enum";
import {
  ProjectService,
  type CreateProjectInput,
} from "../services/project.service";
import type { ProjectChanges } from "../repositories/project.repository";
import { ApiError } from "../utils/api-error";
import { ApiResponse } from "../utils/api-response";

export abstract class ProjectController {
  static async create(req: Request, res: Response): Promise<void> {
    const userId = ProjectController.requireUserId(req);
    const project = await ProjectService.create(
      userId,
      req.body as CreateProjectInput,
    );

    res
      .status(StatusCodes.CREATED)
      .json(
        new ApiResponse(
          StatusCodes.CREATED,
          SuccessMessage.PROJECT_CREATED,
          project,
        ),
      );
  }

  static async list(req: Request, res: Response): Promise<void> {
    const userId = ProjectController.requireUserId(req);
    const { page, limit } = req.query as unknown as {
      page: number;
      limit: number;
    };
    const projects = await ProjectService.list(userId, page, limit);

    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          SuccessMessage.PROJECTS_RETRIEVED,
          projects,
        ),
      );
  }

  static async get(req: Request, res: Response): Promise<void> {
    const userId = ProjectController.requireUserId(req);
    const project = await ProjectService.get(userId, req.params["id"] ?? "");

    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          SuccessMessage.PROJECT_RETRIEVED,
          project,
        ),
      );
  }

  static async update(req: Request, res: Response): Promise<void> {
    const userId = ProjectController.requireUserId(req);
    const project = await ProjectService.update(
      userId,
      req.params["id"] ?? "",
      req.body as ProjectChanges,
    );

    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          SuccessMessage.PROJECT_UPDATED,
          project,
        ),
      );
  }

  static async remove(req: Request, res: Response): Promise<void> {
    const userId = ProjectController.requireUserId(req);
    await ProjectService.remove(userId, req.params["id"] ?? "");

    res
      .status(StatusCodes.OK)
      .json(new ApiResponse(StatusCodes.OK, SuccessMessage.PROJECT_DELETED));
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
