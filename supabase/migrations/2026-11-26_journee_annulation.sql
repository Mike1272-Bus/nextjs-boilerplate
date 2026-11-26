-- My automation – 26/11/2026
-- 1) Heure de début de la journée de travail (0 = minuit, 9 = de 9h à 8h59 le lendemain)
-- 2) Le franc congolais devient la monnaie par défaut des nouveaux clients
-- 3) Annulation d'une vente par le responsable (le stock revient, la vente reste visible barrée)
-- À coller dans Supabase > SQL Editor > New query > Run (une seule fois).

alter table entreprises add column if not exists debut_journee smallint not null default 0;
do $$ begin
  alter table entreprises add constraint entreprises_debut_journee_ok check (debut_journee between 0 and 23);
exception when duplicate_object then null; end $$;

alter table entreprises alter column devise set default 'FC';

alter table mouvements add column if not exists annule_le timestamptz;
alter table mouvements add column if not exists annule_par uuid references utilisateurs(id) on delete set null;

create or replace function annuler_vente(p_entreprise uuid, p_mouvement uuid, p_utilisateur uuid)
returns table (stock_restant integer)
language plpgsql as $$
declare
  m mouvements%rowtype;
  v_stock integer;
begin
  select * into m from mouvements where id = p_mouvement and entreprise_id = p_entreprise for update;
  if not found then raise exception 'Vente introuvable'; end if;
  if m.type <> 'vente' then raise exception 'Seule une vente peut être annulée'; end if;
  if m.annule_le is not null then raise exception 'Cette vente est déjà annulée'; end if;
  if m.created_at < now() - interval '7 days' then raise exception 'Vente trop ancienne (plus de 7 jours) : faites une correction de stock'; end if;

  insert into stocks (article_id, boutique_id, quantite) values (m.article_id, m.boutique_id, 0) on conflict do nothing;
  update stocks set quantite = quantite + m.quantite, updated_at = now()
    where article_id = m.article_id and boutique_id = m.boutique_id
    returning quantite into v_stock;
  update mouvements set annule_le = now(), annule_par = p_utilisateur where id = m.id;
  return query select v_stock;
end $$;
