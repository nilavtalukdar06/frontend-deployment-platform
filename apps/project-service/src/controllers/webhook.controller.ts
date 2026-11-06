import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { SuccessMessage } from "../constants/response-message.enum";
import { WebhookService } from "../services/webhook.service";
import { ApiResponse } from "@repo/http";

const headerValue = (req: Request, name: string): string | undefined => {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
};

export abstract class WebhookController {
  static async github(req: Request, res: Response): Promise<void> {
    const outcome = await WebhookService.handleGithub({
      projectId: req.params["projectId"] ?? "",
      event: headerValue(req, "x-github-event"),
      deliveryId: headerValue(req, "x-github-delivery"),
      signature: headerValue(req, "x-hub-signature-256"),
      rawBody: req.body,
    });

    if (outcome.kind === "pong") {
      res
        .status(StatusCodes.OK)
        .json(new ApiResponse(StatusCodes.OK, SuccessMessage.WEBHOOK_PONG));
      return;
    }

    if (outcome.kind === "ignored") {
      res.status(StatusCodes.ACCEPTED).json(
        new ApiResponse(StatusCodes.ACCEPTED, SuccessMessage.WEBHOOK_IGNORED, {
          reason: outcome.reason,
        }),
      );
      return;
    }

    res.status(StatusCodes.ACCEPTED).json(
      new ApiResponse(
        StatusCodes.ACCEPTED,
        SuccessMessage.WEBHOOK_DEPLOYMENT_QUEUED,
        {
          deploymentId: outcome.deploymentId,
        },
      ),
    );
  }
}
