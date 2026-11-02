export enum SuccessMessage {
  HEALTH_OK = "Gateway and its dependencies are healthy",
}

export enum ErrorMessage {
  FORBIDDEN = "You do not have permission to access this resource",
  UNAUTHORIZED = "Authentication is required to access this resource",
  NOT_FOUND = "The requested resource could not be found",
  INVALID_TOKEN = "The provided token is invalid or has expired",
  TOKEN_REVOKED = "The provided token has been revoked",
  PAYLOAD_TOO_LARGE = "The request body exceeds the maximum allowed size",
  TOO_MANY_REQUESTS = "Too many requests, please try again later",
  INTERNAL_SERVER_ERROR = "Something went wrong on our end",
  BAD_GATEWAY = "The upstream service returned an invalid response or could not be reached",
  SERVICE_UNAVAILABLE = "Service is temporarily unavailable",
  GATEWAY_TIMEOUT = "The upstream service did not respond in time",
}
