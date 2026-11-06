import {
  ANALYTICS_RANGE_HOURS,
  analyticsRanges,
  DEFAULT_ANALYTICS_RANGE,
  OTHER_ROUTES_LABEL,
  TOP_ROUTES_LIMIT,
} from "../constants/analytics-range";
import { ErrorCode } from "../constants/error-code.enum";
import {
  ErrorMessage,
  SuccessMessage,
} from "../constants/response-message.enum";

type JsonObject = Record<string, unknown>;

const serviceDescription = `Page analytics for the sites hosted by the React deployment platform.

**How it works.** The proxy-service publishes one page view event to the Kafka topic \`analytics\` whenever it serves an HTML document of a deployed site. This service consumes the topic (consumer group \`KAFKA_CONSUMER_GROUP_ID\`, so every event is handled by exactly one instance) and stores the events in the ClickHouse table \`page_views\`. The same process serves the read API below, which aggregates those rows per project.

**Authentication.** The service is not exposed to clients directly; the api-gateway verifies the bearer token and forwards the user in the \`x-user-id\` header. A missing or malformed \`x-user-id\` is rejected with \`401 UNAUTHORIZED\`. Projects of other users and deleted projects behave as if they did not exist (\`404\`).

**What is counted.** A page view is one HTML document served for a project, on its slug URL or on one of its deployment URLs, so views of every deployment of the project are included. Static assets are never counted. Events are stored once they are consumed from Kafka, so very recent views can appear with a short delay.

**Time.** All buckets are UTC hours. Rows of the response are always complete: hours without views are present with \`views: 0\`.`;

const errorSchema: JsonObject = {
  type: "object",
  required: ["success", "statusCode", "errorCode", "message"],
  properties: {
    success: { type: "boolean", example: false },
    statusCode: { type: "integer", example: 404 },
    errorCode: {
      type: "string",
      enum: Object.values(ErrorCode),
      example: ErrorCode.NOT_FOUND,
    },
    message: { type: "string", example: ErrorMessage.PROJECT_NOT_FOUND },
    details: {
      description:
        "Extra information. For `VALIDATION_ERROR` the Zod error tree of the failing input.",
    },
  },
};

const hourlyViewsPointSchema: JsonObject = {
  type: "object",
  required: ["hour", "views"],
  properties: {
    hour: {
      type: "string",
      format: "date-time",
      description: "Start of the UTC hour.",
      example: "2026-11-07T10:00:00.000Z",
    },
    views: { type: "integer", minimum: 0, example: 42 },
  },
};

const routeSliceSchema: JsonObject = {
  type: "object",
  required: ["route", "views", "percentage"],
  properties: {
    route: {
      type: "string",
      description: `Path of the page, always starting with \`/\` and without a trailing slash (except \`/\`). The slice that groups every route outside the top ${TOP_ROUTES_LIMIT} is labelled \`${OTHER_ROUTES_LABEL}\`.`,
      example: "/pricing",
    },
    views: { type: "integer", minimum: 0, example: 120 },
    percentage: {
      type: "number",
      minimum: 0,
      maximum: 100,
      description:
        "Share of the views in the range, rounded to one decimal. `0` when the range has no views.",
      example: 37.5,
    },
  },
};

