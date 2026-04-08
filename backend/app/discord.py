"""Async Discord webhook notifier for unexpected backend errors.

The catch-all error handler in main.py calls `notify_unhandled_error()` when
something blows up that we didn't explicitly raise. The call is:
  - best-effort (a failing webhook never breaks the request)
  - non-blocking (fire-and-forget via asyncio.create_task)
  - throttled (same error fingerprint within RATE_LIMIT_WINDOW seconds is skipped)

No webhook URL configured? The function is a no-op.
"""
import asyncio
import hashlib
import logging
import time
import traceback
from typing import Optional

import httpx

from app.config import get_settings

logger = logging.getLogger("hackathon.discord")

# Don't re-post the same error fingerprint more than once per window.
RATE_LIMIT_WINDOW_SECONDS = 60
_recent_posts: dict[str, float] = {}

# Discord's hard message cap is 2000 characters. Leave headroom for the header.
MAX_MESSAGE_CHARS = 1800


def _fingerprint(request_method: str, request_path: str, exc: BaseException) -> str:
    """Short hash of (exc type, top of traceback, route) for rate limiting."""
    tb_summary = traceback.format_exception_only(type(exc), exc)[-1].strip()
    h = hashlib.sha1(f"{request_method}|{request_path}|{tb_summary}".encode()).hexdigest()
    return h[:12]


async def _post_to_discord(webhook_url: str, content: str) -> None:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(webhook_url, json={"content": content})
            if resp.status_code >= 400:
                logger.warning(
                    "Discord webhook returned %d: %s", resp.status_code, resp.text[:200]
                )
    except Exception as e:  # pragma: no cover  — never fail the request
        logger.warning("Failed to post to Discord: %s", e)


def notify_unhandled_error(
    exc: BaseException,
    *,
    request_method: str = "?",
    request_path: str = "?",
    client_ip: Optional[str] = None,
) -> None:
    """Schedule a Discord notification for an unexpected error. Safe to call
    from inside a FastAPI exception handler / middleware. Returns immediately.
    """
    settings = get_settings()
    webhook_url = getattr(settings, "DISCORD_WEBHOOK_URL", "")
    if not webhook_url:
        return  # feature disabled

    # Rate limit identical errors
    fp = _fingerprint(request_method, request_path, exc)
    now = time.monotonic()
    last = _recent_posts.get(fp, 0)
    if now - last < RATE_LIMIT_WINDOW_SECONDS:
        return
    _recent_posts[fp] = now
    # Garbage-collect old fingerprints to prevent unbounded growth
    for k, t in list(_recent_posts.items()):
        if now - t > RATE_LIMIT_WINDOW_SECONDS * 5:
            _recent_posts.pop(k, None)

    tb = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    if len(tb) > MAX_MESSAGE_CHARS:
        tb = tb[-MAX_MESSAGE_CHARS:]

    header_lines = [
        "🚨 **Unhandled backend error**",
        f"`{request_method} {request_path}`",
    ]
    if client_ip:
        header_lines.append(f"client: `{client_ip}`")
    header = "\n".join(header_lines)

    content = f"{header}\n```python\n{tb}\n```"
    if len(content) > 2000:
        # Drop the traceback to fit — better to post something than nothing
        content = f"{header}\n`{type(exc).__name__}: {str(exc)[:500]}`"

    # Fire and forget; never block the response.
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(_post_to_discord(webhook_url, content))
    except RuntimeError:
        # No running loop (rare for FastAPI handlers). Skip.
        pass
