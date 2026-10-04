-- Apply only after deploying followup-reminders and configuring Vault secrets:
-- uyuni_functions_url = https://<Lovable project's host>/functions/v1
-- uyuni_followup_cron_secret = same value as Edge FOLLOWUP_CRON_SECRET.
-- No credentials are embedded in this file. 12:00 UTC = 08:00/09:00 Santiago.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
select cron.schedule('uyuni-followup-reminders','0 12 * * *',$job$
 select net.http_post(
  url := (select decrypted_secret from vault.decrypted_secrets where name='uyuni_functions_url') || '/followup-reminders',
  headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',
   (select decrypted_secret from vault.decrypted_secrets where name='uyuni_followup_cron_secret')),
  body := '{}'::jsonb, timeout_milliseconds := 60000
 );
$job$);