const projectAnalyticsSchema: JsonObject = {
  type: "object",
  required: [
    "projectId",
    "range",
    "from",
    "to",
    "stats",
    "viewsPerHour",
    "routeDistribution",
  ],
  properties: {
    projectId: { type: "string", format: "uuid" },
    range: {
      type: "string",
      enum: analyticsRanges,
      description: "The requested range.",
    },
    from: {
      type: "string",
      format: "date-time",
      description: "Start of the first hour of the range.",
    },
    to: {
      type: "string",
      format: "date-time",
      description: "Time the report was computed.",
    },
    stats: {
      type: "object",
      description: "Values for the status cards.",
      required: [
        "totalViews",
        "uniqueRoutes",
        "averageViewsPerHour",
        "peakHour",
        "topRoute",
      ],
      properties: {
        totalViews: {
          type: "object",
          required: ["value", "previousValue", "changePercent"],
          properties: {
            value: {
              type: "integer",
              minimum: 0,
              description:
                "Page views in the range. Equals the sum of `viewsPerHour`.",
            },
            previousValue: {
              type: "integer",
              minimum: 0,
              description:
                "Page views in the range of the same length that ends where this one starts.",
            },
            changePercent: {
              type: ["number", "null"],
              description:
                "Change of `value` against `previousValue` in percent, rounded to one decimal. `null` when `previousValue` is `0`.",
            },
          },
        },
        uniqueRoutes: {
          type: "integer",
          minimum: 0,
          description: "Number of distinct routes viewed in the range.",
        },
        averageViewsPerHour: {
          type: "number",
          minimum: 0,
          description:
            "`totalViews.value` divided by the number of hours in the range, rounded to one decimal.",
        },
        peakHour: {
          oneOf: [
            { $ref: "#/components/schemas/HourlyViewsPoint" },
            { type: "null" },
          ],
          description:
            "The hour with the most views (the earliest one on a tie). `null` when the range has no views.",
        },
        topRoute: {
          oneOf: [
            { $ref: "#/components/schemas/RouteSlice" },
            { type: "null" },
          ],
          description:
            "The most viewed route. `null` when the range has no views.",
        },
      },
    },
    viewsPerHour: {
      type: "array",
      description: `Data of the bar chart: one entry per UTC hour of the range, oldest first, ${Object.entries(
        ANALYTICS_RANGE_HOURS,
      )
        .map(([range, hours]) => `${hours} entries for \`${range}\``)
        .join(", ")}.`,
      items: { $ref: "#/components/schemas/HourlyViewsPoint" },
    },
    routeDistribution: {
      type: "array",
      description: `Data of the donut chart: the ${TOP_ROUTES_LIMIT} most viewed routes, most viewed first, followed by one \`${OTHER_ROUTES_LABEL}\` slice when more routes were viewed. Empty when the range has no views.`,
      items: { $ref: "#/components/schemas/RouteSlice" },
    },
  },
};

const projectAnalyticsResponseSchema: JsonObject = {
  type: "object",
  required: ["success", "statusCode", "message", "data"],
  properties: {
    success: { type: "boolean", example: true },
    statusCode: { type: "integer", example: 200 },
    message: { type: "string", example: SuccessMessage.ANALYTICS_RETRIEVED },
    data: { $ref: "#/components/schemas/ProjectAnalytics" },
  },
};

const errorContent = (example: JsonObject) => ({
  "application/json": {
    schema: { $ref: "#/components/schemas/ErrorResponse" },
    example,
  },
});

const analyticsExample = {
  success: true,
  statusCode: 200,
  message: SuccessMessage.ANALYTICS_RETRIEVED,
  data: {
    projectId: "0192f5a4-7b1e-7c3a-9d2e-5f8a1b2c3d4e",
    range: DEFAULT_ANALYTICS_RANGE,
    from: "2026-11-06T11:00:00.000Z",
    to: "2026-11-07T10:42:17.000Z",
    stats: {
      totalViews: { value: 240, previousValue: 200, changePercent: 20 },
      uniqueRoutes: 7,
      averageViewsPerHour: 10,
      peakHour: { hour: "2026-11-07T09:00:00.000Z", views: 42 },
      topRoute: { route: "/", views: 120, percentage: 50 },
    },
    viewsPerHour: [
      { hour: "2026-11-06T11:00:00.000Z", views: 3 },
      { hour: "2026-11-06T12:00:00.000Z", views: 0 },
      { hour: "2026-11-07T09:00:00.000Z", views: 42 },
      { hour: "2026-11-07T10:00:00.000Z", views: 18 },
    ],
    routeDistribution: [
      { route: "/", views: 120, percentage: 50 },
      { route: "/pricing", views: 60, percentage: 25 },
      { route: "/about", views: 36, percentage: 15 },
      { route: OTHER_ROUTES_LABEL, views: 24, percentage: 10 },
    ],
  },
};

