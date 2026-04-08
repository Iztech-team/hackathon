"""Custom exception types for the hackathon app.

Raise `HackathonException` (or one of its subclasses) anywhere in the code
when you want the API to return a structured, user-visible error. A
dedicated FastAPI exception handler (in main.py) catches these and returns
a consistent JSON shape:

    {
        "detail": "Invalid credentials",
        "code": "INVALID_CREDENTIALS",
        "details": {}
    }

Anything that is NOT a HackathonException is treated as an unexpected
server error by the middleware in main.py — it gets logged with a full
stack trace and (if the webhook is configured) posted to Discord.
"""
from typing import Any, Optional


class HackathonException(Exception):
    """Base class for all expected errors raised by our code."""

    # Default HTTP status + machine code for this exception type.
    # Subclasses override these for nicer call sites.
    default_status_code: int = 400
    default_code: str = "HACKATHON_ERROR"

    def __init__(
        self,
        message: str,
        *,
        status_code: Optional[int] = None,
        code: Optional[str] = None,
        details: Optional[dict[str, Any]] = None,
    ):
        self.message = message
        self.status_code = status_code if status_code is not None else self.default_status_code
        self.code = code or self.default_code
        self.details = details or {}
        super().__init__(message)


# ---- Common subclasses — just convenience wrappers with the right defaults ----


class BadRequestError(HackathonException):
    default_status_code = 400
    default_code = "BAD_REQUEST"


class UnauthorizedError(HackathonException):
    default_status_code = 401
    default_code = "UNAUTHORIZED"


class ForbiddenError(HackathonException):
    default_status_code = 403
    default_code = "FORBIDDEN"


class NotFoundError(HackathonException):
    default_status_code = 404
    default_code = "NOT_FOUND"


class ConflictError(HackathonException):
    default_status_code = 409
    default_code = "CONFLICT"


class PayloadTooLargeError(HackathonException):
    default_status_code = 413
    default_code = "PAYLOAD_TOO_LARGE"


class UnsupportedMediaTypeError(HackathonException):
    default_status_code = 415
    default_code = "UNSUPPORTED_MEDIA_TYPE"
