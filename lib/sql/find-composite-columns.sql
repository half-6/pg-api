SELECT  attribute_name as column_name,
  CASE WHEN data_type = 'ARRAY' THEN concat(substring(attribute_udt_name,2) , '[]')
    ELSE attribute_udt_name
  END AS type,
  *
FROM information_schema.attributes