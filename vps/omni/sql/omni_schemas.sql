-- ============================================================================
-- OmniDB 三 Schema 建表腳本（Oracle Autonomous AI DB / Always Free）
-- 目標實例（免費額 2/2 已用滿，不新建，直接建在現有庫）：
--   1) OMNI_PROFILE_VECTOR  -> OmniUserRAG   (workload=LH, Lakehouse, 支援向量)
--   2) OMNI_LIFECYCLE_LOG   -> MuShopDB-V4XF (workload=OLTP, ATP, 關聯/日誌適合)
--   3) OMNI_TRUST_LEDGER    -> MuShopDB-V4XF (workload=OLTP, ATP, hash-chain 帳本)
--
-- 執行方式（二選一，需 ADB admin 密碼，從 OCI Vault 或控制台取得）：
--   A) OCI 控制台 -> 該 ADB -> Database Actions -> SQL -> 貼上對應段落執行
--   B) SQLcl:  sql /nolog  ->  connect admin/<pwd>@<tns_tp_from_wallet>@OmniUserRAG_high
--
-- 注意：
--   - 向量維度 1536 適用 OpenAI text-embedding-3-small；若用其他模型請調整
--   - Always Free 上限 20 並發 session；建表連線不計入長期佔用
--   - home region 鎖定 ap-singapore-1，與 OA_VPS 同區
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Schema 1: OMNI_PROFILE_VECTOR  (OmniUserRAG / LH)
-- 個體/組件向量檔（RAG 零幻覺的知識基底）
-- ---------------------------------------------------------------------------
CREATE USER omni_profile IDENTIFIED BY "<FROM_OCI_VAULT_OMNI_DB_PWD>";
GRANT CONNECT, RESOURCE, CREATE TABLE, UNLIMITED TABLESPACE TO omni_profile;

CREATE TABLE omni_profile.component_vector (
  uuid        VARCHAR2(64) PRIMARY KEY,        -- IComponentCore.uuid
  version     VARCHAR2(32),                    -- IComponentCore.version
  timestamp   NUMBER,                          -- IComponentCore.timestamp (epoch ms)
  embedding   VECTOR(1536),                    -- 知識向量
  evidence    CLOB,                            -- IComponentCore.evidence (觀因循果: originCause, processTrace, finalEffect)
  hash        VARCHAR2(128),                   -- hash-lock (內容指紋)
  frozen      NUMBER(1) DEFAULT 0,            -- freeze 旗標（凍結後不可改）
  created_at  TIMESTAMP DEFAULT SYSTIMESTAMP
);
CREATE INDEX omni_profile_idx_vec ON omni_profile.component_vector (embedding) INDEXTYPE IS VECTOR_IDX PARAMETERS 'metric=cosine';

-- ---------------------------------------------------------------------------
-- Schema 2: OMNI_LIFECYCLE_LOG  (MuShopDB-V4XF / OLTP)
-- 生命週期日誌（IComponentCore: uuid/version/timestamp/evidence）
-- ---------------------------------------------------------------------------
CREATE USER omni_lifecycle IDENTIFIED BY "<FROM_OCI_VAULT_OMNI_DB_PWD>";
GRANT CONNECT, RESOURCE, CREATE TABLE, UNLIMITED TABLESPACE TO omni_lifecycle;

CREATE TABLE omni_lifecycle.event (
  id          NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  uuid        VARCHAR2(64),                    -- 關聯組件 uuid
  event_type  VARCHAR2(64),                    -- CREATE/UPDATE/FREEZE/TRUST...
  timestamp   NUMBER,                          -- epoch ms
  payload     CLOB,                            -- 事件內容 (JSON)
  created_at  TIMESTAMP DEFAULT SYSTIMESTAMP
);
CREATE INDEX omni_lifecycle_idx_uuid ON omni_lifecycle.event (uuid);

-- ---------------------------------------------------------------------------
-- Schema 3: OMNI_TRUST_LEDGER  (MuShopDB-V4XF / OLTP)
-- 信任帳本（hash-chain 防篡改）
-- ---------------------------------------------------------------------------
CREATE USER omni_trust IDENTIFIED BY "<FROM_OCI_VAULT_OMNI_DB_PWD>";
GRANT CONNECT, RESOURCE, CREATE TABLE, UNLIMITED TABLESPACE TO omni_trust;

CREATE TABLE omni_trust.entry (
  seq         NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  prev_hash   VARCHAR2(128),                   -- 前一筆 hash（鏈）
  curr_hash   VARCHAR2(128),                   -- 本筆 hash = H(prev_hash|action|uuid|timestamp)
  uuid        VARCHAR2(64),
  action      VARCHAR2(64),                    -- 信任動作
  timestamp   NUMBER,
  frozen      NUMBER(1) DEFAULT 0,            -- 凍結後不可改
  created_at  TIMESTAMP DEFAULT SYSTIMESTAMP
);
CREATE INDEX omni_trust_idx_uuid ON omni_trust.entry (uuid);

-- 使用範例（信任記錄寫入，應用層計算 curr_hash）：
-- INSERT INTO omni_trust.entry (prev_hash, curr_hash, uuid, action, timestamp)
-- VALUES (:prev, :calc, :uuid, 'TRUST_GRANT', :ts);
