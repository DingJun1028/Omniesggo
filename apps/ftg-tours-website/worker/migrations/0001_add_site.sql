-- lead-api: contact_inquiries 加 site 欄位（區分 ftg / htb 來源）
-- 部署： wrangler d1 execute ftgtours_contact --remote --file migrations/0001_add_site.sql
ALTER TABLE contact_inquiries ADD COLUMN site TEXT DEFAULT 'ftg';
