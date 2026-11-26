import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

export function db() {
  if (!URL || !KEY) throw new Erreur('La base de données n\'est pas encore connectée.', 503);
  return createClient(URL, KEY, { auth: { persistSession: false } });
}

export class Erreur extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

const SECRET = process.env.SESSION_SECRET || KEY || 'dev-secret';

export function hashPin(pin) {
  const salt = crypto.randomBytes(16).toString('hex');
  const h = crypto.scryptSync(String(pin), salt, 32).toString('hex');
  return `${salt}:${h}`;
}
export function checkPin(pin, stored) {
  const [salt, h] = String(stored || '').split(':');
  if (!salt || !h) return false;
  const test = crypto.scryptSync(String(pin), salt, 32).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(test, 'hex'));
}

export function signSession(data) {
  const body = Buffer.from(JSON.stringify({ ...data, exp: Date.now() + 30 * 24 * 3600e3 })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}
export function readSession(token) {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const good = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  const data = JSON.parse(Buffer.from(body, 'base64url').toString());
  return data.exp > Date.now() ? data : null;
}

export function normTel(t) {
  let tel = String(t || '').replace(/\D/g, '');
  if (tel.startsWith('00')) tel = tel.slice(2);
  if (tel.startsWith('0')) tel = '243' + tel.slice(1);
  if (tel.length === 9) tel = '243' + tel;
  return tel;
}

export const whatsappActif = () => !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);

export async function envoyerWhatsApp(to, texte) {
  if (!whatsappActif() || !to) return { ok: false };
  const r = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: normTel(to), type: 'text', text: { body: texte } })
  });
  return { ok: r.ok };
}

// Journée de travail : par défaut minuit → minuit (Lubumbashi, UTC+2).
// Avec debut_journee = 9, la journée va de 9h00 à 8h59 le lendemain.
const FUSEAU = 2 * 3600e3;
export const heureDebut = e => { const h = Math.round(Number(e?.debut_journee) || 0); return h >= 0 && h <= 23 ? h : 0; };
// Date (AAAA-MM-JJ) de la journée de travail à laquelle appartient un instant
export const jourMetier = (t, e) => new Date(new Date(t).getTime() + FUSEAU - heureDebut(e) * 3600e3).toISOString().slice(0, 10);
// Instant (ISO UTC) où commence une journée de travail donnée
export const debutJour = (date, e) => new Date(Date.parse(date + 'T00:00:00Z') - FUSEAU + heureDebut(e) * 3600e3).toISOString();
export const decalerJour = (date, n) => { const d = new Date(date + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

export function debutPeriode(periode, e) {
  const auj = jourMetier(Date.now(), e);
  return debutJour(periode === 'semaine' ? decalerJour(auj, -6) : auj, e);
}
// Une vente annulée ne compte plus dans les chiffres
export const venteValide = m => m.type === 'vente' && !m.annule_le;

export async function construireRapport(sb, entreprise, periode = 'jour') {
  const depuis = debutPeriode(periode, entreprise);
  let [{ data: boutiques }, { data: mvts }, { data: articles }] = await Promise.all([
    sb.from('boutiques').select('id,nom').eq('entreprise_id', entreprise.id).eq('actif', true).order('created_at'),
    sb.from('mouvements').select('*').eq('entreprise_id', entreprise.id).eq('type', 'vente').gte('created_at', depuis),
    sb.from('articles').select('id,nom,seuil_alerte').eq('entreprise_id', entreprise.id).eq('actif', true)
  ]);
  mvts = (mvts || []).filter(venteValide);
  const { data: stocks } = await sb.from('stocks').select('article_id,boutique_id,quantite')
    .in('boutique_id', (boutiques || []).map(b => b.id).concat(['00000000-0000-0000-0000-000000000000']));
  const artMap = Object.fromEntries((articles || []).map(a => [a.id, a]));
  const parBoutique = (boutiques || []).map(b => {
    const v = (mvts || []).filter(m => m.boutique_id === b.id);
    return { id: b.id, nom: b.nom, total: v.reduce((s, m) => s + Number(m.montant), 0), nb: v.reduce((s, m) => s + m.quantite, 0) };
  });
  const top = {};
  (mvts || []).forEach(m => { top[m.article_id] = (top[m.article_id] || 0) + m.quantite; });
  const meilleurs = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([id, q]) => ({ nom: artMap[id]?.nom || '?', quantite: q }));
  const bIds = new Set((boutiques || []).map(b => b.id));
  const bas = (stocks || []).filter(s => artMap[s.article_id] && bIds.has(s.boutique_id) && s.quantite <= artMap[s.article_id].seuil_alerte)
    .map(s => ({ article: artMap[s.article_id].nom, boutique: boutiques.find(b => b.id === s.boutique_id)?.nom, quantite: s.quantite }));
  const total = parBoutique.reduce((s, b) => s + b.total, 0);
  return { periode, total, parBoutique, meilleurs, bas };
}

export function texteRapport(entreprise, r) {
  const dv = entreprise.devise || '$';
  const f = n => Math.round(n * 100) / 100 + ' ' + dv;
  let t = `📊 *Compte rendu ${r.periode === 'semaine' ? 'de la semaine' : 'du jour'} – ${entreprise.nom}*\n\n`;
  t += `💰 Ventes totales : *${f(r.total)}*\n\n`;
  r.parBoutique.forEach(b => { t += `🏬 ${b.nom} : ${f(b.total)} (${b.nb} article(s))\n`; });
  const best = [...r.parBoutique].sort((a, b) => b.total - a.total)[0];
  if (best && best.total > 0) t += `\n🏆 Meilleure boutique : ${best.nom}\n`;
  if (r.meilleurs.length) t += `\n🔥 Plus vendus : ${r.meilleurs.map(m => `${m.nom} (${m.quantite})`).join(', ')}\n`;
  t += r.bas.length ? `\n⚠️ *À commander :*\n${r.bas.map(b => `• ${b.article} – ${b.boutique} : il reste ${b.quantite}`).join('\n')}` : '\n✅ Aucune rupture';
  return t + '\n\n— My automation';
}

// ---------- Lien permanent avec n8n ----------
// Chaque événement important part vers le webhook n8n de My automation.
export async function notifierN8n(evenement, entreprise, donnees = {}) {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-myauto-key': process.env.N8N_KEY || '' },
      body: JSON.stringify({ evenement, date: new Date().toISOString(),
        entreprise: entreprise ? { code: entreprise.code, nom: entreprise.nom, whatsapp_patron: entreprise.whatsapp_patron } : null, ...donnees }),
      signal: AbortSignal.timeout(4000)
    });
  } catch { /* n8n injoignable : l'app continue de fonctionner */ }
}

export function abonnementValide(e) {
  if (!e || e.abonnement_actif === false) return false;
  if (!e.abonnement_fin) return true;
  const aujourdhui = new Date(Date.now() + 2 * 3600e3).toISOString().slice(0, 10);
  return e.abonnement_fin >= aujourdhui;
}
export const couleurOk = c => /^#[0-9a-fA-F]{6}$/.test(String(c || ''));
