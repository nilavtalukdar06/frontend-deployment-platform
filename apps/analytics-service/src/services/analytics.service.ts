import { StatusCodes } from "http-status-codes";
import { ApiError } from "@repo/http";
import {
  ANALYTICS_RANGE_HOURS,
  TOP_ROUTES_LIMIT,
  type AnalyticsRange,
} from "../constants/analytics-range";
import { ErrorCode } from "../constants/error-code.enum";
import { ErrorMessage } from "../constants/response-message.enum";
import { PageViewRepository } from "../repositories/page-view.repository";
import { ProjectRepository } from "../repositories/project.repository";
import {
  buildProjectAnalytics,
  rangeStart,
  type ProjectAnalytics,
} from "../utils/build-project-analytics";

const SECONDS_PER_HOUR = 3_600;

export abstract class AnalyticsService {
  static async getProjectAnalytics(
    userId: string,
    projectId: string,
    range: AnalyticsRange,
  ): Promise<ProjectAnalytics> {
    const ownsProject = await ProjectRepository.existsForUser(
      projectId,
      userId,
    );

    if (!ownsProject) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        ErrorMessage.PROJECT_NOT_FOUND,
        ErrorCode.NOT_FOUND,
      );
    }

    const hours = ANALYTICS_RANGE_HOURS[range];
    const nowEpochSeconds = Math.floor(Date.now() / 1_000);
    const from = rangeStart(nowEpochSeconds, hours);
    const previousFrom = from - hours * SECONDS_PER_HOUR;
    const deploymentIds = await ProjectRepository.listDeploymentIds(projectId);

    const [hourly, topRoutes, totals] = await Promise.all([
      PageViewRepository.hourlyViews(deploymentIds, from),
      PageViewRepository.topRoutes(deploymentIds, from, TOP_ROUTES_LIMIT),
      PageViewRepository.periodTotals(deploymentIds, from, previousFrom),
    ]);

    return buildProjectAnalytics({
      projectId,
      range,
      hours,
      nowEpochSeconds,
      hourly,
      topRoutes,
      totals,
    });
  }
}
