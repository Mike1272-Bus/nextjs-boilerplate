'use client';
import { useEffect, useState } from 'react';

const post = async (action, body) => {
  const r = await fetch('/api/' + action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.json().catch(() => ({ ok: false, erreur: 'Pas de connexion.' }));
};
const NOMS = { mpesa: 'M-Pesa', airtel: 'Airtel Money', orange: 'Orange Money', mtn: 'MTN MoMo', carte: 'Carte / lien de paiement' };
const COUL = { mpesa: '#e60000', airtel: '#ed1c24', orange: '#ff7900', mtn: '#ffcb05', carte: '#3b4fe4' };
const dateFr = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

export default function Payer({ params }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [op, setOp] = useState('');
  const [tx, setTx] = useState(''); const [tel, setTel] = useState('');
  const [envoi, setEnvoi] = useState('');
  const [copie, setCopie] = useState('');

  const charger = async () => {
    const j = await post('facture_lire', { id: params.id });
    if (!j.ok) return setErr(j.erreur || 'Facture introuvable.');
    setD(j); if (!op) setOp(j.moyens[0]?.id || (j.carte ? 'carte' : ''));
  };
  useEffect(() => { charger(); }, []); // eslint-disable-line

  const copier = async t => { try { await navigator.clipboard.writeText(t); setCopie(t); setTimeout(() => setCopie(''), 1500); } catch {} };
  const declarer = async () => {
    setEnvoi('…');
    const j = await post('facture_declarer', { id: params.id, operateur: op, transaction: tx, telephone: tel });
    if (!j.ok) return setEnvoi('❌ ' + j.erreur);
    setEnvoi(''); charger();
  };

  const entete = <div className="haut"><div className="marque"><div className="logo img"><img src="/logo.png" alt="" /></div>My automation</div>
    <h1>{d ? (d.facture.statut === 'payee' ? 'Reçu de paiement' : 'Facture') : 'Paiement'}</h1>
    {d && <p>{d.facture.numero} · {d.client}</p>}</div>;

  if (err) return <div className="login">{entete}<div className="corps"><div className="card"><p style={{ fontWeight: 700 }}>{err}</p><p style={{ marginTop: 8 }}>Contactez My automation : 083 17 10 181</p></div></div></div>;
  if (!d) return <div className="login">{entete}<div className="corps"><div className="card"><p>Chargement…</p></div></div></div>;

  const f = d.facture;
  const moyen = d.moyens.find(m => m.id === op);
  const ligne = (a, b, gras) => <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid #e1e8f3', fontWeight: gras ? 800 : 500 }}><span>{a}</span><span style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{b}</span></div>;

  return (
    <div className="login">{entete}
      <div className="corps" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card">
          {f.statut === 'payee' && <p style={{ fontWeight: 800, color: '#16a34a', marginBottom: 8 }}>✅ Payée le {dateFr(f.payee_le)}. Merci !</p>}
          {f.statut === 'declaree' && <p style={{ fontWeight: 800, color: '#b45309', marginBottom: 8 }}>⏳ Paiement signalé. My automation vérifie et vous confirme très vite.</p>}
          {ligne('Client', d.client)}
          {ligne('Date', dateFr(f.created_at))}
          {ligne(f.libelle, `${Number(f.montant)} $`)}
          {ligne('Total', `${Number(f.montant)} $`, true)}
          {ligne('Référence', f.reference)}
        </div>

        {f.statut === 'en_attente' && <>
          <div className="card">
            <h2 style={{ marginBottom: 10 }}>Choisissez comment payer</h2>
            <div className="chips">{d.moyens.map(m => <button type="button" key={m.id} className={op === m.id ? 'on' : ''} onClick={() => setOp(m.id)}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 5, background: COUL[m.id], marginRight: 6 }} />{NOMS[m.id]}</button>)}
              {d.carte && <button type="button" className={op === 'carte' ? 'on' : ''} onClick={() => setOp('carte')}>💳 {NOMS.carte}</button>}</div>

            {moyen && <div style={{ marginTop: 14 }}>
              <p>1. Envoyez <b>{Number(f.montant)} $</b> par {NOMS[moyen.id]} au :</p>
              <button type="button" className="btn sec" style={{ marginTop: 8, fontSize: 22, letterSpacing: '.04em' }} onClick={() => copier(moyen.numero)}>{moyen.numero} {copie === moyen.numero ? '✓ copié' : '📋'}</button>
              <p style={{ marginTop: 6 }}>Nom affiché : <b>{d.beneficiaire}</b></p>
              <p style={{ marginTop: 10 }}>2. Dans le message du transfert, indiquez la référence :</p>
              <button type="button" className="btn sec" style={{ marginTop: 8 }} onClick={() => copier(f.reference)}>{f.reference} {copie === f.reference ? '✓ copié' : '📋'}</button>
            </div>}
            {op === 'carte' && d.carte && <a className="btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 14 }} href={d.carte} target="_blank" rel="noreferrer">Payer {Number(f.montant)} $ en ligne →</a>}
          </div>

          <div className="card">
            <h2 style={{ marginBottom: 6 }}>3. Vous avez payé ?</h2>
            <label>Numéro qui a payé</label><input value={tel} onChange={e => setTel(e.target.value)} inputMode="tel" placeholder="ex : 0812345678" />
            <label>Code de la transaction (dans le SMS reçu)</label><input value={tx} onChange={e => setTx(e.target.value)} placeholder="facultatif" />
            <div style={{ height: 12 }} /><button type="button" className="btn vert" onClick={declarer} disabled={!op}>✅ J'ai payé</button>
            {envoi && <p style={{ marginTop: 10, fontWeight: 700 }}>{envoi}</p>}
          </div>
        </>}
        <p style={{ textAlign: 'center', fontSize: 13, opacity: .7 }}>My automation · Lubumbashi · 083 17 10 181</p>
      </div>
    </div>
  );
}
