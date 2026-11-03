import { StatusCodes } from "http-status-codes";
import type { ProjectEnvironmentVariable } from "../db/schema";
import { ErrorCode } from "../constants/error-code.enum";
import { ErrorMessage } from "../constants/response-message.enum";
import { EnvironmentVariableRepository } from "../repositories/environment-variable.repository";
import { ProjectRepository } from "../repositories/project.repository";
import { ApiError } from "../utils/api-error";
import { SecretCipher } from "../utils/secret-cipher";
import { MAX_ENVIRONMENT_VARIABLES } from "../validators/project.validator";
import { ProjectService } from "./project.service";

export interface PublicEnvironmentVariable {
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

export abstract class EnvironmentVariableService {
  static async list(
    userId: string,
    projectId: string,
  ): Promise<PublicEnvironmentVariable[]> {
    await EnvironmentVariableService.requireProject(userId, projectId);
    const rows = await EnvironmentVariableRepository.listByProject(projectId);

    return rows.map(EnvironmentVariableService.toPublic);
  }

  static async set(
    userId: string,
    projectId: string,
    key: string,
    value: string,
  ): Promise<PublicEnvironmentVariable> {
    await EnvironmentVariableService.requireProject(userId, projectId);

    if (
      !(await EnvironmentVariableRepository.exists(projectId, key)) &&
      (await EnvironmentVariableRepository.countByProject(projectId)) >=
        MAX_ENVIRONMENT_VARIABLES
    ) {
      throw new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        ErrorMessage.ENVIRONMENT_VARIABLE_LIMIT_REACHED,
        ErrorCode.ENVIRONMENT_VARIABLE_LIMIT_REACHED,
        { maxEnvironmentVariables: MAX_ENVIRONMENT_VARIABLES },
      );
    }

    const row = await EnvironmentVariableRepository.upsert(
      projectId,
      key,
      SecretCipher.encrypt(value),
    );

    return EnvironmentVariableService.toPublic(row);
  }

  static async remove(
    userId: string,
    projectId: string,
    key: string,
  ): Promise<void> {
    await EnvironmentVariableService.requireProject(userId, projectId);

    if (!(await EnvironmentVariableRepository.delete(projectId, key))) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        ErrorMessage.ENVIRONMENT_VARIABLE_NOT_FOUND,
        ErrorCode.NOT_FOUND,
      );
    }
  }

  private static async requireProject(
    userId: string,
    projectId: string,
  ): Promise<void> {
    if (!(await ProjectRepository.findById(projectId, userId))) {
      throw ProjectService.projectNotFound();
    }
  }

  private static toPublic(
    row: ProjectEnvironmentVariable,
  ): PublicEnvironmentVariable {
    return {
      key: row.key,
      value: SecretCipher.decrypt(row.value),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