const health: JsonObject = {
  tags: ["Health"],
  operationId: "getHealth",
  summary: "Health check",
  description:
    "Reports whether the service can reach Postgres (project ownership checks) and ClickHouse (page views).",
  responses: {
    "200": {
      description: "Postgres and ClickHouse are reachable.",
      content: {
        "application/json": {
          example: {
            success: true,
            statusCode: 200,
            message: SuccessMessage.HEALTH_OK,
            data: { postgres: "up", clickhouse: "up", uptime: 1234.56 },
          },
        },
      },
    },
    "503": {
      description:
        "Postgres or ClickHouse is unreachable. The body uses the success envelope with `success: false`.",
      content: {
        "application/json": {
          example: {
            success: false,
            statusCode: 503,
            message: ErrorMessage.SERVICE_UNAVAILABLE,
            data: { postgres: "up", clickhouse: "down", uptime: 1234.56 },
          },
        },
      },
    },
  },
};

const getProjectAnalytics: JsonObject = {
  tags: ["Analytics"],
  operationId: "getProjectAnalytics",
  summary: "Page analytics of a project",
  description: `Returns everything needed to draw the analytics dashboard of a project in one call: the values of the status cards (\`stats\`), the data of the views-per-hour bar chart (\`viewsPerHour\`) and the data of the route donut chart (\`routeDistribution\`).

The range ends with the current UTC hour and is made of whole hours: ${Object.entries(
    ANALYTICS_RANGE_HOURS,
  )
    .map(([range, hours]) => `\`${range}\` is the last ${hours} hours`)
    .join(
      ", ",
    )}. \`stats.totalViews.previousValue\` covers the range of the same length right before it.`,
  security: [{ userIdHeader: [] }],
  parameters: [
    {
      name: "projectId",
      in: "path",
      required: true,
      description: "Identifier of a project owned by the user.",
      schema: { type: "string", format: "uuid" },
    },
    {
      name: "range",
      in: "query",
      required: false,
      description: "Length of the reported period.",
      schema: {
        type: "string",
        enum: analyticsRanges,
        default: DEFAULT_ANALYTICS_RANGE,
      },
    },
  ],
  responses: {
    "200": {
      description: "The analytics of the project.",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ProjectAnalyticsResponse" },
          example: analyticsExample,
        },
      },
    },
    "400": {
      description:
        "`VALIDATION_ERROR`: `projectId` is not a UUID, `range` is not one of the allowed values, or an unknown query parameter was sent.",
      content: errorContent({
        success: false,
        statusCode: 400,
        errorCode: ErrorCode.VALIDATION_ERROR,
        message: "Validation failed for the given request",
      }),
    },
    "401": {
      description:
        "`UNAUTHORIZED`: the `x-user-id` header is missing or is not a UUID.",
      content: errorContent({
        success: false,
        statusCode: 401,
        errorCode: ErrorCode.UNAUTHORIZED,
        message: ErrorMessage.UNAUTHORIZED,
      }),
    },
    "404": {
      description:
        "`NOT_FOUND`: the project does not exist, is deleted or belongs to another user.",
      content: errorContent({
        success: false,
        statusCode: 404,
        errorCode: ErrorCode.NOT_FOUND,
        message: ErrorMessage.PROJECT_NOT_FOUND,
      }),
    },
    "500": {
      description:
        "`INTERNAL_SERVER_ERROR`: Postgres or ClickHouse failed while building the report.",
      content: errorContent({
        success: false,
        statusCode: 500,
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Something went wrong on our end",
      }),
    },
  },
};

export const openApiDocument: JsonObject = {
  openapi: "3.1.0",
  info: {
    title: "Analytics Service API",
    version: "1.0.0",
    description: serviceDescription,
  },
  servers: [{ url: "/", description: "Current host" }],
  tags: [
    { name: "Health", description: "Dependency checks." },
    {
      name: "Analytics",
      description: "Page view statistics of a project.",
    },
  ],
  paths: {
    "/health": { get: health },
    "/analytics/projects/{projectId}": { get: getProjectAnalytics },
  },
  components: {
    securitySchemes: {
      userIdHeader: {
        type: "apiKey",
        in: "header",
        name: "x-user-id",
        description:
          "Identifier of the authenticated user, set by the api-gateway after it verified the bearer token. Not meant to be sent by clients.",
      },
    },
    schemas: {
      ErrorResponse: errorSchema,
      HourlyViewsPoint: hourlyViewsPointSchema,
      RouteSlice: routeSliceSchema,
      ProjectAnalytics: projectAnalyticsSchema,
      ProjectAnalyticsResponse: projectAnalyticsResponseSchema,
    },
  },
};
