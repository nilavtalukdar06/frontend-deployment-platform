export enum SuccessMessage {
  HEALTH_OK = "Service is healthy",
  ANALYTICS_RETRIEVED = "Project analytics retrieved successfully",
}

export enum ErrorMessage {
  UNAUTHORIZED = "Authentication is required to access this resource",
  PROJECT_NOT_FOUND = "The requested project could not be found",
  SERVICE_UNAVAILABLE = "Service is temporarily unavailable",
}
