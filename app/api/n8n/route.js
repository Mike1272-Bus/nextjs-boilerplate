import { NextResponse } from 'next/server';
import { db, couleurOk, abonnementValide } from '../../../lib/server';

export const dynamic = 'force-dynamic';

// Porte d'entrée réservée à n8n (My automation).
// En-tête obligatoire : x-n8n-key = N8N_KEY
// Actions :
//  { "action": "clients" }  → liste des entreprises + état de l'abonnement + ventes des 30 derniers jours
//  { "action": "abonnement", "code": "KAPA4", "actif": true, "fin": "2026-12-31" }  ou  "jours": 30 (prolonge à partir d'aujourd'hui ou de la fin actuelle)
//  { "action": "couleurs", "code": "KAPA4", "couleur": "#3b4fe4", "couleur2": "#5667e7" }
const ajouterJours = (base, n) => { const d = new Date(base + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

export async function POST(req) {
  if (!process.env.N8N_KEY || req.headers.get('x-n8n-key') !== process.env.N8N_KEY)
    return NextResponse.json({ ok: false, erreur: 'Clé n8n incorrecte.' }, { status: 403 });
  try {
    const sb = db();
    const b = await req.json().catch(() => ({}));
    const code = String(b.code || '').trim();

    if (b.action === 'clients') {
      const { data: ents } = await sb.from('entreprises').select('id,code,nom,whatsapp_patron,modules,abonnement_actif,abonnement_fin,created_at').order('created_at');
      const depuis = new Date(Date.now() - 30 * 864e5).toISOString();
      const res = [];
      for (const e of ents || []) {
        const { count } = await sb.from('mouvements').select('id', { count: 'exact', head: true }).eq('entreprise_id', e.id).eq('type', 'vente').gte('created_at', depuis);
        const { id, ...reste } = e;
        res.push({ ...reste, abonnement_valide: abonnementValide(e), ventes_30j: count || 0 });
      }
      return NextResponse.json({ ok: true, clients: res });
    }

    if (!code) return NextResponse.json({ ok: false, erreur: 'Code entreprise manquant.' }, { status: 400 });
    const { data: e } = await sb.from('entreprises').select('id,abonnement_fin').ilike('code', code).single();
    if (!e) return NextResponse.json({ ok: false, erreur: 'Code entreprise inconnu.' }, { status: 404 });

    const maj = {};
    if (b.action === 'abonnement') {
      if (typeof b.actif === 'boolean') maj.abonnement_actif = b.actif;
      if (/^\d{4}-\d{2}-\d{2}$/.test(b.fin || '')) maj.abonnement_fin = b.fin;
      else if (Number(b.jours) > 0) {
        const auj = new Date(Date.now() + 2 * 3600e3).toISOString().slice(0, 10);
        const base = e.abonnement_fin && e.abonnement_fin > auj ? e.abonnement_fin : auj;
        maj.abonnement_fin = ajouterJours(base, Math.round(Number(b.jours)));
        maj.abonnement_actif = true;
      }
    } else if (b.action === 'couleurs') {
      if (couleurOk(b.couleur)) maj.couleur = b.couleur;
      if (couleurOk(b.couleur2)) maj.couleur2 = b.couleur2;
    } else return NextResponse.json({ ok: false, erreur: 'Action inconnue.' }, { status: 400 });

    if (!Object.keys(maj).length) return NextResponse.json({ ok: false, erreur: 'Rien à modifier.' }, { status: 400 });
    const { data } = await sb.from('entreprises').update(maj).eq('id', e.id).select('code,nom,couleur,couleur2,abonnement_actif,abonnement_fin').single();
    return NextResponse.json({ ok: true, entreprise: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, erreur: err.message || 'Erreur' }, { status: err.status || 500 });
  }
}
