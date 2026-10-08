---
name: accidental-data-loss-prevention
description: |
  **STOP AND VERIFY**: Before running any command or tool that results in irreversible data loss, you MUST obtain explicit user consent.
  When in doubt, ask. It is better to wait for confirmation than to accidentally delete production data or critical project assets.
  Use this for:
  - SQL: DROP TABLE/VIEW/SCHEMA/DATABASE, TRUNCATE, or broad DELETE (missing WHERE or using 1=1).
  - Cloud Storage: gsutil rm or gcloud storage rm targeting production data or critical buckets.
  - Infrastructure: gcloud projects delete, deleting Spanner/BigQuery/Dataproc resources, deleting secrets, or KMS key destruction.
license: Apache-2.0
metadata:
  version: v1
  publisher: google
uuid: "9ad5115e-cef9-4a86-a78d-d2dd20fc835e"
version: "1.0.0"
timestamp: 1780748189000
evidence:
  protocol: "ISO-14064-1-compliant-emulation"
  verification: "Zero-Hallucination-Validated"
  source_origin: "infoone://skills/accidental-data-loss-prevention"
---

# Accidental Data Loss Prevention

> [!CAUTION]
>
> **STOP AND VERIFY**: Before running any command or tool that results in
> irreversible data loss, you **MUST** obtain explicit user consent.

## Mandatory Procedure

1.  **Halt Execution**: Do **not** execute the command.
2.  **Request Consent**: Explain clearly to the user:
    -   The **impact** of this deletion.
    -   **Why** you believe this is necessary.
    -   A request for their **explicit approval** to proceed.
3.  **Wait**: Only proceed if the user provides clear, affirmative consent in
    the conversation.
