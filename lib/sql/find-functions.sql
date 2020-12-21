SELECT * FROM information_schema.routines
WHERE routine_type='FUNCTION'
  AND specific_schema='public'
  AND routine_definition IS NOT NUll
  AND data_type!='trigger';
