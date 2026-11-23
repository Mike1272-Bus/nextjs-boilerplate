'use client';
import { useState } from 'react';

const post = async (action, body) => {
  const r = await fetch('/api/' + action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.json().catch(() => ({ ok: false, erreur: 'Pas de connexion. Réessayez.' }));
};
export default function Inscription() {
  const [f, setF] = useState({ entreprise: '', responsable: '', whatsapp: '', activite: '', ville: 'Lubumbashi', rapport: 'soir', modules: ['stock', 'arrivage'],
    consentement_clientes: false, accord_whatsapp: false, site: '' });
  const [msg, setMsg] = useState(''); const [fini, setFini] = useState(false); const [envoi, setEnvoi] = useState(false);
  const set = k => e => setF({ ...f, [k]: e.target.value });

  const envoyer = async e => {
    e.preventDefault(); setMsg(''); setEnvoi(true);
    const j = await post('inscription_envoyer', f);
    setEnvoi(false);
    if (!j.ok) { setMsg('❌ ' + j.erreur); return; }
    setFini(true); window.scrollTo(0, 0);
  };

  const haut = <div className="haut"><div className="marque"><div className="logo img"><img src="/logo.png" alt="" /></div>My automation</div>
    <h1>{fini ? 'Merci ! 🎉' : 'Installer mon application'}</h1>
    <p>{fini ? 'Vos informations sont bien arrivées.' : '3 informations, 30 secondes. On prépare votre application tout de suite.'}</p></div>;

  if (fini) return <div className="login">{haut}<div className="corps"><div className="card">
    <p style={{ fontWeight: 700 }}>✅ C'est noté, {f.responsable} !</p>
    <p style={{ marginTop: 8 }}>My automation prépare votre application et vous écrit sur WhatsApp ({f.whatsapp}) dans quelques minutes.</p>
    <a className="btn vert" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 14 }}
      href={`https://wa.me/243831710181?text=${encodeURIComponent(`Bonjour Mike 👋\n\nJ'ai rempli le formulaire My automation ✅\n\n🏢 ${f.entreprise}\n👤 ${f.responsable}\n\nJ'attends mon application 🙏`)}`}>📲 Prévenir Mike sur WhatsApp</a>
    <p style={{ marginTop: 10, opacity: .75 }}>Appuyez sur le bouton vert : votre demande sera traitée encore plus vite.</p>
    <p style={{ marginTop: 8 }}>Une question ? 083 17 10 181</p></div></div></div>;

  return (
    <div className="login">{haut}
      <form className="corps" style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onSubmit={envoyer}>
        <input value={f.site} onChange={set('site')} tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: -9999, opacity: 0 }} aria-hidden="true" />

        <div className="card">
          <label>Nom de votre entreprise *</label><input value={f.entreprise} onChange={set('entreprise')} placeholder="ex : Boutique Kapenda" required />
          <label>Votre nom *</label><input value={f.responsable} onChange={set('responsable')} required />
          <label>Votre numéro WhatsApp *</label><input value={f.whatsapp} onChange={set('whatsapp')} inputMode="tel" placeholder="ex : 0812345678" required />
          <p style={{ marginTop: 6, opacity: .75 }}>C'est ici que vous recevrez votre accès, le rapport de vos ventes et les alertes de stock.</p>
        </div>

        <div className="card">
          <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontWeight: 600 }}>
            <input type="checkbox" checked={f.accord_whatsapp} onChange={e => setF({ ...f, accord_whatsapp: e.target.checked })} style={{ width: 22, height: 22, flex: 'none' }} />
            J'accepte de recevoir mes rapports, alertes et factures My automation sur WhatsApp.</label>
          <div style={{ height: 14 }} />
          <button className="btn" disabled={envoi}>{envoi ? 'Envoi…' : 'Recevoir mon application'}</button>
          {msg && <p style={{ marginTop: 12, fontWeight: 700 }}>{msg}</p>}
        </div>
        <p style={{ textAlign: 'center', fontSize: 13, opacity: .7 }}>My automation · Lubumbashi · 083 17 10 181</p>
      </form>
    </div>
  );
}
