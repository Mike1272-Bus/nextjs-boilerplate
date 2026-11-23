-- Factures My automation (page de paiement /payer/...) + réglages des moyens de paiement
create table if not exists factures (
  id uuid primary key default gen_random_uuid(),
  numero bigserial unique,
  entreprise_id uuid not null references entreprises(id) on delete cascade,
  type text not null check (type in ('installation','mensuel')),
  libelle text not null,
  montant numeric(12,2) not null,
  statut text not null default 'en_attente' check (statut in ('en_attente','declaree','payee','annulee')),
  operateur text,
  transaction text,
  telephone text,
  declaree_le timestamptz,
  payee_le timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists factures_entreprise on factures (entreprise_id, created_at desc);

create table if not exists parametres (
  cle text primary key,
  valeur jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table factures enable row level security;
alter table parametres enable row level security;
