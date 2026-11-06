export enum SuccessMessage {
  HEALTH_OK = "Service is healthy",
  DEPLOYMENT_LOGS_RETRIEVED = "Deployment logs retrieved successfully",
}

export enum ErrorMessage {
  UNAUTHORIZED = "Authentication is required to access this resource",
  DEPLOYMENT_NOT_FOUND = "The requested deployment could not be found",
  SERVICE_UNAVAILABLE = "Service is temporarily unavailable",
}
