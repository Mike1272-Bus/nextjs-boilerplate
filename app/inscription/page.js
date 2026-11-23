'use client';
import { useState } from 'react';

const post = async (action, body) => {
  const r = await fetch('/api/' + action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.json().catch(() => ({ ok: false, erreur: 'Pas de connexion. Réessayez.' }));
};
const Plus = ({ onClick, children }) => <button type="button" className="btn sec petit" style={{ marginTop: 10 }} onClick={onClick}>＋ {children}</button>;
const Moins = ({ onClick }) => <button type="button" aria-label="Retirer" onClick={onClick} style={{ border: 0, background: 'transparent', fontSize: 20, padding: '0 4px', color: '#dc2626' }}>✕</button>;
const Etape = ({ n, titre, aide, children }) => (
  <div className="card"><h2 style={{ marginBottom: 4 }}>{n}. {titre}</h2>{aide && <p style={{ opacity: .75, marginBottom: 4 }}>{aide}</p>}{children}</div>
);

export default function Inscription() {
  const [f, setF] = useState({ entreprise: '', responsable: '', whatsapp: '', activite: '', ville: 'Lubumbashi', rapport: 'soir', modules: ['stock', 'arrivage'],
    consentement_clientes: false, accord_whatsapp: false, site: '' });
  const [boutiques, setBoutiques] = useState(['']);
  const [vendeurs, setVendeurs] = useState([]);
  const [articles, setArticles] = useState([{ nom: '', prix: '', quantite: '' }]);
  const [clientes, setClientes] = useState([]);
  const [msg, setMsg] = useState(''); const [fini, setFini] = useState(false); const [envoi, setEnvoi] = useState(false);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const tog = x => setF({ ...f, modules: f.modules.includes(x) ? f.modules.filter(y => y !== x) : [...f.modules, x] });
  const maj = (arr, setArr, i, k) => e => setArr(arr.map((x, j) => j === i ? (k ? { ...x, [k]: e.target.value } : e.target.value) : x));
  const nomsBoutiques = boutiques.map(b => b.trim()).filter(Boolean);

  const envoyer = async e => {
    e.preventDefault(); setMsg(''); setEnvoi(true);
    const j = await post('inscription_envoyer', { ...f, boutiques: nomsBoutiques, vendeurs, articles, clientes });
    setEnvoi(false);
    if (!j.ok) { setMsg('❌ ' + j.erreur); return; }
    setFini(true); window.scrollTo(0, 0);
  };

  const haut = <div className="haut"><div className="marque"><div className="logo img"><img src="/logo.png" alt="" /></div>My automation</div>
    <h1>{fini ? 'Merci ! 🎉' : 'Installer mon application'}</h1>
    <p>{fini ? 'Vos informations sont bien arrivées.' : 'Remplissez ce formulaire (5 minutes). On prépare votre application avec vos boutiques, vos articles et vos clientes.'}</p></div>;

  if (fini) return <div className="login">{haut}<div className="corps"><div className="card">
    <p style={{ fontWeight: 700 }}>✅ C'est noté, {f.responsable} !</p>
    <p style={{ marginTop: 8 }}>My automation prépare votre application et vous envoie votre facture d'installation sur WhatsApp ({f.whatsapp}).</p>
    <p style={{ marginTop: 8 }}>Une question ? 083 17 10 181</p></div></div></div>;

  return (
    <div className="login">{haut}
      <form className="corps" style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onSubmit={envoyer}>
        <input value={f.site} onChange={set('site')} tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: -9999, opacity: 0 }} aria-hidden="true" />

        <Etape n={1} titre="Votre entreprise">
          <label>Nom de l'entreprise *</label><input value={f.entreprise} onChange={set('entreprise')} required />
          <label>Ce que vous vendez</label><input value={f.activite} onChange={set('activite')} placeholder="ex : vêtements, cosmétiques, pièces auto…" />
          <label>Ville</label><input value={f.ville} onChange={set('ville')} />
        </Etape>

        <Etape n={2} titre="Vous (le responsable)">
          <label>Votre nom *</label><input value={f.responsable} onChange={set('responsable')} required />
          <label>Votre numéro WhatsApp *</label><input value={f.whatsapp} onChange={set('whatsapp')} inputMode="tel" placeholder="ex : 0812345678" required />
          <p style={{ marginTop: 6, opacity: .75 }}>C'est ici que vous recevrez le rapport de vos ventes chaque soir et les alertes de stock.</p>
        </Etape>

        <Etape n={3} titre="Vos boutiques" aide="Une ligne par boutique (ou dépôt).">
          {boutiques.map((b, i) => <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8 }}>
            <input value={b} onChange={maj(boutiques, setBoutiques, i)} placeholder={`Boutique ${i + 1} (ex : Marché Mzee)`} />
            {boutiques.length > 1 && <Moins onClick={() => setBoutiques(boutiques.filter((_, j) => j !== i))} />}</div>)}
          <Plus onClick={() => setBoutiques([...boutiques, ''])}>Ajouter une boutique</Plus>
        </Etape>

        <Etape n={4} titre="Vos vendeurs" aide="Chaque vendeur aura son propre code pour enregistrer les ventes. Laissez vide si vous êtes seul.">
          {vendeurs.map((v, i) => <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8 }}>
            <input value={v.nom} onChange={maj(vendeurs, setVendeurs, i, 'nom')} placeholder="Nom du vendeur" />
            {nomsBoutiques.length > 1 && <select value={v.boutique} onChange={maj(vendeurs, setVendeurs, i, 'boutique')} style={{ maxWidth: 140 }}>
              <option value="">Boutique…</option>{nomsBoutiques.map(n => <option key={n}>{n}</option>)}</select>}
            <Moins onClick={() => setVendeurs(vendeurs.filter((_, j) => j !== i))} /></div>)}
          <Plus onClick={() => setVendeurs([...vendeurs, { nom: '', boutique: '' }])}>Ajouter un vendeur</Plus>
        </Etape>

        <Etape n={5} titre="Vos articles" aide="Nom, prix de vente en $ et quantité en stock aujourd'hui. Vous pourrez en ajouter d'autres dans l'app.">
          {articles.map((a, i) => <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8 }}>
            <input value={a.nom} onChange={maj(articles, setArticles, i, 'nom')} placeholder="Article" style={{ flex: 2 }} />
            <input value={a.prix} onChange={maj(articles, setArticles, i, 'prix')} placeholder="Prix $" inputMode="decimal" style={{ flex: 1, minWidth: 0 }} />
            <input value={a.quantite} onChange={maj(articles, setArticles, i, 'quantite')} placeholder="Qté" inputMode="numeric" style={{ flex: 1, minWidth: 0 }} />
            {articles.length > 1 && <Moins onClick={() => setArticles(articles.filter((_, j) => j !== i))} />}</div>)}
          <Plus onClick={() => setArticles([...articles, { nom: '', prix: '', quantite: '' }])}>Ajouter un article</Plus>
          <p style={{ marginTop: 8, opacity: .75 }}>Beaucoup d'articles ? Envoyez simplement une photo de votre cahier au 083 17 10 181, on s'en occupe.</p>
        </Etape>

        <Etape n={6} titre="Ce que vous voulez">
          <div className="chips" style={{ marginTop: 6 }}>{[['stock', '📦 Gérer mon stock et mes ventes'], ['arrivage', '📣 Annoncer mes nouveaux arrivages']].map(([k, l]) =>
            <button type="button" key={k} className={f.modules.includes(k) ? 'on' : ''} onClick={() => tog(k)}>{l}</button>)}</div>
          <label>Rapport de vos ventes sur WhatsApp</label>
          <div className="chips">{[['soir', 'Chaque soir'], ['semaine', 'Chaque semaine'], ['les_deux', 'Les deux']].map(([k, l]) =>
            <button type="button" key={k} className={f.rapport === k ? 'on' : ''} onClick={() => setF({ ...f, rapport: k })}>{l}</button>)}</div>
        </Etape>

        {f.modules.includes('arrivage') && <Etape n={7} titre="Vos clientes (facultatif)" aide="Pour leur annoncer vos nouveaux arrivages sur WhatsApp.">
          {clientes.map((c, i) => <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8 }}>
            <input value={c.nom} onChange={maj(clientes, setClientes, i, 'nom')} placeholder="Nom" />
            <input value={c.telephone} onChange={maj(clientes, setClientes, i, 'telephone')} placeholder="WhatsApp" inputMode="tel" />
            <Moins onClick={() => setClientes(clientes.filter((_, j) => j !== i))} /></div>)}
          <Plus onClick={() => setClientes([...clientes, { nom: '', telephone: '' }])}>Ajouter une cliente</Plus>
          {clientes.length > 0 && <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 12, fontWeight: 600 }}>
            <input type="checkbox" checked={f.consentement_clientes} onChange={e => setF({ ...f, consentement_clientes: e.target.checked })} style={{ width: 22, height: 22, flex: 'none' }} />
            Ces clientes ont accepté de recevoir mes messages sur WhatsApp.</label>}
        </Etape>}

        <div className="card">
          <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontWeight: 600 }}>
            <input type="checkbox" checked={f.accord_whatsapp} onChange={e => setF({ ...f, accord_whatsapp: e.target.checked })} style={{ width: 22, height: 22, flex: 'none' }} />
            J'accepte de recevoir mes rapports, alertes et factures My automation sur WhatsApp.</label>
          <div style={{ height: 14 }} />
          <button className="btn" disabled={envoi}>{envoi ? 'Envoi…' : 'Envoyer mes informations'}</button>
          {msg && <p style={{ marginTop: 12, fontWeight: 700 }}>{msg}</p>}
        </div>
        <p style={{ textAlign: 'center', fontSize: 13, opacity: .7 }}>My automation · Lubumbashi · 083 17 10 181</p>
      </form>
    </div>
  );
}
