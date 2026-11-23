'use client';
import { useEffect, useState, useCallback } from 'react';
import { api, money, RAYONS, appliquerCouleurs, Bar, useArticles, ChoixBoutique, boutiqueDefaut } from './base';
import { Feuille, Compteur, Barres } from './anim';
import { Icone } from './icones';
function Login({ onOk }) {
  const [f, setF] = useState({ code: '', nom: '', pin: '' });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { try { const s = JSON.parse(localStorage.getItem('ma_login') || '{}'); setF(x => ({ ...x, code: s.code || '', nom: s.nom || '' })); } catch {} }, []);
  const go = async e => {
    e.preventDefault(); setBusy(true); setErr('');
    try { await api('login', f); try { localStorage.setItem('ma_login', JSON.stringify({ code: f.code, nom: f.nom })); } catch {} onOk(); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <form className="login" onSubmit={go}>
      <div className="head"><div className="logo img"><img src="/logo.png" alt="My automation" /></div><h1>My automation</h1><p className="muted">Votre stock, vos ventes et vos clients, depuis votre téléphone.</p></div>
      <div className="card">
        <label>Code de l'entreprise</label><input value={f.code} onChange={e => setF({ ...f, code: e.target.value })} placeholder="ex : KAPA4" autoCapitalize="characters" required />
        <label>Votre nom</label><input value={f.nom} onChange={e => setF({ ...f, nom: e.target.value })} placeholder="ex : Patrick" required />
        <label>Code PIN</label><input value={f.pin} onChange={e => setF({ ...f, pin: e.target.value })} inputMode="numeric" type="password" maxLength={6} placeholder="••••" required />
        {err && <p className="bas" style={{ marginTop: 10, fontWeight: 700 }}>{err}</p>}
        <div style={{ height: 14 }} /><button className="btn" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
      </div>
    </form>
  );
}

