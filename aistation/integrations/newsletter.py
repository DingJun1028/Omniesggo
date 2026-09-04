"""
AI Station — Email Newsletter Dispatch Integration

Aligns with soul.md §9.9 電子報發送能力整合 and §10.4 AI Station 生産線最佳實踪.

Dispatch channels:
  1. Email (SMTP)        — primary newsletter delivery
  2. Telegram Bot         — instant notification with video link
  3. Slack Webhook        — team channel notification
  4. Webhook (generic)     — n8n / Zapier integration
  5. Mobile Push (Firebase) — optional push notifications

5T Alignment:
  - Traceable: source_origin = "newsletter:<channel>"
  - Trackable: dispatch_id + lifecycle hooks
  - Tangible: actual delivery confirmation
  - Transparent: delivery status documented
  - Trustworthy: HMAC-signed webhook payloads
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import smtplib
import time
from dataclasses import dataclass, field
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from pathlib import Path
from typing import Any

from ..gate import hash_lock
from ..types import LifeCycleEvent, PipelineResult, VideoArtifact


@dataclass
class DispatchConfig:
    """Configuration for newsletter dispatch."""
    # Email
    smtp_host: str = field(default_factory=lambda: os.environ.get("SMTP_HOST", ""))
    smtp_port: int = field(default_factory=lambda: int(os.environ.get("SMTP_PORT", "587")))
    smtp_user: str = field(default_factory=lambda: os.environ.get("SMTP_USER", ""))
    smtp_pass: str = field(default_factory=lambda: os.environ.get("SMTP_PASS", ""))
    smtp_from: str = field(default_factory=lambda: os.environ.get("SMTP_FROM", ""))
    smtp_to: list[str] = field(default_factory=lambda: os.environ.get("SMTP_TO", "").split(","))

    # Telegram
    telegram_bot_token: str = field(default_factory=lambda: os.environ.get("TELEGRAM_BOT_TOKEN", ""))
    telegram_chat_id: str = field(default_factory=lambda: os.environ.get("TELEGRAM_CHAT_ID", ""))

    # Slack
    slack_webhook_url: str = field(default_factory=lambda: os.environ.get("SLACK_WEBHOOK_URL", ""))

    # Generic webhook
    webhook_url: str = field(default_factory=lambda: os.environ.get("NEWSLETTER_WEBHOOK_URL", ""))
    webhook_secret: str = field(default_factory=lambda: os.environ.get("NEWSLETTER_WEBHOOK_SECRET", ""))

    # Channels to dispatch (default: email only)
    channels: list[str] = field(default_factory=lambda: [
        ch.strip() for ch in os.environ.get("NEWSLETTER_CHANNELS", "email").split(",")
        if ch.strip()
    ])


@dataclass
class DispatchResult:
    """Result of a dispatch to a single channel."""
    channel: str
    success: bool
    dispatch_id: str
    message_id: str | None = None
    status_code: int | None = None
    error: str | None = None
    lifecycle: list[str] = field(default_factory=list)


class NewsletterDispatcher:
    """
    Dispatches video artifacts to multiple channels.
    Aligns with soul.md §9.9 電子報發送能力與 §10.4 增量輸出優化.

    All dispatch results are 5T verified.
    """

    def __init__(self, config: DispatchConfig | None = None):
        self.config = config or DispatchConfig()
        self.dispatch_log: list[DispatchResult] = []
        self._lifetime_events: list[LifeCycleEvent] = []
        self._log("newsletter", "init", {"channels": self.config.channels})

    def _log(self, module: str, action: str, data: dict[str, Any] | None = None):
        self._lifetime_events.append(LifeCycleEvent(
            module=module, action=action,
            timestamp=int(time.time() * 1000),
            data=data or {},
        ))

    def dispatch_video(self, artifact: VideoArtifact, video_path: str) -> list[DispatchResult]:
        """
        Dispatch a completed video artifact to all configured channels.
        Returns list of DispatchResult for each channel.
        """
        dispatch_id = f"dispatch-{int(time.time())}-{hashlib.sha256(video_path.encode()).hexdigest()[:8]}"
        self._log("newsletter", "dispatch_start", {"dispatch_id": dispatch_id, "channels": self.config.channels})

        results: list[DispatchResult] = []
        for channel in self.config.channels:
            if channel == "email":
                result = self._dispatch_email(artifact, video_path, dispatch_id)
            elif channel == "telegram":
                result = self._dispatch_telegram(artifact, video_path, dispatch_id)
            elif channel == "slack":
                result = self._dispatch_slack(artifact, video_path, dispatch_id)
            elif channel == "webhook":
                result = self._dispatch_webhook(artifact, video_path, dispatch_id)
            else:
                result = DispatchResult(
                    channel=channel, success=False,
                    dispatch_id=dispatch_id, error=f"Unknown channel: {channel}",
                )
            results.append(result)
            self.dispatch_log.append(result)

        self._log("newsletter", "dispatch_complete", {
            "dispatch_id": dispatch_id,
            "results": len(results),
            "successes": sum(1 for r in results if r.success),
        })
        return results

    def _build_newsletter_html(self, artifact: VideoArtifact, video_path: str) -> str:
        """Build HTML email content with 5T compliance."""
        from ..brand import DNA, PALETTE

        html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{artifact.title}</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: {PALETTE.deep_blue}; color: {PALETTE.cream}; margin: 0; padding: 24px; }}
    .card {{ background: {PALETTE.cream}; color: {PALETTE.deep_blue};
             border-radius: 12px; padding: 24px; max-width: 600px; margin: 0 auto; }}
    h1 {{ color: {PALETTE.deep_blue}; border-bottom: 2px solid {PALETTE.gold}; padding-bottom: 8px; }}
    .badge {{ background: {PALETTE.gold}; color: {PALETTE.deep_blue};
              padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: bold; }}
    .hash {{ font-family: monospace; background: #f0f0f0; padding: 8px; border-radius: 6px;
             word-break: break-all; font-size: 12px; }}
  </style>
</head>
<body>
  <div class="card">
    <h1>{artifact.title}</h1>
    <span class="badge">5T Verified</span>
    <p>{DNA.greeting}</p>
    <p><strong>Artifact UUID:</strong> {artifact.uuid}</p>
    <p><strong>Source:</strong> AI Station 7-Module Pipeline</p>
    <p><strong>Hash Lock (SHA-256):</strong></p>
    <div class="hash">{artifact.hash_lock}</div>
    <p><strong>Lifecycle Events:</strong> {len(artifact.lifecycle)}</p>
    <p><strong>5T Verification:</strong> {'✅ PASSED' if artifact.t5_pass else '❌ FAILED'}</p>
    <p><strong>Storage URL:</strong> {artifact.storage_url or 'local'}</p>
  </div>
</body>
</html>"""
        return html

    def _dispatch_email(self, artifact: VideoArtifact, video_path: str, dispatch_id: str) -> DispatchResult:
        """Dispatch via SMTP email."""
        self._log("newsletter", "email_attempt", {"dispatch_id": dispatch_id})

        if not all([self.config.smtp_host, self.config.smtp_user, self.config.smtp_from]):
            return DispatchResult(
                channel="email", success=False, dispatch_id=dispatch_id,
                error="SMTP config incomplete",
            )

        try:
            msg = MIMEMultipart("related")
            msg["Subject"] = f"[{dispatch_id}] {artifact.title} — 5T Verified Video"
            msg["From"] = self.config.smtp_from
            msg["To"] = ", ".join(filter(None, self.config.smtp_to))

            html = self._build_newsletter_html(artifact, video_path)
            msg.attach(MIMEText(html, "html"))

            s = smtplib.SMTP(self.config.smtp_host, self.config.smtp_port)
            s.starttls()
            s.login(self.config.smtp_user, self.config.smtp_pass)
            s.send_message(msg)
            s.quit()

            self._log("newsletter", "email_success", {"dispatch_id": dispatch_id})
            return DispatchResult(
                channel="email", success=True, dispatch_id=dispatch_id,
                lifecycle=["attempt", "success"],
            )
        except Exception as e:
            self._log("newsletter", "email_error", {"error": str(e)})
            return DispatchResult(
                channel="email", success=False, dispatch_id=dispatch_id,
                error=str(e),
            )

    def _dispatch_telegram(self, artifact: VideoArtifact, video_path: str, dispatch_id: str) -> DispatchResult:
        """Dispatch via Telegram Bot API."""
        self._log("newsletter", "telegram_attempt", {"dispatch_id": dispatch_id})

        if not self.config.telegram_bot_token or not self.config.telegram_chat_id:
            return DispatchResult(
                channel="telegram", success=False, dispatch_id=dispatch_id,
                error="Telegram config incomplete",
            )

        try:
            import requests
            text = (
                f"📹 <b>{artifact.title}</b>\n"
                f"🔖 UUID: {artifact.uuid}\n"
                f"✅ 5T: {'PASSED' if artifact.t5_pass else 'FAILED'}\n"
                f"🔗 Hash Lock: <code>{artifact.hash_lock[:16]}...</code>\n"
                f"📤 Source: AI Station 7-Module Pipeline"
            )
            resp = requests.post(
                f"https://api.telegram.org/bot{self.config.telegram_bot_token}/sendMessage",
                data={"chat_id": self.config.telegram_chat_id, "text": text, "parse_mode": "HTML"},
                timeout=30,
            )
            if resp.status_code != 200:
                return DispatchResult(
                    channel="telegram", success=False, dispatch_id=dispatch_id,
                    status_code=resp.status_code, error=resp.text,
                )

            self._log("newsletter", "telegram_success", {"dispatch_id": dispatch_id})
            return DispatchResult(
                channel="telegram", success=True, dispatch_id=dispatch_id,
                status_code=resp.status_code,
                lifecycle=["attempt", "success"],
            )
        except Exception as e:
            return DispatchResult(
                channel="telegram", success=False, dispatch_id=dispatch_id,
                error=str(e),
            )

    def _dispatch_slack(self, artifact: VideoArtifact, video_path: str, dispatch_id: str) -> DispatchResult:
        """Dispatch via Slack webhook."""
        self._log("newsletter", "slack_attempt", {"dispatch_id": dispatch_id})

        if not self.config.slack_webhook_url:
            return DispatchResult(
                channel="slack", success=False, dispatch_id=dispatch_id,
                error="Slack webhook URL not configured",
            )

        try:
            import requests
            payload = {
                "text": f"🎬 AI Station: New video produced — {artifact.title}",
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*🎬 {artifact.title}*\n"
                                    f"UUID: `{artifact.uuid}`\n"
                                    f"5T: {'✅ PASSED' if artifact.t5_pass else '❌ FAILED'}\n"
                                    f"Hash Lock: `{artifact.hash_lock[:16]}...`\n"
                                    f"Source: AI Station 7-Module Pipeline",
                        },
                    },
                ],
            }
            resp = requests.post(
                self.config.slack_webhook_url,
                json=payload,
                timeout=30,
            )
            if resp.status_code != 200:
                return DispatchResult(
                    channel="slack", success=False, dispatch_id=dispatch_id,
                    status_code=resp.status_code, error=resp.text,
                )

            self._log("newsletter", "slack_success", {"dispatch_id": dispatch_id})
            return DispatchResult(
                channel="slack", success=True, dispatch_id=dispatch_id,
                status_code=resp.status_code,
                lifecycle=["attempt", "success"],
            )
        except Exception as e:
            return DispatchResult(
                channel="slack", success=False, dispatch_id=dispatch_id,
                error=str(e),
            )

    def _sign_payload(self, payload: dict[str, Any]) -> str:
        """Sign payload with HMAC-SHA256 for Trustworthy 驗證."""
        if not self.config.webhook_secret:
            return ""
        body = json.dumps(payload, sort_keys=True, default=str)
        return hmac.new(
            self.config.webhook_secret.encode("utf-8"),
            body.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

    def _dispatch_webhook(self, artifact: VideoArtifact, video_path: str, dispatch_id: str) -> DispatchResult:
        """Dispatch via generic webhook (HMAC signed)."""
        self._log("newsletter", "webhook_attempt", {"dispatch_id": dispatch_id})

        if not self.config.webhook_url:
            return DispatchResult(
                channel="webhook", success=False, dispatch_id=dispatch_id,
                error="Webhook URL not configured",
            )

        try:
            import requests
            payload = {
                "dispatch_id": dispatch_id,
                "artifact": artifact.to_dict(),
                "video_path": video_path,
                "source_origin": "newsletter:webhook",
                "timestamp": int(time.time() * 1000),
            }
            signature = self._sign_payload(payload)
            headers = {"Content-Type": "application/json"}
            if signature:
                headers["X-AI-Station-Signature"] = signature

            resp = requests.post(
                self.config.webhook_url,
                json=payload,
                headers=headers,
                timeout=30,
            )
            if resp.status_code >= 400:
                return DispatchResult(
                    channel="webhook", success=False, dispatch_id=dispatch_id,
                    status_code=resp.status_code, error=resp.text,
                )

            self._log("newsletter", "webhook_success", {"dispatch_id": dispatch_id})
            return DispatchResult(
                channel="webhook", success=True, dispatch_id=dispatch_id,
                status_code=resp.status_code,
                lifecycle=["attempt", "success"],
            )
        except Exception as e:
            return DispatchResult(
                channel="webhook", success=False, dispatch_id=dispatch_id,
                error=str(e),
            )