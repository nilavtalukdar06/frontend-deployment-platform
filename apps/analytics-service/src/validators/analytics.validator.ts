import { z } from "zod";
import {
  analyticsRanges,
  DEFAULT_ANALYTICS_RANGE,
} from "../constants/analytics-range";

export abstract class AnalyticsValidator {
  static readonly getProjectAnalytics = {
    params: z.object({ projectId: z.uuid() }).strict(),
    query: z
      .object({
        range: z.enum(analyticsRanges).default(DEFAULT_ANALYTICS_RANGE),
      })
      .strict(),
  };
}