function Accueil({ me, ouvrir, onLogout, notif }) {
  const p = me.user.role === 'patron', m = me.entreprise.modules || [], d = me.entreprise.devise;
  const [t, setT] = useState(null);
  useEffect(() => { if (m.includes('stock')) api('tableau').then(setT).catch(e => notif(e.message, 1)); }, []);
  const fmt = useCallback(v => money(Math.round(v), d), [d]);
  const T = (id, ic, titre, s, main) => (
    <button key={id} className={'tile' + (main ? ' main' : '')} onClick={() => ouvrir(id)}>
      <span className="ic"><Icone n={ic} t={main ? 24 : 21} /></span>
      {main ? <span className="tx"><b>{titre}</b><small>{s}</small></span> : <><b>{titre}</b><small>{s}</small></>}
    </button>);
  const tiles = [];
  if (m.includes('stock')) {
    tiles.push(T('vente', 'vente', 'Enregistrer une vente', 'Le stock se met à jour tout seul', true), T('reception', 'reception', 'Réception', 'Marchandise reçue'), T('stock', 'stock', 'Stock', 'Quantités par boutique'));
    if (p) tiles.push(T('articles', 'articles', 'Mes articles', 'Ajouter ou modifier'), T('rapport', 'rapport', 'Compte rendu', 'Jour ou semaine'));
    tiles.push(T('historique', 'historique', 'Historique', 'Dernières opérations'));
  }
  if (m.includes('arrivage')) tiles.push(T('arrivage', 'arrivage', 'Nouvel arrivage', 'Prévenir mes clients', !m.includes('stock')), T('clients', 'clients', 'Mes clients', 'Liste WhatsApp'));
  if (p) tiles.push(T('parametres', 'parametres', 'Paramètres', 'Boutiques et équipe'));
  const bq = me.boutiques.find(b => b.id === me.user.boutique_id);
  const auj = t?.aujourdhui, hier = t?.hier;
  const evol = auj && hier && hier.total > 0 ? Math.round((auj.total - hier.total) / hier.total * 100) : null;
  return (<>
    <Bar titre={me.entreprise.nom} droite={<button onClick={onLogout} aria-label="Se déconnecter"><Icone n="sortir" t={20} /></button>} />
    <div className="page">
      <p className="salut">Bonjour <b>{me.user.nom}</b>{bq ? `, boutique ${bq.nom}` : p ? ', voici votre journée' : ''}</p>
      {m.includes('stock') && (t ? <>
        <section className="caisse" aria-label="Caisse du jour">
          <div className="lib">{bq ? 'Ventes de ma boutique aujourd\'hui' : 'Ventes de toutes les boutiques aujourd\'hui'}</div>
          <div className="total"><Compteur valeur={auj.total} format={fmt} /></div>
          <div className="sous">{auj.nb} article{auj.nb > 1 ? 's' : ''} vendu{auj.nb > 1 ? 's' : ''}{' '}
            {evol !== null && <span className="evol"><Icone n={evol >= 0 ? 'hausse' : 'baisse'} t={14} />{evol >= 0 ? '+' : ''}{evol} % par rapport à hier</span>}</div>
          <Barres serie={t.serie} aujourdhui={auj.date} />
        </section>
        <div className="kpis">
          <div className="kpi"><b>{money(Math.round(t.semaine), d)}</b><span>Ventes des 7 derniers jours</span></div>
          <button className={'kpi' + (t.stock_bas ? ' alerte' : '')} onClick={() => ouvrir('stock')}><b>{t.stock_bas}</b><span>{t.stock_bas ? "Articles à commander" : "Aucune rupture de stock"}</span></button>
        </div>
        {t.top && <p className="muted">Le plus vendu aujourd'hui : <b style={{ color: 'var(--encre)' }}>{t.top.nom}</b> ({t.top.quantite})</p>}
      </> : <div className="squelette" style={{ height: 214 }} aria-busy="true" />)}
      <div className="tiles">{tiles}</div>
    </div>
  </>);
}

function Mouvement({ me, notif, retour, type }) {
  const [articles, load] = useArticles(notif);
  const [bq, setBq] = useState(boutiqueDefaut(me));
  const [q, setQ] = useState(''); const [sel, setSel] = useState(null); const [n, setN] = useState(1); const [busy, setBusy] = useState(false);
  const vente = type === 'vente';
  const valider = async () => {
    setBusy(true);
    try {
      const r = await api('mouvement', { type, boutique_id: bq, article_id: sel.id, quantite: n });
      notif(vente ? `✅ Vente enregistrée${r.montant ? ' · ' + money(r.montant, me.entreprise.devise) : ''} · il reste ${r.stock_restant}${r.alerte ? ' · stock bas, pensez à commander' : ''}` : `✅ Réception enregistrée · stock : ${r.stock_restant}`);
      setSel(null); setN(1); setQ(''); load();
    } catch (e) { notif(e.message, 1); } finally { setBusy(false); }
  };
  const vis = (articles || []).filter(a => (a.nom + ' ' + (a.categorie || '')).toLowerCase().includes(q.toLowerCase()));
  return (<>
    <Bar titre={vente ? 'Nouvelle vente' : 'Réception de marchandise'} retour={retour} />
    <div className="page">
      <ChoixBoutique me={me} value={bq} onChange={setBq} />
      <input placeholder="Chercher un article" value={q} onChange={e => setQ(e.target.value)} />
      <div className="card list">
        {articles === null ? <p className="empty">Chargement…</p> : !vis.length ? <p className="empty">Aucun article. {me.user.role === 'patron' ? 'Ajoutez vos articles dans « Mes articles ».' : 'Demandez au responsable d\'ajouter les articles.'}</p> :
          vis.map(a => { const s = a.stock[bq] ?? 0; return (
            <button key={a.id} className="item" onClick={() => { setSel(a); setN(1); }}>
              <div className="t"><b>{a.nom}</b><small>{a.categorie ? a.categorie + ' · ' : ''}{money(a.prix_vente, me.entreprise.devise)} / {a.unite}</small></div>
              <div className={'qte' + (s <= a.seuil_alerte ? ' bas' : '')}>{s}</div>
            </button>); })}
      </div>
    </div>
    <Feuille onClose={() => setSel(null)}>{sel && <>
      <h2>{sel.nom}</h2><p className="muted">En stock : {sel.stock[bq] ?? 0} {sel.unite}{vente ? ' · ' + money(sel.prix_vente, me.entreprise.devise) + ' l\'unité' : ''}</p>
      <div className="stepper"><button onClick={() => setN(Math.max(1, n - 1))}>−</button><input value={n} inputMode="numeric" onChange={e => setN(Math.max(1, parseInt(e.target.value) || 1))} /><button onClick={() => setN(n + 1)}>+</button></div>
      {vente && <p className="big" style={{ textAlign: 'center', marginBottom: 12 }}>{money(n * sel.prix_vente, me.entreprise.devise)}</p>}
      <button className={'btn' + (vente ? '' : ' vert')} disabled={busy} onClick={valider}>{busy ? 'Enregistrement…' : vente ? 'Valider la vente' : 'Valider la réception'}</button>
    </>}</Feuille>
  </>);
}

function Stock({ me, notif, retour }) {
  const [articles, load] = useArticles(notif);
  const [bq, setBq] = useState(boutiqueDefaut(me)); const [edit, setEdit] = useState(null);
  const p = me.user.role === 'patron';
  const enreg = async () => { try { await api('inventaire', { boutique_id: bq, article_id: edit.a.id, quantite: edit.q }); notif('✅ Quantité corrigée'); setEdit(null); load(); } catch (e) { notif(e.message, 1); } };
  const bas = (articles || []).filter(a => (a.stock[bq] ?? 0) <= a.seuil_alerte).length;
  return (<>
    <Bar titre="Stock" retour={retour} />
    <div className="page">
      <ChoixBoutique me={me} value={bq} onChange={setBq} />
      {articles && <p className="muted">{articles.length} article(s) · {bas ? <span className="badge">{bas} à commander</span> : <span className="badge ok">aucune rupture</span>}{p && ' · touchez un article pour corriger la quantité'}</p>}
      <div className="card list">
        {(articles || []).map(a => { const s = a.stock[bq] ?? 0; return (
          <button key={a.id} className="item" onClick={() => p && setEdit({ a, q: s })}>
            <div className="t"><b>{a.nom}</b><small>Alerte à {a.seuil_alerte} {a.unite}</small></div>
            <div className={'qte' + (s <= a.seuil_alerte ? ' bas' : '')}>{s}</div>
          </button>); })}
        {articles && !articles.length && <p className="empty">Aucun article pour le moment.</p>}
      </div>
    </div>
    <Feuille onClose={() => setEdit(null)}>{edit && <>
      <h2>{edit.a.nom}</h2><p className="muted">Quantité réellement comptée dans cette boutique :</p>
      <div className="stepper"><button onClick={() => setEdit({ ...edit, q: Math.max(0, edit.q - 1) })}>−</button><input value={edit.q} inputMode="numeric" onChange={e => setEdit({ ...edit, q: Math.max(0, parseInt(e.target.value) || 0) })} /><button onClick={() => setEdit({ ...edit, q: edit.q + 1 })}>+</button></div>
      <button className="btn" onClick={enreg}>Enregistrer</button>
    </>}</Feuille>
  </>);
}

export { Login, Accueil, Mouvement, Stock };
