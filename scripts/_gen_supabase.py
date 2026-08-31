import re

content = '''Learn how to get up and running with Supabase through tutorials, APIs and platform resources.
## Getting Started
Set up and connect a database in just a few minutes.
- [Start with Supabase AI prompts](https://supabase.com/docs/guides/getting-started/ai-prompts)
## Products
- [Database — full Postgres for every project with Realtime, backups, extensions](https://supabase.com/docs/guides/database/overview)
- [Auth — email/password, passwordless, OAuth, mobile logins](https://supabase.com/docs/guides/auth)
- [Storage — store, organize, transform, serve large files with RLS](https://supabase.com/docs/guides/storage)
- [Realtime — listen to DB changes, sync states, broadcast](https://supabase.com/docs/guides/realtime)
- [Edge Functions — globally distributed server-side functions](https://supabase.com/docs/guides/functions)
## Postgres Modules
- [AI & Vectors](https://supabase.com/docs/guides/ai)
- [Cron](https://supabase.com/docs/guides/cron)
- [Queues](https://supabase.com/docs/guides/queues)
## Client Libraries
- [Javascript](https://supabase.com/docs/reference/javascript/introduction)
- [Flutter](https://supabase.com/docs/reference/dart/introduction)
- [Python](https://supabase.com/docs/reference/python/introduction)
- [C#](https://supabase.com/docs/reference/csharp/introduction)
- [Swift](https://supabase.com/docs/reference/swift/introduction)
- [Kotlin](https://supabase.com/docs/reference/kotlin/introduction)
## Migrate to Supabase
- [Amazon RDS](https://supabase.com/docs/guides/platform/migrating-to-supabase/amazon-rds)
- [Auth0](https://supabase.com/docs/guides/platform/migrating-to-supabase/auth0)
- [Firebase Auth](https://supabase.com/docs/guides/platform/migrating-to-supabase/firebase-auth)
- [Firebase Storage](https://supabase.com/docs/guides/platform/migrating-to-supabase/firebase-storage)
- [Firestore Data](https://supabase.com/docs/guides/platform/migrating-to-supabase/firestore-data)
- [Heroku](https://supabase.com/docs/guides/platform/migrating-to-supabase/heroku)
- [MSSQL](https://supabase.com/docs/guides/platform/migrating-to-supabase/mssql)
- [MySQL](https://supabase.com/docs/guides/platform/migrating-to-supabase/mysql)
- [Neon](https://supabase.com/docs/guides/platform/migrating-to-supabase/neon)
- [Postgres](https://supabase.com/docs/guides/platform/migrating-to-supabase/postgres)
- [Render](https://supabase.com/docs/guides/platform/migrating-to-supabase/render)
- [Vercel Postgres](https://supabase.com/docs/guides/platform/migrating-to-supabase/vercel-postgres)
## Additional resources
- [Management API](https://supabase.com/docs/reference/api/introduction)
- [Supabase CLI](https://supabase.com/docs/reference/cli/introduction)
- [Platform Guides](https://supabase.com/docs/guides/platform)
- [Integrations](https://supabase.com/docs/guides/integrations)
## Self-Hosting
- [Auth](https://supabase.com/docs/reference/self-hosting-auth/introduction)
- [Realtime](https://supabase.com/docs/reference/self-hosting-realtime/introduction)
- [Storage](https://supabase.com/docs/reference/self-hosting-storage/introduction)
- [Analytics](https://supabase.com/docs/reference/self-hosting-analytics/introduction)

> 來源: https://supabase.com/docs (Notion 連結頁，S3 簽名圖已略去)
'''

md = f"""---
title: Supabase Docs
source: Notion
notion_id: 227ccd20-97d7-81cb-857f-c924d4a33357
tags: [Supabase, 文檔, 參考]
---

# Supabase Docs

{content}
"""
open(r"C:/Users/dingj/iCloudDrive/iCloud~md~obsidian/DingJun/Notion_Import/Supabase Docs.md","w",encoding="utf-8").write(md)
print("WRITTEN", len(md))
