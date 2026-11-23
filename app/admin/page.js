'use client';
import { useState } from 'react';

const post = async (action, body) => {
  const r = await fetch('/api/' + action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.json().catch(() => ({ ok: false, erreur: 'Pas de connexion.' }));
};
const PALETTE = ['#3b4fe4', '#5667e7', '#0f766e', '#16a34a', '#7c3aed', '#be185d', '#c2410c', '#b45309', '#111827', '#dc2626'];

function Couleurs({ c1, c2, onChange }) {
  return (
    <>
      <label>Couleur principale</label>
      <div className="chips">{PALETTE.map(c => <button type="button" key={c} onClick={() => onChange(c, c2)} style={{ background: c, width: 38, height: 38, padding: 0, borderColor: c1 === c ? '#000' : 'transparent' }} />)}
        <input type="color" value={c1} onChange={e => onChange(e.target.value, c2)} style={{ width: 54, height: 40, padding: 2 }} /></div>
      <label>Couleur secondaire (boutons)</label>
      <div className="chips">{PALETTE.map(c => <button type="button" key={c} onClick={() => onChange(c1, c)} style={{ background: c, width: 38, height: 38, padding: 0, borderColor: c2 === c ? '#000' : 'transparent' }} />)}
        <input type="color" value={c2} onChange={e => onChange(c1, e.target.value)} style={{ width: 54, height: 40, padding: 2 }} /></div>
      <div style={{ marginTop: 12, borderRadius: 14, overflow: 'hidden', border: '1px solid #e1e8f3' }}>
        <div style={{ background: c1, color: '#fff', padding: '12px 14px', fontWeight: 800 }}>Aperçu de l'app</div>
        <div style={{ padding: 12, background: '#f3f6fb' }}><div style={{ background: c2, color: '#fff', borderRadius: 12, padding: 12, textAlign: 'center', fontWeight: 800 }}>Enregistrer une vente</div></div>
      </div>
    </>
  );
}

export default function Admin() {
  const [cle, setCle] = useState('');
  const [f, setF] = useState({ code: '', nom: '', patron_nom: '', patron_pin: '', whatsapp: '', boutiques: 'Boutique 1', modules: ['stock', 'arrivage'], couleur: '#3b4fe4', couleur2: '#5667e7', abonnement_fin: '' });
  const [m, setM] = useState({ code: '', couleur: '#3b4fe4', couleur2: '#5667e7', abonnement_actif: true, abonnement_fin: '' });
  const [msg, setMsg] = useState(''); const [msg2, setMsg2] = useState('');
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const tog = x => setF({ ...f, modules: f.modules.includes(x) ? f.modules.filter(y => y !== x) : [...f.modules, x] });

  const creer = async e => {
    e.preventDefault(); setMsg('…');
    const j = await post('admin_creer', { ...f, admin_key: cle });
    setMsg(j.ok ? `✅ Entreprise créée. Code : ${j.code} · Responsable : ${f.patron_nom} · PIN : ${f.patron_pin}` : '❌ ' + j.erreur);
  };
  const charger = async () => {
    setMsg2('…');
    const j = await post('admin_lire', { code: m.code, admin_key: cle });
    if (!j.ok) return setMsg2('❌ ' + j.erreur);
    const e = j.entreprise;
    setM({ code: e.code, couleur: e.couleur, couleur2: e.couleur2, abonnement_actif: e.abonnement_actif, abonnement_fin: e.abonnement_fin || '' });
    setMsg2('Client chargé : ' + e.nom);
  };
  const modifier = async e => {
    e.preventDefault(); setMsg2('…');
    const j = await post('admin_modifier', { ...m, admin_key: cle });
    setMsg2(j.ok ? `✅ ${j.entreprise.nom} : abonnement ${j.entreprise.abonnement_actif ? 'actif' : 'suspendu'}${j.entreprise.abonnement_fin ? ' jusqu\'au ' + j.entreprise.abonnement_fin : ''}, couleurs enregistrées.` : '❌ ' + j.erreur);
  };

  return (
    <div className="login">
      <div className="head"><div className="logo img"><img src="/logo.png" alt="My automation" /></div><h1>Espace My automation</h1><p className="muted">Créer un client, choisir ses couleurs, gérer son abonnement.</p></div>
      <div className="card"><label>Clé administrateur</label><input type="password" value={cle} onChange={e => setCle(e.target.value)} required /></div>

      <form className="card" onSubmit={creer}>
        <h2 style={{ marginBottom: 6 }}>Nouveau client</h2>
        <label>Code de connexion (court, sans espace)</label><input value={f.code} onChange={set('code')} placeholder="ex : KAPA4" required />
        <label>Nom de l'entreprise</label><input value={f.nom} onChange={set('nom')} required />
        <label>Nom du responsable</label><input value={f.patron_nom} onChange={set('patron_nom')} required />
        <label>PIN du responsable (4 à 6 chiffres)</label><input value={f.patron_pin} onChange={set('patron_pin')} inputMode="numeric" maxLength={6} required />
        <label>WhatsApp du responsable</label><input value={f.whatsapp} onChange={set('whatsapp')} inputMode="tel" />
        <label>Boutiques (séparées par des virgules)</label><input value={f.boutiques} onChange={set('boutiques')} />
        <label>Modules</label><div className="chips">{[['stock', 'Gestion du stock'], ['arrivage', 'Nouvel arrivage']].map(([k, l]) => <button type="button" key={k} className={f.modules.includes(k) ? 'on' : ''} onClick={() => tog(k)}>{l}</button>)}</div>
        <label>Abonnement payé jusqu'au (vide = sans limite)</label><input type="date" value={f.abonnement_fin} onChange={set('abonnement_fin')} />
        <Couleurs c1={f.couleur} c2={f.couleur2} onChange={(a, b) => setF({ ...f, couleur: a, couleur2: b })} />
        <div style={{ height: 14 }} /><button className="btn">Créer l'entreprise</button>
        {msg && <p style={{ marginTop: 12, fontWeight: 700 }}>{msg}</p>}
      </form>

      <form className="card" onSubmit={modifier}>
        <h2 style={{ marginBottom: 6 }}>Modifier un client</h2>
        <label>Code de l'entreprise</label>
        <div style={{ display: 'flex', gap: 8 }}><input value={m.code} onChange={e => setM({ ...m, code: e.target.value })} required />
          <button type="button" className="btn sec" style={{ width: 120 }} onClick={charger}>Charger</button></div>
        <label>Abonnement</label>
        <div className="chips">{[[true, '✅ Actif'], [false, '⏸️ Suspendu']].map(([v, l]) => <button type="button" key={l} className={m.abonnement_actif === v ? 'on' : ''} onClick={() => setM({ ...m, abonnement_actif: v })}>{l}</button>)}</div>
        <label>Payé jusqu'au (vide = sans limite)</label><input type="date" value={m.abonnement_fin} onChange={e => setM({ ...m, abonnement_fin: e.target.value })} />
        <Couleurs c1={m.couleur} c2={m.couleur2} onChange={(a, b) => setM({ ...m, couleur: a, couleur2: b })} />
        <div style={{ height: 14 }} /><button className="btn">Enregistrer</button>
        {msg2 && <p style={{ marginTop: 12, fontWeight: 700 }}>{msg2}</p>}
      </form>
    </div>
  );
}
