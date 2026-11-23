-- My automation – base de données (Supabase / PostgreSQL)
-- À coller une seule fois dans Supabase > SQL Editor > New query > Run.

create extension if not exists pgcrypto;

-- Une entreprise = un client de My automation
create table if not exists entreprises (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,              -- code de connexion de l'entreprise (ex : KAPA4)
  nom text not null,
  modules text[] not null default '{stock,arrivage}',
  devise text not null default '$',
  whatsapp_patron text,                   -- reçoit les alertes et comptes rendus
  rapport text not null default 'soir',   -- soir | semaine | les_deux
  created_at timestamptz not null default now()
);

create table if not exists boutiques (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references entreprises(id) on delete cascade,
  nom text not null,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

-- Patron et vendeurs : connexion par nom + code PIN
create table if not exists utilisateurs (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references entreprises(id) on delete cascade,
  boutique_id uuid references boutiques(id) on delete set null, -- null = toutes les boutiques (patron)
  nom text not null,
  role text not null check (role in ('patron','vendeur')),
  pin_hash text not null,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

-- Articles gérés par le client lui-même (ajout, modification, retrait)
create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references entreprises(id) on delete cascade,
  nom text not null,
  categorie text,
  unite text not null default 'pièce',
  prix_vente numeric(12,2) not null default 0,
  prix_achat numeric(12,2),
  seuil_alerte integer not null default 5,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

-- Quantité de chaque article dans chaque boutique
create table if not exists stocks (
  article_id uuid not null references articles(id) on delete cascade,
  boutique_id uuid not null references boutiques(id) on delete cascade,
  quantite integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (article_id, boutique_id)
);

-- Historique : ventes, réceptions, corrections
create table if not exists mouvements (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references entreprises(id) on delete cascade,
  boutique_id uuid not null references boutiques(id) on delete cascade,
  article_id uuid not null references articles(id) on delete cascade,
  utilisateur_id uuid references utilisateurs(id) on delete set null,
  type text not null check (type in ('vente','reception','correction')),
  quantite integer not null,
  montant numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists mouvements_entreprise_date on mouvements (entreprise_id, created_at desc);

-- Module Nouvel arrivage : clientes et annonces
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references entreprises(id) on delete cascade,
  nom text not null,
  telephone text not null,
  rayon text,
  preferences text[] not null default '{}',
  taille text,
  created_at timestamptz not null default now(),
  unique (entreprise_id, telephone)
);

create table if not exists annonces (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references entreprises(id) on delete cascade,
  rayon text,
  categorie text,
  message text not null,
  nb_destinataires integer not null default 0,
  created_at timestamptz not null default now()
);

-- Vente ou réception en une seule opération sûre (pas de stock négatif)
create or replace function enregistrer_mouvement(
  p_entreprise uuid, p_boutique uuid, p_article uuid, p_utilisateur uuid,
  p_type text, p_quantite integer
) returns table (stock_restant integer, seuil integer, montant numeric)
language plpgsql as $$
declare
  v_stock integer;
  v_prix numeric;
  v_seuil integer;
  v_delta integer;
begin
  if p_quantite <= 0 then raise exception 'Quantité invalide'; end if;
  select prix_vente, seuil_alerte into v_prix, v_seuil from articles
    where id = p_article and entreprise_id = p_entreprise and actif;
  if not found then raise exception 'Article introuvable'; end if;
  perform 1 from boutiques where id = p_boutique and entreprise_id = p_entreprise;
  if not found then raise exception 'Boutique introuvable'; end if;

  insert into stocks (article_id, boutique_id, quantite) values (p_article, p_boutique, 0)
    on conflict do nothing;
  select quantite into v_stock from stocks
    where article_id = p_article and boutique_id = p_boutique for update;

  v_delta := case when p_type = 'vente' then -p_quantite else p_quantite end;
  if v_stock + v_delta < 0 then
    raise exception 'Stock insuffisant : il reste %', v_stock;
  end if;

  update stocks set quantite = v_stock + v_delta, updated_at = now()
    where article_id = p_article and boutique_id = p_boutique;

  insert into mouvements (entreprise_id, boutique_id, article_id, utilisateur_id, type, quantite, montant)
    values (p_entreprise, p_boutique, p_article, p_utilisateur, p_type, p_quantite,
            case when p_type = 'vente' then p_quantite * v_prix else 0 end);

  return query select v_stock + v_delta, v_seuil,
    (case when p_type = 'vente' then p_quantite * v_prix else 0 end)::numeric;
end $$;

-- Sécurité : seules les routes serveur de l'app (clé service) accèdent aux données.
alter table entreprises enable row level security;
alter table boutiques enable row level security;
alter table utilisateurs enable row level security;
alter table articles enable row level security;
alter table stocks enable row level security;
alter table mouvements enable row level security;
alter table clients enable row level security;
alter table annonces enable row level security;

-- Abonnement (piloté par n8n / My automation) et couleurs de l'app
alter table entreprises add column if not exists couleur text not null default '#3b4fe4';
alter table entreprises add column if not exists couleur2 text not null default '#5667e7';
alter table entreprises add column if not exists abonnement_actif boolean not null default true;
alter table entreprises add column if not exists abonnement_fin date;

-- Fonction réservée au serveur de l'app (clé service), pas au public
alter function enregistrer_mouvement(uuid,uuid,uuid,uuid,text,integer) set search_path = public;
revoke execute on function enregistrer_mouvement(uuid,uuid,uuid,uuid,text,integer) from public, anon, authenticated;

-- Paiement (Fondeka) : frais d'installation + abonnement mensuel
alter table entreprises add column if not exists frais_installation numeric(12,2) not null default 15;
alter table entreprises add column if not exists montant_mensuel numeric(12,2) not null default 10;
alter table entreprises add column if not exists lien_paiement_installation text;
alter table entreprises add column if not exists lien_paiement_mensuel text;
alter table entreprises add column if not exists installation_payee boolean not null default false;
alter table entreprises add column if not exists installation_payee_le date;
-- Les clients déjà créés avant cette mise à jour sont considérés comme installés
update entreprises set installation_payee = true where installation_payee = false and created_at < now();
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
