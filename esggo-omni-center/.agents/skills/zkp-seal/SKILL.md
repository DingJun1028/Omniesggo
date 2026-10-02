---
name: zkp-seal
description: "Use this skill to perform Zero-Knowledge Proof (ZKP) cryptographic sealing on evidence documents and records within the ESG GO platform."
version: 1.0.0
---

# ZKP Seal Skill (稽核與封印技能)

This Agent Skill equips you to handle the cryptographic sealing of ESG data and evidence. By performing a ZKP Seal, you are confirming the integrity, authenticity, and non-repudiation of a document or data row, transforming it into a "T4 Trustworthy" verified asset.

## When to use this skill

Activate this skill when the user asks to:
1. "Seal" an evidence document or record.
2. Verify or cryptographically lock a document ID.
3. Perform a ZKP (Zero-Knowledge Proof) operation.
4. "封印" (Seal) or "進行 ZKP 驗證" (Perform ZKP validation) on a specific piece of evidence.

## Instructions

To execute a ZKP seal, you MUST use the OmniAgent Native CLI tool located in the project workspace. 

Follow these steps exactly:

1. Identify the target Document ID (uuid or specific string identifier) requested by the user. If the user does not provide an ID, ask them to provide one (e.g. "請提供需要封印的文件 ID").
2. Execute the `omni.mjs` CLI tool using the following command format:
   ```bash
   node cli/omni.mjs vault seal <document_id>
   ```
3. Read the output of the CLI command.
4. Provide a structured summary of the operation back to the user, ensuring to highlight:
   - The Document ID sealed.
   - The SHA-256 Hash Lock generated.
   - The final Verification Status.

## Required Environment

Ensure that the environment variables `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are properly configured in `.env`, as the `omni.mjs` script relies on these for executing the database updates.

## Technical Details

The `omni.mjs vault seal` command performs the following backend actions:
- Simulates the ZKP generation delay (Proof-of-Work).
- Updates the `evidence_vault` table for the specific ID, setting `status` to `verified`, `zkp_proof` to `true`, and storing a unique `hash_lock`.
- Injects a verified `ZKP_SEAL` action record into the `audit_logs` table for T5 Trackability.
