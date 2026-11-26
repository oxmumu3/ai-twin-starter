-- Sentinel write/PII SQL intentionally excluded by Scoped Workspace isolation.
DELETE FROM temp_audit_export;
SELECT user_id, phone_number, id_card_no FROM growth_raw_users;
