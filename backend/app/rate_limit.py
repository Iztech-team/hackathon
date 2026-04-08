"""Shared rate limiter instance — imported by both main.py and route modules
so route decorators can reference it without circular imports.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address


limiter = Limiter(key_func=get_remote_address, default_limits=[])
