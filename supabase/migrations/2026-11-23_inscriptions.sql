-- Formulaire d'inscription client (/inscription) : les réponses arrivent ici, Mike valide dans /admin
create table if not exists inscriptions (
  id uuid primary key default gen_random_uuid(),
  donnees jsonb not null,
  statut text not null default 'nouvelle' check (statut in ('nouvelle','validee','refusee')),
  entreprise_id uuid references entreprises(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists inscriptions_statut on inscriptions (statut, created_at desc);
alter table inscriptions enable row level security;
