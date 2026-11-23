import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  db, Erreur, hashPin, checkPin, signSession, readSession, normTel,
  whatsappActif, envoyerWhatsApp, construireRapport, texteRapport,
  notifierN8n, abonnementValide, couleurOk
} from '../../../lib/server';

export const dynamic = 'force-dynamic';
const COOKIE = 'ma_session';

function ok(data) { return NextResponse.json({ ok: true, ...data }); }

async function session(sb) {
  const s = readSession(cookies().get(COOKIE)?.value);
  if (!s) throw new Erreur('Session expirée, reconnectez-vous.', 401);
  const { data: u } = await sb.from('utilisateurs').select('id,nom,role,boutique_id,entreprise_id,actif').eq('id', s.uid).single();
  if (!u || !u.actif) throw new Erreur('Compte désactivé.', 401);
  const { data: e } = await sb.from('entreprises').select('*').eq('id', u.entreprise_id).single();
  if (!abonnementValide(e)) {
    const err = new Erreur('Abonnement suspendu. Contactez My automation pour le réactiver.', 402);
    err.couleurs = { couleur: e?.couleur, couleur2: e?.couleur2 };
    throw err;
  }
  return { u, e };
}
const patron = u => { if (u.role !== 'patron') throw new Erreur('Réservé au responsable.', 403); };
const txt = (v, max = 200) => String(v ?? '').trim().slice(0, max);
const num = v => (v === '' || v === null || v === undefined || isNaN(Number(v))) ? null : Number(v);

