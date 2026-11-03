export enum SuccessMessage {
  OK = "Request completed successfully",
  CREATED = "Resource created successfully",
  UPDATED = "Resource updated successfully",
  DELETED = "Resource deleted successfully",
  HEALTH_OK = "Service is healthy",
  PROJECT_CREATED = "Project created successfully",
  PROJECTS_RETRIEVED = "Projects retrieved successfully",
  PROJECT_RETRIEVED = "Project retrieved successfully",
  PROJECT_UPDATED = "Project updated successfully",
  PROJECT_DELETED = "Project deleted successfully",
}

export enum ErrorMessage {
  VALIDATION_ERROR = "Validation failed for the given request",
  BAD_REQUEST = "The request could not be understood or was missing required parameters",
  UNAUTHORIZED = "Authentication is required to access this resource",
  FORBIDDEN = "You do not have permission to access this resource",
  NOT_FOUND = "The requested resource could not be found",
  CONFLICT = "The request could not be completed due to a conflict",
  INVALID_REPOSITORY = "The repository does not exist or is not public",
  GITHUB_UNAVAILABLE = "The repository could not be verified with GitHub, please try again later",
  PROJECT_NOT_FOUND = "The requested project could not be found",
  PROJECT_NAME_ALREADY_EXISTS = "A project with this name already exists",
  TOO_MANY_REQUESTS = "Too many requests, please try again later",
  INTERNAL_SERVER_ERROR = "Something went wrong on our end",
  SERVICE_UNAVAILABLE = "Service is temporarily unavailable",
}
