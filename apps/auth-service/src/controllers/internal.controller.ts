import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { SuccessMessage } from "../constants/response-message.enum";
import { AuthService } from "../services/auth.service";
import { ApiResponse } from "../utils/api-response";

export abstract class InternalController {
  static async githubToken(req: Request, res: Response): Promise<void> {
    const accessToken = await AuthService.getGithubAccessToken(
      req.params["id"] ?? "",
    );

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, SuccessMessage.GITHUB_TOKEN, {
        accessToken,
      }),
    );
  }
}
