
DO $$
DECLARE v_id bigint; v_key text;
BEGIN
  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1;
  IF v_key IS NULL THEN
    SELECT decrypted_secret INTO v_key
    FROM vault.decrypted_secrets WHERE name ILIKE '%service_role%' LIMIT 1;
  END IF;

  FOR v_id IN SELECT jobid FROM cron.job WHERE jobname = 'parikshasathi-refill-paper-pool' LOOP
    PERFORM cron.unschedule(v_id);
  END LOOP;

  PERFORM cron.schedule(
    'parikshasathi-refill-paper-pool',
    '*/10 * * * *',
    format($f$
      SELECT net.http_post(
        url := 'https://project--919a0eec-4904-4552-a317-8eb48c9a8544.lovable.app/api/public/hooks/refill-pool',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', %L
        ),
        body := '{}'::jsonb
      );
    $f$, v_key)
  );
END $$;
