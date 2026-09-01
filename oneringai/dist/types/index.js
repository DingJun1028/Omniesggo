/**
 * Core types and interfaces for the OneRingAI unified agent library.
 * These are the fundamental building blocks that all other modules depend on.
 */
// ============================================================================
// Vendor & Provider Enums
// ============================================================================
/**
 * Supported AI vendors/providers
 */
export var Vendor;
(function (Vendor) {
    Vendor["OpenAI"] = "openai";
    Vendor["Anthropic"] = "anthropic";
    Vendor["Google"] = "google";
    Vendor["Vertex"] = "vertex";
    Vendor["Groq"] = "groq";
    Vendor["Together"] = "together";
    Vendor["Perplexity"] = "perplexity";
    Vendor["Grok"] = "grok";
    Vendor["DeepSeek"] = "deepseek";
    Vendor["Mistral"] = "mistral";
    Vendor["Ollama"] = "ollama";
    Vendor["Custom"] = "custom";
})(Vendor || (Vendor = {}));
/**
 * Service types for external APIs (connectors)
 */
export var Services;
(function (Services) {
    Services["Serper"] = "serper";
    Services["Brave"] = "brave";
    Services["Tavily"] = "tavily";
    Services["RapidAPI"] = "rapidapi";
    Services["Zenrows"] = "zenrows";
    Services["JinaReader"] = "jinareader";
    Services["Firecrawl"] = "firecrawl";
    Services["ScrapingBee"] = "scrapingbee";
    Services["Github"] = "github";
    Services["Gitlab"] = "gitlab";
    Services["Slack"] = "slack";
    Services["Discord"] = "discord";
    Services["Telegram"] = "telegram";
    Services["Twilio"] = "twilio";
    Services["Zoom"] = "zoom";
    Services["Microsoft"] = "microsoft";
    Services["GoogleAPI"] = "google-api";
    Services["Notion"] = "notion";
    Services["Asana"] = "asana";
    Services["Airtable"] = "airtable";
    Services["Trello"] = "trello";
    Services["Salesforce"] = "salesforce";
    Services["HubSpot"] = "hubspot";
    Services["Zendesk"] = "zendesk";
    Services["Intercom"] = "intercom";
    Services["Stripe"] = "stripe";
    Services["PayPal"] = "paypal";
    Services["QuickBooks"] = "quickbooks";
    Services["Ramp"] = "ramp";
    Services["AWS"] = "aws";
    Services["Cloudflare"] = "cloudflare";
    Services["Dropbox"] = "dropbox";
    Services["Box"] = "box";
    Services["SendGrid"] = "sendgrid";
    Services["Mailchimp"] = "mailchimp";
    Services["Postmark"] = "postmark";
    Services["Mailgun"] = "mailgun";
    Services["EmailBison"] = "emailbison";
    Services["Datadog"] = "datadog";
    Services["PagerDuty"] = "pagerduty";
    Services["Sentry"] = "sentry";
    Services["Jira"] = "jira";
    Services["Linear"] = "linear";
    Services["Bitbucket"] = "bitbucket";
    Services["Confluence"] = "confluence";
    Services["CalCom"] = "calcom";
    Services["Calendly"] = "calendly";
})(Services || (Services = {}));
//# sourceMappingURL=index.js.map