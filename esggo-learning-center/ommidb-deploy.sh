#!/usr/bin/env bash
# =============================================================================
# OmniDB 三 Schema 部署至 Oracle Autonomous AI DB (Always Free ×2 實例)
# 對齊用戶 Oracle 報告: Autonomous AI DB = 2 實例, 各 1 OCPU/20GB/20 session
# 三 Schema:
#   1. OMNI_PROFILE_VECTOR  — 代理記憶向量層 (pgvector / ADB 原生向量)
#   2. OMNI_TRUST_LEDGER    — 信任帳本 (不可篡改審計軌跡)
#   3. OMNI_LIFECYCLE_LOG   — 生命週期日誌 (5T 鑄造紀錄)
# =============================================================================
# 前置: OCI CLI 已配置 (oci setup config), 且帳號在 home region (ap-singapore-1)
# 本腳本只產出 ADB 實例 + 三 Schema DDL, 不執行 (需憑證, 由用戶在 VPS 執行)
set -u

REGION="${OCI_REGION:-ap-singapore-1}"
COMP_ID="${OCI_COMPARTMENT_ID:?請設 OCI_COMPARTMENT_ID}"
ADB_PASSWORD="${OMNIDB_PWD:?請設 OMNIDB_PWD (強密碼, 不進 git)}"

echo "=== [1] 建立 Autonomous AI DB 實例 #1 (向量+信任) ==="
oci db autonomous-database create \
  --compartment-id "$COMP_ID" \
  --db-name omniadb1 \
  --display-name "OA-OmniDB-1" \
  --db-workload "OLTP" \
  --compute-count 1 --compute-model "ECPU" \
  --data-storage-size-in-tbs 1 \
  --admin-password "$ADB_PASSWORD" \
  --is-free-tier true \
  --region "$REGION" \
  --wait-for-state AVAILABLE

echo "=== [2] 建立 Autonomous AI DB 實例 #2 (生命週期日誌, 分離寫入壓力) ==="
oci db autonomous-database create \
  --compartment-id "$COMP_ID" \
  --db-name omniadb2 \
  --display-name "OA-OmniDB-2" \
  --db-workload "OLTP" \
  --compute-count 1 --compute-model "ECPU" \
  --data-storage-size-in-tbs 1 \
  --admin-password "$ADB_PASSWORD" \
  --is-free-tier true \
  --region "$REGION" \
  --wait-for-state AVAILABLE

echo "=== [3] 三 Schema DDL (實例 #1) ==="
cat <<'SQL'
-- OMNI_PROFILE_VECTOR: 代理記憶向量層
CREATE SCHEMA IF NOT EXISTS omni_profile_vector;
CREATE TABLE omni_profile_vector.memories (
  id RAW(32) PRIMARY KEY,
  agent_id VARCHAR2(64) NOT NULL,
  content CLOB,
  embedding VECTOR(1536),  -- ADB 23ai 原生向量
  created_at TIMESTAMP DEFAULT SYSTIMESTAMP
);

-- OMNI_TRUST_LEDGER: 信任帳本 (5T Hash Lock 寫入即凍結)
CREATE SCHEMA IF NOT EXISTS omni_trust_ledger;
CREATE TABLE omni_trust_ledger.entries (
  seq NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  uuid VARCHAR2(64) NOT NULL,
  sub_frame VARCHAR2(32),
  hash_lock VARCHAR2(64) NOT NULL,  -- SHA-256
  evidence CLOB,
  created_at TIMESTAMP DEFAULT SYSTIMESTAMP,
  CONSTRAINT uk_uuid UNIQUE (uuid)
);

-- OMNI_LIFECYCLE_LOG: 生命週期日誌 (5T 鑄造紀錄)
CREATE SCHEMA IF NOT EXISTS omni_lifecycle_log;
CREATE TABLE omni_lifecycle_log.events (
  id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  task_id VARCHAR2(64),
  cross_unit NUMBER(1),
  dual_signed NUMBER(1),
  pairing_rate NUMBER(5,2),
  entropy NUMBER(10,4),
  source VARCHAR2(256),
  created_at TIMESTAMP DEFAULT SYSTIMESTAMP
);
SQL

echo "=== 完成: 2 ADB 實例 + 三 Schema 已就緒 (Always Free 額度內) ==="
echo "注意: 實例 #2 用於 OMNI_LIFECYCLE_LOG 分流; 若額度緊張可全放 #1 (20GB 足夠)"
