export enum SuccessMessage {
  OK = "Request completed successfully",
  CREATED = "Resource created successfully",
  UPDATED = "Resource updated successfully",
  DELETED = "Resource deleted successfully",
  HEALTH_OK = "Service is healthy",
}

export enum ErrorMessage {
  VALIDATION_ERROR = "Validation failed for the given request",
  BAD_REQUEST = "The request could not be understood or was missing required parameters",
  UNAUTHORIZED = "Authentication is required to access this resource",
  FORBIDDEN = "You do not have permission to access this resource",
  NOT_FOUND = "The requested resource could not be found",
  CONFLICT = "The request could not be completed due to a conflict",
  TOO_MANY_REQUESTS = "Too many requests, please try again later",
  INTERNAL_SERVER_ERROR = "Something went wrong on our end",
  SERVICE_UNAVAILABLE = "Service is temporarily unavailable",
}
