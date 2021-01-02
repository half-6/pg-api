SELECT information_schema.routines.*,pg_get_function_arguments(pg_proc.oid) as arguments FROM information_schema.routines
left join pg_proc on pg_proc.proname = routine_name
WHERE routine_type='FUNCTION'
  AND specific_schema='public'
  AND routine_definition IS NOT NUll
  AND data_type!='trigger';
-- select pg_get_functiondef(oid), pg_get_function_arguments(oid),pg_get_function_result(oid), pg_get_function_identity_arguments(oid)
-- from pg_proc
-- where proowner!=10;