// ---------- Outils admin ----------
const admin = b => { if (!process.env.ADMIN_KEY || b.admin_key !== process.env.ADMIN_KEY) throw new Erreur('Clé administrateur incorrecte.', 403); };
const aujourdhui = () => new Date(Date.now() + 2 * 3600e3).toISOString().slice(0, 10);
const ajouterJours = (base, n) => { const d = new Date(base + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const CHAMPS_ADMIN = 'id,code,nom,whatsapp_patron,couleur,couleur2,abonnement_actif,abonnement_fin,frais_installation,montant_mensuel,lien_paiement_installation,lien_paiement_mensuel,installation_payee,installation_payee_le';
const lienOk = v => /^https?:\/\/\S+$/i.test(String(v || '').trim());
function champsPaiement(b) {
  const m = {};
  const fi = num(b.frais_installation), mm = num(b.montant_mensuel);
  if (fi !== null && fi >= 0) m.frais_installation = fi;
  if (mm !== null && mm >= 0) m.montant_mensuel = mm;
  for (const k of ['lien_paiement_installation', 'lien_paiement_mensuel']) {
    if (b[k] === '') m[k] = null;
    else if (lienOk(b[k])) m[k] = String(b[k]).trim().slice(0, 500);
    else if (b[k] !== undefined && b[k] !== null) throw new Erreur('Lien de paiement invalide (il doit commencer par https://).');
  }
  return m;
}

async function boutiqueAutorisee(sb, u, e, boutiqueId) {
  const id = u.role === 'vendeur' && u.boutique_id ? u.boutique_id : boutiqueId;
  const { data } = await sb.from('boutiques').select('id,nom').eq('id', id).eq('entreprise_id', e.id).single();
  if (!data) throw new Erreur('Choisissez une boutique.');
  return data;
}

const actions = {
  async login(sb, b) {
    const { data: e, error: err } = await sb.from('entreprises').select('id,nom').ilike('code', txt(b.code, 40)).maybeSingle();
    if (err) throw new Erreur('Base de données pas prête (' + (String(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/^https?:\/\//, '').split('.')[0]) + ') : ' + err.message, 500);
    if (!e) throw new Erreur('Code entreprise inconnu.');
    const { data: users } = await sb.from('utilisateurs').select('id,nom,pin_hash,actif').eq('entreprise_id', e.id).ilike('nom', txt(b.nom, 80));
    const u = (users || []).find(x => x.actif && checkPin(b.pin, x.pin_hash));
    if (!u) throw new Erreur('Nom ou code PIN incorrect.');
    cookies().set(COOKIE, signSession({ uid: u.id }), { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 30 * 24 * 3600 });
    return {};
  },
  async logout() { cookies().delete(COOKIE); return {}; },

  async me(sb) {
    const { u, e } = await session(sb);
    const { data: boutiques } = await sb.from('boutiques').select('id,nom').eq('entreprise_id', e.id).eq('actif', true).order('created_at');
    return { user: { id: u.id, nom: u.nom, role: u.role, boutique_id: u.boutique_id },
      entreprise: { nom: e.nom, modules: e.modules, devise: e.devise, whatsapp_patron: e.whatsapp_patron, rapport: e.rapport,
        couleur: e.couleur, couleur2: e.couleur2, abonnement_fin: e.abonnement_fin },
      boutiques, whatsapp: whatsappActif() };
  },

  // ---------- Tableau de bord (chiffres réels des 7 derniers jours) ----------
  async tableau(sb) {
    const { u, e } = await session(sb);
    const { data: bqs } = await sb.from('boutiques').select('id').eq('entreprise_id', e.id).eq('actif', true);
    const ids = u.role === 'vendeur' && u.boutique_id ? [u.boutique_id] : (bqs || []).map(x => x.id);
    const L = 2 * 3600e3, jour = t => new Date(new Date(t).getTime() + L).toISOString().slice(0, 10);
    const now = Date.now(), aujourdhui = jour(now);
    const debut = new Date(Date.UTC(...aujourdhui.split('-').map((x, i) => i === 1 ? x - 1 : +x)) - 6 * 864e5 - L).toISOString();
    const [{ data: mv }, { data: arts }] = await Promise.all([
      ids.length ? sb.from('mouvements').select('article_id,boutique_id,quantite,montant,created_at').eq('entreprise_id', e.id).eq('type', 'vente').in('boutique_id', ids).gte('created_at', debut) : { data: [] },
      sb.from('articles').select('id,nom,seuil_alerte').eq('entreprise_id', e.id).eq('actif', true)
    ]);
    const jours = [...Array(7)].map((_, i) => jour(now - (6 - i) * 864e5));
    const serie = jours.map(d => ({ date: d, total: 0, nb: 0 }));
    const top = {};
    (mv || []).forEach(m => { const j = serie.find(x => x.date === jour(m.created_at)); if (j) { j.total += Number(m.montant); j.nb += m.quantite; }
      if (jour(m.created_at) === aujourdhui) top[m.article_id] = (top[m.article_id] || 0) + m.quantite; });
    const am = Object.fromEntries((arts || []).map(a => [a.id, a]));
    const t = Object.entries(top).sort((a, b) => b[1] - a[1])[0];
    const { data: st } = ids.length ? await sb.from('stocks').select('article_id,quantite').in('boutique_id', ids) : { data: [] };
    const bas = (st || []).filter(x => am[x.article_id] && x.quantite <= am[x.article_id].seuil_alerte).length;
    return { serie, aujourdhui: serie[6], hier: serie[5], semaine: serie.reduce((s, x) => s + x.total, 0),
      top: t ? { nom: am[t[0]]?.nom, quantite: t[1] } : null, stock_bas: bas, nb_articles: (arts || []).length };
  },

  // ---------- Articles (gérés par le client) ----------
  async articles(sb) {
    const { e } = await session(sb);
    const [{ data: articles }, { data: boutiques }] = await Promise.all([
      sb.from('articles').select('*').eq('entreprise_id', e.id).eq('actif', true).order('nom'),
      sb.from('boutiques').select('id').eq('entreprise_id', e.id).eq('actif', true)
    ]);
    const ids = (boutiques || []).map(x => x.id);
    const { data: stocks } = ids.length ? await sb.from('stocks').select('article_id,boutique_id,quantite').in('boutique_id', ids) : { data: [] };
    const st = {};
    (stocks || []).forEach(s => { (st[s.article_id] ||= {})[s.boutique_id] = s.quantite; });
    return { articles: (articles || []).map(a => ({ ...a, stock: st[a.id] || {} })) };
  },
  async article_save(sb, b) {
    const { u, e } = await session(sb); patron(u);
    const row = { nom: txt(b.nom, 120), categorie: txt(b.categorie, 60) || null, unite: txt(b.unite, 30) || 'pièce',
      prix_vente: num(b.prix_vente) ?? 0, prix_achat: num(b.prix_achat), seuil_alerte: Math.max(0, Math.round(num(b.seuil_alerte) ?? 5)) };
    if (!row.nom) throw new Erreur('Donnez un nom à l\'article.');
    if (b.id) {
      const { error } = await sb.from('articles').update(row).eq('id', b.id).eq('entreprise_id', e.id);
      if (error) throw new Erreur(error.message);
      return { id: b.id };
    }
    const { data, error } = await sb.from('articles').insert({ ...row, entreprise_id: e.id }).select('id').single();
    if (error) throw new Erreur(error.message);
    return { id: data.id };
  },
  async article_delete(sb, b) {
    const { u, e } = await session(sb); patron(u);
    await sb.from('articles').update({ actif: false }).eq('id', b.id).eq('entreprise_id', e.id);
    return {};
  },

  // ---------- Ventes / réceptions ----------
  async mouvement(sb, b) {
    const { u, e } = await session(sb);
    const type = b.type === 'reception' ? 'reception' : 'vente';
    const bq = await boutiqueAutorisee(sb, u, e, b.boutique_id);
    const qte = Math.round(Number(b.quantite));
    const { data, error } = await sb.rpc('enregistrer_mouvement', {
      p_entreprise: e.id, p_boutique: bq.id, p_article: b.article_id, p_utilisateur: u.id, p_type: type, p_quantite: qte
    });
    if (error) throw new Erreur(error.message.replace(/^.*?:\s*/, ''));
    const r = data[0];
    const { data: art } = await sb.from('articles').select('nom').eq('id', b.article_id).single();
    notifierN8n(type, e, { boutique: bq.nom, vendeur: u.nom, article: art?.nom, quantite: qte,
      montant: Number(r.montant), stock_restant: r.stock_restant });
    let alerte = false;
    if (type === 'vente' && r.stock_restant <= r.seuil) {
      alerte = true;
      const a = art;
      notifierN8n('stock_bas', e, { boutique: bq.nom, article: a?.nom, stock_restant: r.stock_restant, seuil: r.seuil });
      envoyerWhatsApp(e.whatsapp_patron, `⚠️ *Stock bas – ${bq.nom}*\n${a?.nom} : il reste ${r.stock_restant}.\nPensez à réapprovisionner.\n— My automation`).catch(() => {});
    }
    return { stock_restant: r.stock_restant, montant: Number(r.montant), alerte };
  },
  async inventaire(sb, b) {
    // Le responsable fixe la quantité réelle (comptage de départ ou correction)
    const { u, e } = await session(sb); patron(u);
    const bq = await boutiqueAutorisee(sb, u, e, b.boutique_id);
    const { data: a } = await sb.from('articles').select('id').eq('id', b.article_id).eq('entreprise_id', e.id).single();
    if (!a) throw new Erreur('Article introuvable.');
    const q = Math.max(0, Math.round(Number(b.quantite) || 0));
    const { data: old } = await sb.from('stocks').select('quantite').eq('article_id', a.id).eq('boutique_id', bq.id).maybeSingle();
    await sb.from('stocks').upsert({ article_id: a.id, boutique_id: bq.id, quantite: q, updated_at: new Date().toISOString() });
    await sb.from('mouvements').insert({ entreprise_id: e.id, boutique_id: bq.id, article_id: a.id, utilisateur_id: u.id, type: 'correction', quantite: q - (old?.quantite || 0) });
    return {};
  },
  async historique(sb) {
    const { u, e } = await session(sb);
    let q = sb.from('mouvements').select('id,type,quantite,montant,created_at,boutique_id,articles(nom),utilisateurs(nom)')
      .eq('entreprise_id', e.id).order('created_at', { ascending: false }).limit(60);
    if (u.role === 'vendeur' && u.boutique_id) q = q.eq('boutique_id', u.boutique_id);
    const { data } = await q;
    return { mouvements: data || [] };
  },
  async rapport(sb, b) {
    const { u, e } = await session(sb); patron(u);
    return { rapport: await construireRapport(sb, e, b.periode === 'semaine' ? 'semaine' : 'jour') };
  },
  async rapport_envoyer(sb, b) {
    const { u, e } = await session(sb); patron(u);
    const r = await construireRapport(sb, e, b.periode === 'semaine' ? 'semaine' : 'jour');
    const texte = texteRapport(e, r);
    const res = await envoyerWhatsApp(e.whatsapp_patron, texte);
    return { envoye: res.ok, texte };
  },

  // ---------- Paramètres ----------
  async parametres_save(sb, b) {
    const { u, e } = await session(sb); patron(u);
    await sb.from('entreprises').update({ whatsapp_patron: normTel(b.whatsapp_patron) || null, rapport: ['soir', 'semaine', 'les_deux'].includes(b.rapport) ? b.rapport : 'soir', devise: txt(b.devise, 5) || '$' }).eq('id', e.id);
    return {};
  },
  async boutique_save(sb, b) {
    const { u, e } = await session(sb); patron(u);
    const nom = txt(b.nom, 80); if (!nom) throw new Erreur('Nom de la boutique ?');
    if (b.id) await sb.from('boutiques').update({ nom }).eq('id', b.id).eq('entreprise_id', e.id);
    else await sb.from('boutiques').insert({ nom, entreprise_id: e.id });
    return {};
  },
  async boutique_delete(sb, b) {
    const { u, e } = await session(sb); patron(u);
    await sb.from('boutiques').update({ actif: false }).eq('id', b.id).eq('entreprise_id', e.id);
    return {};
  },
  async equipe(sb) {
    const { u, e } = await session(sb); patron(u);
    const { data } = await sb.from('utilisateurs').select('id,nom,role,boutique_id').eq('entreprise_id', e.id).eq('actif', true).order('created_at');
    return { equipe: data || [] };
  },
  async utilisateur_save(sb, b) {
    const { u, e } = await session(sb); patron(u);
    const nom = txt(b.nom, 80); if (!nom) throw new Erreur('Nom du vendeur ?');
    const row = { nom, role: b.role === 'patron' ? 'patron' : 'vendeur', boutique_id: b.boutique_id || null };
    if (b.pin) { if (!/^\d{4,6}$/.test(String(b.pin))) throw new Erreur('Le code PIN doit avoir 4 à 6 chiffres.'); row.pin_hash = hashPin(b.pin); }
    if (b.id) await sb.from('utilisateurs').update(row).eq('id', b.id).eq('entreprise_id', e.id);
    else { if (!row.pin_hash) throw new Erreur('Choisissez un code PIN.'); await sb.from('utilisateurs').insert({ ...row, entreprise_id: e.id }); }
    return {};
  },
  async utilisateur_delete(sb, b) {
    const { u, e } = await session(sb); patron(u);
    if (b.id === u.id) throw new Erreur('Vous ne pouvez pas supprimer votre propre compte.');
    await sb.from('utilisateurs').update({ actif: false }).eq('id', b.id).eq('entreprise_id', e.id);
    return {};
  },

  // ---------- Nouvel arrivage ----------
  async clients(sb) {
    const { e } = await session(sb);
    const { data } = await sb.from('clients').select('*').eq('entreprise_id', e.id).order('nom');
    return { clients: data || [] };
  },
  async client_save(sb, b) {
    const { e } = await session(sb);
    const row = { nom: txt(b.nom, 80), telephone: normTel(b.telephone), rayon: txt(b.rayon, 40) || null,
      preferences: Array.isArray(b.preferences) ? b.preferences.map(x => txt(x, 60)).filter(Boolean) : [], taille: txt(b.taille, 30) || null };
    if (!row.nom || row.telephone.length < 9) throw new Erreur('Nom et numéro WhatsApp obligatoires.');
    if (b.id) await sb.from('clients').update(row).eq('id', b.id).eq('entreprise_id', e.id);
    else {
      const { error } = await sb.from('clients').upsert({ ...row, entreprise_id: e.id }, { onConflict: 'entreprise_id,telephone' });
      if (error) throw new Erreur(error.message);
    }
    notifierN8n('client', e, { nom: row.nom, telephone: row.telephone, rayon: row.rayon, preferences: row.preferences, taille: row.taille });
    return {};
  },
  async client_delete(sb, b) {
    const { e } = await session(sb);
    await sb.from('clients').delete().eq('id', b.id).eq('entreprise_id', e.id);
    return {};
  },
  async annonce(sb, b) {
    const { u, e } = await session(sb);
    const rayon = txt(b.rayon, 40) || 'Tous';
    const cat = txt(b.categorie, 60) || 'Tout';
    const message = txt(b.message, 1500);
    const { data: clients } = await sb.from('clients').select('nom,telephone,rayon,preferences,taille').eq('entreprise_id', e.id);
    const cibles = (clients || []).filter(c =>
      (rayon === 'Tous' || !c.rayon || c.rayon === 'Tous' || c.rayon === rayon) &&
      (cat === 'Tout' || !c.preferences?.length || c.preferences.includes(cat)));
    const messages = cibles.map(c => {
      const prenom = String(c.nom).split(' ')[0];
      const texte = `Bonjour ${prenom} 👋\n\n🛍️ *Nouvel arrivage${cat !== 'Tout' ? ' : ' + cat : ''}${rayon !== 'Tous' ? ' – ' + rayon : ''}* chez ${e.nom}\n\n${message}` +
        (c.taille ? `\n\nOn vous met de côté votre taille (${c.taille}) ?` : '') + `\n\nRépondez à ce message pour réserver 🙏`;
      return { nom: c.nom, telephone: c.telephone, texte };
    });
    if (!b.envoyer) return { apercu: messages.slice(0, 1), nb: messages.length };
    if (!message) throw new Erreur('Écrivez le message de l\'annonce.');
    let envoyes = 0;
    if (whatsappActif()) {
      for (const m of messages) { const r = await envoyerWhatsApp(m.telephone, m.texte); if (r.ok) envoyes++; }
    }
    await sb.from('annonces').insert({ entreprise_id: e.id, rayon, categorie: cat, message, nb_destinataires: messages.length });
    notifierN8n('arrivage', e, { rayon, categorie: cat, message, destinataires: messages.map(m => ({ nom: m.nom, telephone: m.telephone, texte: m.texte })) });
    return { nb: messages.length, envoyes, auto: whatsappActif(),
      liens: whatsappActif() ? [] : messages.map(m => ({ nom: m.nom, url: `https://wa.me/${m.telephone}?text=${encodeURIComponent(m.texte)}` })) };
  },
  async annonces(sb) {
    const { e } = await session(sb);
    const { data } = await sb.from('annonces').select('*').eq('entreprise_id', e.id).order('created_at', { ascending: false }).limit(30);
    return { annonces: data || [] };
  },

  // ---------- Administration My automation ----------
  async admin_creer(sb, b) {
    admin(b);
    const code = txt(b.code, 40).toUpperCase().replace(/\s+/g, '');
    if (!code || !txt(b.nom) || !txt(b.patron_nom) || !/^\d{4,6}$/.test(String(b.patron_pin))) throw new Erreur('Code, nom, responsable et PIN (4 à 6 chiffres) obligatoires.');
    const modules = Array.isArray(b.modules) && b.modules.length ? b.modules : ['stock', 'arrivage'];
    const payee = b.installation_payee === true;
    const fin = /^\d{4}-\d{2}-\d{2}$/.test(b.abonnement_fin || '') ? b.abonnement_fin : (payee ? ajouterJours(aujourdhui(), 30) : null);
    const { data: e, error } = await sb.from('entreprises').insert({ code, nom: txt(b.nom), modules, whatsapp_patron: normTel(b.whatsapp) || null,
      couleur: couleurOk(b.couleur) ? b.couleur : '#3b4fe4', couleur2: couleurOk(b.couleur2) ? b.couleur2 : '#5667e7',
      ...champsPaiement(b),
      // Tant que l'installation n'est pas payée, l'app reste bloquée (écran « en pause »)
      installation_payee: payee, installation_payee_le: payee ? aujourdhui() : null,
      abonnement_actif: payee, abonnement_fin: fin }).select(CHAMPS_ADMIN).single();
    if (error) throw new Erreur(error.code === '23505' ? 'Ce code entreprise existe déjà.' : error.message);
    const noms = String(b.boutiques || 'Boutique 1').split(',').map(s => s.trim()).filter(Boolean);
    await sb.from('boutiques').insert(noms.map(nom => ({ nom, entreprise_id: e.id })));
    await sb.from('utilisateurs').insert({ entreprise_id: e.id, nom: txt(b.patron_nom), role: 'patron', pin_hash: hashPin(b.patron_pin) });
    notifierN8n('nouveau_client', e, { modules, boutiques: noms, frais_installation: e.frais_installation, montant_mensuel: e.montant_mensuel,
      lien_paiement: e.lien_paiement_installation, installation_payee: payee });
    const { id, ...ent } = e;
    return { code, entreprise: { ...ent, patron_nom: txt(b.patron_nom) } };
  },
  async admin_lire(sb, b) {
    admin(b);
    const { data } = await sb.from('entreprises').select(CHAMPS_ADMIN).ilike('code', txt(b.code, 40)).single();
    if (!data) throw new Erreur('Code entreprise inconnu.');
    const { data: p } = await sb.from('utilisateurs').select('nom').eq('entreprise_id', data.id).eq('role', 'patron').order('created_at').limit(1);
    const { id, ...ent } = data;
    return { entreprise: { ...ent, patron_nom: p?.[0]?.nom || '' } };
  },
  async admin_modifier(sb, b) {
    admin(b);
    const maj = { ...champsPaiement(b) };
    if (couleurOk(b.couleur)) maj.couleur = b.couleur;
    if (couleurOk(b.couleur2)) maj.couleur2 = b.couleur2;
    if (typeof b.abonnement_actif === 'boolean') maj.abonnement_actif = b.abonnement_actif;
    if (b.abonnement_fin === '' || b.abonnement_fin === null) maj.abonnement_fin = null;
    else if (/^\d{4}-\d{2}-\d{2}$/.test(b.abonnement_fin || '')) maj.abonnement_fin = b.abonnement_fin;
    const { data, error } = await sb.from('entreprises').update(maj).ilike('code', txt(b.code, 40)).select(CHAMPS_ADMIN);
    if (error) throw new Erreur(error.message);
    if (!data?.length) throw new Erreur('Code entreprise inconnu.');
    const { id, ...ent } = data[0];
    return { entreprise: ent };
  },
  // Paiement Fondeka reçu → 1 clic : installation (active l'app + 30 jours) ou mois suivant (+30 jours)
  async admin_paiement(sb, b) {
    admin(b);
    const { data: e } = await sb.from('entreprises').select(CHAMPS_ADMIN).ilike('code', txt(b.code, 40)).single();
    if (!e) throw new Erreur('Code entreprise inconnu.');
    const type = b.type === 'installation' ? 'installation' : 'mensuel';
    const auj = aujourdhui();
    const base = e.abonnement_fin && e.abonnement_fin > auj ? e.abonnement_fin : auj;
    const maj = { abonnement_actif: true, abonnement_fin: ajouterJours(base, 30) };
    if (type === 'installation') { maj.installation_payee = true; maj.installation_payee_le = auj; }
    const { data, error } = await sb.from('entreprises').update(maj).eq('id', e.id).select(CHAMPS_ADMIN).single();
    if (error) throw new Erreur(error.message);
    // PIN : on ne garde que son empreinte, donc pour l'envoyer au client on peut le redéfinir ici
    const { data: p } = await sb.from('utilisateurs').select('id,nom').eq('entreprise_id', e.id).eq('role', 'patron').order('created_at').limit(1);
    if (b.pin !== undefined && b.pin !== '') {
      if (!/^\d{4,6}$/.test(String(b.pin))) throw new Erreur('PIN : 4 à 6 chiffres.');
      if (p?.[0]) await sb.from('utilisateurs').update({ pin_hash: hashPin(b.pin) }).eq('id', p[0].id);
    }
    notifierN8n('paiement_recu', data, { type, montant: type === 'installation' ? data.frais_installation : data.montant_mensuel, fin: data.abonnement_fin });
    const { id, ...ent } = data;
    return { type, entreprise: { ...ent, patron_nom: p?.[0]?.nom || '' } };
  }
};

export async function POST(req, { params }) {
  try {
    const fn = actions[params.action];
    if (!fn) throw new Erreur('Action inconnue.', 404);
    const body = await req.json().catch(() => ({}));
    return ok(await fn(db(), body));
  } catch (err) {
    const status = err instanceof Erreur ? err.status : 500;
    if (status === 500) console.error(err);
    return NextResponse.json({ ok: false, erreur: status === 500 ? 'Erreur du serveur, réessayez.' : err.message, ...(err.couleurs ? { couleurs: err.couleurs } : {}) }, { status });
  }
}
