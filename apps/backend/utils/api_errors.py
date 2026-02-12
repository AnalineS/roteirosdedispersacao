"""Standardized API error responses.

All error responses follow this schema:
{
    "error": str,          # Human-readable message
    "error_code": str,     # Machine-readable code (UPPER_SNAKE_CASE)
    "timestamp": str,      # ISO-8601
    "request_id": str,     # Tracking ID
    "details": dict | None # Optional context
}
"""

from datetime import datetime
from flask import jsonify


def _generate_request_id(prefix: str = "req") -> str:
    return f"{prefix}_{int(datetime.now().timestamp() * 1000)}"


def api_error(
    message: str,
    error_code: str,
    status: int = 400,
    details: dict | None = None,
    request_id: str | None = None,
):
    """Return a standardized JSON error response.

    Args:
        message: Human-readable error description.
        error_code: Machine-readable code, e.g. "MISSING_MESSAGE".
        status: HTTP status code.
        details: Optional dict with extra context (valid options, limits, etc.).
        request_id: Optional tracking ID. Auto-generated if absent.
    """
    body = {
        "error": message,
        "error_code": error_code,
        "timestamp": datetime.now().isoformat(),
        "request_id": request_id or _generate_request_id(),
    }
    if details:
        body["details"] = details
    return jsonify(body), status


def bad_request(message: str, error_code: str, details: dict | None = None):
    return api_error(message, error_code, 400, details)


def unauthorized(message: str = "Authentication required", error_code: str = "UNAUTHORIZED"):
    return api_error(message, error_code, 401)


def forbidden(message: str = "Access denied", error_code: str = "FORBIDDEN"):
    return api_error(message, error_code, 403)


def not_found(message: str = "Resource not found", error_code: str = "NOT_FOUND"):
    return api_error(message, error_code, 404)


def server_error(message: str = "Internal server error", error_code: str = "INTERNAL_ERROR"):
    return api_error(message, error_code, 500)


def service_unavailable(message: str = "Service unavailable", error_code: str = "SERVICE_UNAVAILABLE"):
    return api_error(message, error_code, 503)
