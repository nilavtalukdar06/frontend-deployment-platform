export const HttpErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
} as const;

export const HttpErrorMessage = {
  VALIDATION_ERROR: "Validation failed for the given request",
  FORBIDDEN: "You do not have permission to access this resource",
  NOT_FOUND: "The requested resource could not be found",
  INTERNAL_SERVER_ERROR: "Something went wrong on our end",
} as const;
