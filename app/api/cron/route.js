import { NextResponse } from 'next/server';
import { db, construireRapport, texteRapport, envoyerWhatsApp, notifierN8n, abonnementValide } from '../../../lib/server';

export const dynamic = 'force-dynamic';

// Appelé chaque jour à 20h (heure de Lubumbashi) par Vercel Cron
export async function GET(req) {
  if (process.env.CRON_SECRET && req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const sb = db();
  const samedi = new Date(Date.now() + 2 * 3600e3).getUTCDay() === 6;
  const { data: entreprises } = await sb.from('entreprises').select('*');
  const auj = new Date(Date.now() + 2 * 3600e3).toISOString().slice(0, 10);
  let envoyes = 0;
  for (const e of entreprises || []) {
    // Suivi de l'abonnement envoyé chaque soir à n8n (relances de paiement)
    if (!abonnementValide(e)) { await notifierN8n('abonnement_expire', e, { fin: e.abonnement_fin }); continue; }
    if (e.abonnement_fin) {
      const jours = Math.round((new Date(e.abonnement_fin) - new Date(auj)) / 864e5);
      if (jours <= 5) await notifierN8n('abonnement_bientot', e, { fin: e.abonnement_fin, jours_restants: jours });
    }
    if (!e.whatsapp_patron || !(e.modules || []).includes('stock')) continue;
    const periodes = [];
    if (e.rapport === 'soir' || e.rapport === 'les_deux') periodes.push('jour');
    if ((e.rapport === 'semaine' || e.rapport === 'les_deux') && samedi) periodes.push('semaine');
    for (const p of periodes) {
      const r = await construireRapport(sb, e, p);
      await notifierN8n('rapport', e, { periode: p, rapport: r, texte: texteRapport(e, r) });
      const res = await envoyerWhatsApp(e.whatsapp_patron, texteRapport(e, r));
      if (res.ok) envoyes++;
    }
  }
  return NextResponse.json({ ok: true, envoyes });
}
