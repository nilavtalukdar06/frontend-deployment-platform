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
import { ApiError, ApiResponse } from "@repo/http";

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

  static async listRepositories(req: Request, res: Response): Promise<void> {
    const userId = ProjectController.requireUserId(req);
    const { page } = req.query as unknown as { page: number };
    const repositories = await ProjectService.listImportableRepositories(
      userId,
      page,
    );

    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          SuccessMessage.REPOSITORIES_RETRIEVED,
          repositories,
        ),
      );
  }

  static async list(req: Request, res: Response): Promise<void> {
    const userId = ProjectController.requireUserId(req);
    const { page, limit, search } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
    };
    const projects = await ProjectService.list(userId, page, limit, search);

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

  static async redeploy(req: Request, res: Response): Promise<void> {
    const userId = ProjectController.requireUserId(req);
    const deployment = await ProjectService.redeploy(
      userId,
      req.params["id"] ?? "",
    );

    res
      .status(StatusCodes.ACCEPTED)
      .json(
        new ApiResponse(
          StatusCodes.ACCEPTED,
          SuccessMessage.DEPLOYMENT_QUEUED,
          deployment,
        ),
      );
  }

  static async enableAutoDeploy(req: Request, res: Response): Promise<void> {
    const userId = ProjectController.requireUserId(req);
    const project = await ProjectService.enableAutoDeploy(
      userId,
      req.params["id"] ?? "",
    );

    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          SuccessMessage.AUTO_DEPLOY_ENABLED,
          project,
        ),
      );
  }

  static async listDeployments(req: Request, res: Response): Promise<void> {
    const userId = ProjectController.requireUserId(req);
    const { page, limit } = req.query as unknown as {
      page: number;
      limit: number;
    };
    const deployments = await ProjectService.listDeployments(
      userId,
      req.params["id"] ?? "",
      page,
      limit,
    );

    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          SuccessMessage.DEPLOYMENTS_RETRIEVED,
          deployments,
        ),
      );
  }

  static async getDeployment(req: Request, res: Response): Promise<void> {
    const userId = ProjectController.requireUserId(req);
    const deployment = await ProjectService.getDeployment(
      userId,
      req.params["id"] ?? "",
      req.params["deploymentId"] ?? "",
    );

    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          SuccessMessage.DEPLOYMENT_RETRIEVED,
          deployment,
        ),
      );
  }

  static async cancelDeployment(req: Request, res: Response): Promise<void> {
    const userId = ProjectController.requireUserId(req);
    const deployment = await ProjectService.cancelDeployment(
      userId,
      req.params["id"] ?? "",
      req.params["deploymentId"] ?? "",
    );

    res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          SuccessMessage.DEPLOYMENT_CANCELED,
          deployment,
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
