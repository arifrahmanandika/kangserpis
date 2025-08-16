create table public.settings (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  store_name text null,
  store_address text null,
  store_phone text null,
  header_note text null,
  footer_note text null,
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint settings_pkey primary key (id),
  constraint settings_user_id_key unique (user_id),
  constraint settings_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.transactions (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  customer_name text not null,
  device_type text not null,
  services jsonb not null,
  notes text null,
  created_by_user_id uuid null,
  created_by_user_email text not null,
  constraint transactions_pkey primary key (id),
  constraint transactions_created_by_user_id_fkey foreign KEY (created_by_user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;