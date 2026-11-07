import axios from "axios";

interface ErrorEnvelope {
  statusCode?: number;
  errorCode?: string;
  message?: string;
  details?: unknown;
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly errorCode: string;
  readonly details: unknown;

  constructor(
    status: number,
    errorCode: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
  }
}

const isErrorEnvelope = (value: unknown): value is ErrorEnvelope =>
  typeof value === "object" && value !== null && "errorCode" in value;

export const toApiRequestError = (error: unknown): unknown => {
  if (error instanceof ApiRequestError || axios.isCancel(error)) {
    return error;
  }

  if (!axios.isAxiosError(error)) {
    return error;
  }

  if (!error.response) {
    return new ApiRequestError(
      0,
      "NETWORK_ERROR",
      "We couldn't reach the server.",
    );
  }

  const body = error.response.data;

  if (isErrorEnvelope(body)) {
    return new ApiRequestError(
      error.response.status,
      body.errorCode ?? "INTERNAL_SERVER_ERROR",
      body.message ?? "Something went wrong.",
      body.details,
    );
  }

  return new ApiRequestError(
    error.response.status,
    "INTERNAL_SERVER_ERROR",
    "Something went wrong.",
  );
};

const friendlyMessages: Record<string, string> = {
  NETWORK_ERROR:
    "We couldn't reach the server. Check your connection and try again.",
  TOO_MANY_REQUESTS: "Too many requests. Wait a moment and try again.",
  GITHUB_AUTH_REQUIRED:
    "GitHub access expired or was revoked. Reconnect GitHub to continue.",
  SERVICE_UNAVAILABLE:
    "The service is temporarily unavailable. Try again shortly.",
  BAD_GATEWAY: "The service is temporarily unavailable. Try again shortly.",
  GATEWAY_TIMEOUT: "The request timed out. Try again shortly.",
  INTERNAL_SERVER_ERROR: "Something went wrong on our side. Try again.",
  UNAUTHORIZED: "Your session expired. Sign in again.",
  INVALID_TOKEN: "Your session expired. Sign in again.",
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiRequestError) {
    return friendlyMessages[error.errorCode] ?? error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong.";
};

export const isApiError = (error: unknown, errorCode: string): boolean =>
  error instanceof ApiRequestError && error.errorCode === errorCode;

export const isNotFoundError = (error: unknown): boolean =>
  error instanceof ApiRequestError && error.status === 404;

interface ValidationTree {
  errors?: string[];
  properties?: Record<string, ValidationTree>;
  items?: (ValidationTree | undefined)[];
}

const isValidationTree = (value: unknown): value is ValidationTree =>
  typeof value === "object" && value !== null;

const collectFieldErrors = (
  tree: ValidationTree,
  path: string,
  result: Record<string, string>,
) => {
  if (path && tree.errors && tree.errors.length > 0) {
    result[path] = tree.errors[0];
  }

  for (const [key, child] of Object.entries(tree.properties ?? {})) {
    collectFieldErrors(child, path ? `${path}.${key}` : key, result);
  }

  tree.items?.forEach((child, index) => {
    if (child) {
      collectFieldErrors(child, path ? `${path}.${index}` : `${index}`, result);
    }
  });
};

export const getFieldErrors = (error: unknown): Record<string, string> => {
  if (
    !(error instanceof ApiRequestError) ||
    error.errorCode !== "VALIDATION_ERROR" ||
    !isValidationTree(error.details)
  ) {
    return {};
  }

  const result: Record<string, string> = {};
  collectFieldErrors(error.details, "", result);

  return result;
};
