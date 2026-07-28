-- profiles is now the single source of truth for account data regardless
-- of sign-in method (email/password, Google, eGov SSO). The provider-
-- specific sensitive-data tables are no longer used by the app -- eGov SSO
-- now only persists full_name/phone into profiles; eVerify integration was
-- already removed from the app entirely.
drop table if exists public.egov_profiles;
drop table if exists public.everify_profiles;
