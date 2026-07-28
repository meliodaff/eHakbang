create table if not exists public.id_wallets (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  held_ids    jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now()
);

comment on table public.id_wallets is 'Per-user saved ID Wallet selection (which government ID *types* -- never numbers/documents -- the citizen has told the app they hold). Written only when the citizen taps "Save changes" on the wallet screen.';

alter table public.id_wallets enable row level security;

create policy "Users can view their own id wallet"
  on public.id_wallets for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own id wallet"
  on public.id_wallets for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own id wallet"
  on public.id_wallets for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
