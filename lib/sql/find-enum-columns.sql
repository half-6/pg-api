SELECT pg_type.typname AS enum_type,
       pg_enum.enumlabel AS enum_label
FROM pg_type
  JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid;