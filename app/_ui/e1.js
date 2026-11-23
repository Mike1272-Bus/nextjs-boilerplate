'use client';
import { useEffect, useState, useCallback } from 'react';
import { api, money, Bar, useArticles, ChoixBoutique, boutiqueDefaut, Cherche, Vide, unite } from './base';
import { Feuille, Compteur, Barres, m } from './anim';
import { Icone } from './icones';
import { Boutique, Caisse, Cartons, Annonce } from './illus';

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
    <div className="login">
      <div className="haut">
        <div className="marque"><div className="logo img"><img src="/logo.png" alt="" /></div>My automation</div>
        <Boutique />
        <h1>Votre boutique, dans votre poche</h1>
        <p>Ventes, stock et clients, à jour à chaque vente.</p>
      </div>
      <form onSubmit={go}>
        <div className="card">
          <label htmlFor="c">Code de l'entreprise</label><input id="c" value={f.code} onChange={e => setF({ ...f, code: e.target.value })} placeholder="ex : KAP05" autoCapitalize="characters" autoComplete="organization" required />
          <label htmlFor="n">Votre nom</label><input id="n" value={f.nom} onChange={e => setF({ ...f, nom: e.target.value })} placeholder="ex : Patrick" autoComplete="username" required />
          <label htmlFor="p">Code PIN</label><input id="p" value={f.pin} onChange={e => setF({ ...f, pin: e.target.value })} inputMode="numeric" type="password" maxLength={6} placeholder="4 à 6 chiffres" autoComplete="current-password" required />
          {err && <p className="erreur" role="alert"><Icone n="non" t={18} />{err}</p>}
          <div style={{ height: 16 }} /><button className="btn" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
        </div>
        <p className="aide">Pas encore de code ? Demandez-le à My automation.</p>
      </form>
    </div>
  );
}

function Raccourci({ ic, titre, s, onClick, ton }) {
  return <button className="raccourci" onClick={onClick}><span className={'pastille' + (ton ? ' ' + ton : '')}><Icone n={ic} t={21} /></span><span className="t"><b>{titre}</b><small>{s}</small></span><Icone n="chevron" t={18} className="chev" /></button>;
}

// Liste des écrans secondaires (accueil + onglet « Plus »)
function raccourcis(me) {
  const p = me.user.role === 'patron', md = me.entreprise.modules || [], r = [];
  if (md.includes('stock')) {
    r.push(['reception', 'reception', 'Réception', 'Ajouter la marchandise reçue', 'v']);
    if (p) r.push(['articles', 'articles', 'Mes articles', 'Ajouter, modifier les prix'], ['rapport', 'rapport', 'Compte rendu', 'Le jour ou la semaine, en PDF ou WhatsApp']);
    r.push(['historique', 'historique', 'Historique', 'Toutes les dernières opérations']);
  }
  if (md.includes('arrivage')) r.push(['clients', 'clients', 'Mes clients', 'Votre liste WhatsApp', 'v']);
  if (p) r.push(['parametres', 'parametres', 'Paramètres', 'Boutiques, équipe et rapport du soir']);
  return r;
}

function Accueil({ me, ouvrir, onLogout, notif }) {
  const p = me.user.role === 'patron', md = me.entreprise.modules || [], d = me.entreprise.devise;
  const [t, setT] = useState(null);
  useEffect(() => { if (md.includes('stock')) api('tableau').then(setT).catch(e => notif(e.message, 1)); }, []);
  const fmt = useCallback(v => money(Math.round(v), d), [d]);
  const bq = me.boutiques.find(b => b.id === me.user.boutique_id);
  const auj = t?.aujourdhui, hier = t?.hier;
  const evol = auj && hier && hier.total > 0 ? Math.round((auj.total - hier.total) / hier.total * 100) : null;
  const h = new Date().getHours(); const salut = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
  const ini = String(me.user.nom || '?').trim().split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase();
  return (<>
    <header className="bande">
      <div className="entete">
        <div className="avatar" aria-hidden="true">{ini}</div>
        <div className="qui"><small>{salut}, {me.user.nom}</small><b>{me.entreprise.nom}</b></div>
        <button className="rond" onClick={onLogout} aria-label="Se déconnecter"><Icone n="sortir" t={20} /></button>
      </div>
      {md.includes('stock') && (t ? (
        <section className="caisse" aria-label="Caisse du jour">
          <div className="haut"><span className="lib">{bq ? `Ventes du jour · ${bq.nom}` : 'Ventes du jour · toutes les boutiques'}</span>
            {evol !== null && <span className="evol"><Icone n={evol >= 0 ? 'hausse' : 'baisse'} t={13} />{evol >= 0 ? '+' : ''}{evol} % vs hier</span>}</div>
          <div className="total"><Compteur valeur={auj.total} format={fmt} /></div>
          <div className="sous-chiffres">
            <div className="sc"><span>Articles vendus</span><b>{auj.nb}</b></div>
            <div className="sc"><span>7 derniers jours</span><b>{money(Math.round(t.semaine), d)}</b></div>
            <button className={'sc' + (t.stock_bas ? ' alerte' : '')} onClick={() => ouvrir('stock')}><span>{t.stock_bas ? 'À commander' : 'Ruptures'}</span><b>{t.stock_bas || 'Aucune'}</b></button>
            <div className="sc"><span>Le plus vendu</span><b>{t.top ? `${t.top.nom} (${t.top.quantite})` : '—'}</b></div>
          </div>
        </section>
      ) : <div className="squelette" style={{ height: 230, opacity: .25 }} aria-busy="true" />)}
    </header>
    <div className="page">
      {md.includes('stock') && <button className="action-vente" onClick={() => ouvrir('vente')}>
        <span className="tx"><span className="plus"><Icone n="plus" t={20} /></span><b>Nouvelle vente</b><small>Le stock se met à jour tout seul</small></span>
        <Caisse className="ill" />
      </button>}
      {md.includes('arrivage') && <button className={'action-vente' + (md.includes('stock') ? ' arr' : '')} onClick={() => ouvrir('arrivage')}>
        <span className="tx"><span className="plus"><Icone n="arrivage" t={20} /></span><b>Nouvel arrivage</b><small>Prévenir vos clients sur WhatsApp</small></span>
        <Annonce className="ill" />
      </button>}
      {t && <section className="graph" aria-label="Ventes des 7 derniers jours">
        <div className="haut"><b>Cette semaine</b><span>{money(Math.round(t.semaine), d)}</span></div>
        <Barres serie={t.serie} aujourdhui={auj.date} />
      </section>}
      <div className="titre-section"><h2>Raccourcis</h2></div>
      <div className="liste">{raccourcis(me).map(([id, ic, ti, s, ton]) => <Raccourci key={id} ic={ic} titre={ti} s={s} ton={ton} onClick={() => ouvrir(id)} />)}</div>
    </div>
  </>);
}

function Mouvement({ me, notif, retour, type }) {
  const [articles, load] = useArticles(notif);
  const [bq, setBq] = useState(boutiqueDefaut(me));
  const [q, setQ] = useState(''); const [sel, setSel] = useState(null); const [n, setN] = useState(1); const [busy, setBusy] = useState(false);
  const vente = type === 'vente', d = me.entreprise.devise;
  const valider = async () => {
    setBusy(true);
    try {
      const r = await api('mouvement', { type, boutique_id: bq, article_id: sel.id, quantite: n });
      notif(vente ? `Vente enregistrée${r.montant ? ' · ' + money(r.montant, d) : ''} · il reste ${r.stock_restant}${r.alerte ? ' · stock bas' : ''}` : `Réception enregistrée · stock : ${r.stock_restant}`);
      setSel(null); setN(1); setQ(''); load();
    } catch (e) { notif(e.message, 1); } finally { setBusy(false); }
  };
  const vis = (articles || []).filter(a => (a.nom + ' ' + (a.categorie || '')).toLowerCase().includes(q.toLowerCase()));
  const st = sel ? (sel.stock[bq] ?? 0) : 0;
  return (<>
    <Bar titre={vente ? 'Nouvelle vente' : 'Réception'} retour={retour} />
    <div className="page">
      <ChoixBoutique me={me} value={bq} onChange={setBq} />
      <Cherche value={q} onChange={setQ} placeholder="Chercher un article" />
      {articles === null ? <div className="squelette" style={{ height: 260 }} aria-busy="true" /> : !vis.length ?
        <div className="card"><Vide Illus={Cartons} titre={q ? 'Aucun article trouvé' : 'Aucun article pour le moment'}>{q ? 'Essayez un autre mot.' : me.user.role === 'patron' ? 'Ajoutez vos articles dans « Mes articles ».' : 'Demandez au responsable d\'ajouter les articles.'}</Vide></div> :
        <div className="liste">{vis.map(a => { const s = a.stock[bq] ?? 0; return (
          <button key={a.id} className="item" onClick={() => { setSel(a); setN(1); }}>
            <span className="t"><b>{a.nom}</b><small>{a.categorie ? a.categorie + ' · ' : ''}{money(a.prix_vente, d)} / {a.unite}</small></span>
            <span className={'qte' + (s <= 0 ? ' zero' : s <= a.seuil_alerte ? ' bas' : '')} aria-label={`${s} en stock`}>{s}</span>
          </button>); })}</div>}
    </div>
    <Feuille onClose={() => setSel(null)}>{sel && <>
      <h2>{sel.nom}</h2>
      <p className="muted">En stock : <b className="num" style={{ color: 'var(--encre)' }}>{unite(st, sel.unite)}</b>{vente ? ' · ' + money(sel.prix_vente, d) + ' l\'unité' : ''}</p>
      <div className="stepper"><button onClick={() => setN(Math.max(1, n - 1))} aria-label="Moins">−</button><input value={n} inputMode="numeric" aria-label="Quantité" onChange={e => setN(Math.max(1, parseInt(e.target.value) || 1))} /><button onClick={() => setN(n + 1)} aria-label="Plus">+</button></div>
      {vente && <div className="total-vente"><span>Total à encaisser</span><b>{money(n * sel.prix_vente, d)}</b></div>}
      {vente && n > st && <p className="erreur" style={{ marginTop: 0, marginBottom: 12 }}><Icone n="non" t={18} />Il n'y a que {st} en stock dans cette boutique.</p>}
      <button className={'btn' + (vente ? '' : ' vert')} disabled={busy} onClick={valider}>{busy ? 'Enregistrement…' : vente ? 'Valider la vente' : 'Valider la réception'}</button>
    </>}</Feuille>
  </>);
}

function Stock({ me, notif, retour, ouvrir }) {
  const [articles, load] = useArticles(notif);
  const [bq, setBq] = useState(boutiqueDefaut(me)); const [edit, setEdit] = useState(null); const [q, setQ] = useState(''); const [filtre, setFiltre] = useState('tous');
  const p = me.user.role === 'patron', d = me.entreprise.devise;
  const enreg = async () => { try { await api('inventaire', { boutique_id: bq, article_id: edit.a.id, quantite: edit.q }); notif('Quantité corrigée'); setEdit(null); load(); } catch (e) { notif(e.message, 1); } };
  const etat = a => { const s = a.stock[bq] ?? 0; return s <= 0 ? 'zero' : s <= a.seuil_alerte ? 'bas' : 'ok'; };
  const nbBas = (articles || []).filter(a => etat(a) !== 'ok').length;
  const vis = (articles || []).filter(a => (filtre === 'tous' || etat(a) !== 'ok') && (a.nom + ' ' + (a.categorie || '')).toLowerCase().includes(q.toLowerCase()));
  return (<>
    <Bar titre="Stock" retour={retour} />
    <div className="page">
      <ChoixBoutique me={me} value={bq} onChange={setBq} />
      <Cherche value={q} onChange={setQ} placeholder="Chercher un article ou une catégorie" />
      {articles && <div className="tabs" role="tablist">
        <button role="tab" aria-selected={filtre === 'tous'} className={filtre === 'tous' ? 'on' : ''} onClick={() => setFiltre('tous')}>Tous ({articles.length})</button>
        <button role="tab" aria-selected={filtre === 'bas'} className={filtre === 'bas' ? 'on' : ''} onClick={() => setFiltre('bas')}>À commander ({nbBas})</button>
      </div>}
      {articles === null && <div className="squelette" style={{ height: 180 }} aria-busy="true" />}
      {articles && !vis.length && <div className="card"><Vide Illus={Cartons} titre={filtre === 'bas' ? 'Rien à commander' : 'Aucun article'}>{filtre === 'bas' ? 'Tous vos articles sont au-dessus du seuil d\'alerte.' : 'Ajoutez vos articles pour suivre le stock.'}</Vide></div>}
      {vis.map(a => { const s = a.stock[bq] ?? 0, e = etat(a), max = Math.max(s, a.seuil_alerte * 3, 1); return (
        <article key={a.id} className="fiche">
          <div className="l1"><span className="pastille"><Icone n="reception" t={20} /></span>
            <div className="t"><b>{a.nom}</b><small>{a.categorie || 'Sans catégorie'}</small></div>
            <span className={'badge ' + e}>{e === 'ok' ? 'En stock' : e === 'bas' ? 'Stock bas' : 'Rupture'}</span></div>
          <div className="prix">{money(a.prix_vente, d)} <small className="muted" style={{ fontWeight: 600 }}>/ {a.unite}</small></div>
          <div><div className="mesure"><span>Quantité</span><b>{unite(s, a.unite)}</b></div><span className={'jauge ' + e} style={{ marginTop: 7 }}><i style={{ width: `${Math.max(4, s / max * 100)}%` }} /></span>
            <div className="mesure" style={{ marginTop: 6 }}><span>Alerte à</span><b>{a.seuil_alerte}</b></div></div>
          <div className="row">
            <button className="btn petit" onClick={() => ouvrir('vente')}><Icone n="panier" t={18} />Vendre</button>
            {p && <button className="btn petit sec" onClick={() => setEdit({ a, q: s })}><Icone n="crayon" t={18} />Corriger</button>}
          </div>
        </article>); })}
    </div>
    <Feuille onClose={() => setEdit(null)}>{edit && <>
      <h2>{edit.a.nom}</h2><p className="muted">Quantité réellement comptée dans cette boutique :</p>
      <div className="stepper"><button onClick={() => setEdit({ ...edit, q: Math.max(0, edit.q - 1) })} aria-label="Moins">−</button><input value={edit.q} inputMode="numeric" aria-label="Quantité" onChange={e => setEdit({ ...edit, q: Math.max(0, parseInt(e.target.value) || 0) })} /><button onClick={() => setEdit({ ...edit, q: edit.q + 1 })} aria-label="Plus">+</button></div>
      <button className="btn" onClick={enreg}>Enregistrer</button>
    </>}</Feuille>
  </>);
}

export { Login, Accueil, Mouvement, Stock, Raccourci, raccourcis };
