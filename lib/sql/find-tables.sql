SELECT table_schema AS schema,table_name AS name , table_type AS type
FROM information_schema.tables
WHERE (table_type = 'BASE TABLE' OR table_type = 'VIEW')
      AND table_schema NOT IN ('pg_catalog', 'information_schema')