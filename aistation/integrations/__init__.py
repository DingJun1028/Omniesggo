"""
AI Station integrations — email newsletter, Telegram, Slack, webhooks.
Aligned with soul.md §9.9 電子報發送能力整合.
"""

from .newsletter import NewsletterDispatcher, DispatchConfig, DispatchResult

__all__ = [
    "NewsletterDispatcher",
    "DispatchConfig",
    "DispatchResult",
]
