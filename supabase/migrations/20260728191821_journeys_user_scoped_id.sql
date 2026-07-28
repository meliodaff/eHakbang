-- The journeys.id the client generates is deterministic per life-event
-- (e.g. "ehakbang:journey:event:became-pwd"), the same string for every
-- user who starts that preset journey. With `id` as the sole primary key,
-- the second user (or account) to ever touch a given preset journey
-- collided with whichever user's row already held that id, and RLS
-- correctly rejected the cross-user overwrite (42501). The real invariant
-- is "one row per (user_id, id)", not "one row per id" -- fix the
-- constraint to match. Matching app-side change: journey-sync.ts and
-- stored-journeys.ts upsert with onConflict: "user_id,id" instead of "id".
alter table public.journeys drop constraint journeys_pkey;
alter table public.journeys add primary key (user_id, id);
