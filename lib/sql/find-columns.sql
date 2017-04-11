SELECT ccu.column_name = c.column_name AS is_primary_key,c.*
  FROM information_schema.columns AS c
  LEFT JOIN information_schema.table_constraints tc ON tc.table_schema =c.table_schema AND tc.table_name = c.table_name
  LEFT JOIN information_schema.constraint_column_usage ccu ON tc.table_schema =ccu.table_schema AND tc.table_name = ccu.table_name
where c.table_schema NOT IN ('pg_catalog', 'information_schema')
AND constraint_type = 'PRIMARY KEY'
ORDER BY c.table_schema,c.table_name,c.ordinal_position
