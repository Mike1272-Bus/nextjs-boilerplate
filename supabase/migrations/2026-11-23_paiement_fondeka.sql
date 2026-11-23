-- Paiement (Fondeka) : frais d'installation + abonnement mensuel
alter table entreprises add column if not exists frais_installation numeric(12,2) not null default 15;
alter table entreprises add column if not exists montant_mensuel numeric(12,2) not null default 10;
alter table entreprises add column if not exists lien_paiement_installation text;
alter table entreprises add column if not exists lien_paiement_mensuel text;
alter table entreprises add column if not exists installation_payee boolean not null default false;
alter table entreprises add column if not exists installation_payee_le date;
-- Les clients déjà créés avant cette mise à jour sont considérés comme installés
update entreprises set installation_payee = true where installation_payee = false and created_at < now();
