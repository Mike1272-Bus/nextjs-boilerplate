'use client';
import { useEffect, useState, useCallback } from 'react';
import { api, money, RAYONS, appliquerCouleurs, Bar, useArticles, ChoixBoutique, boutiqueDefaut } from './base';
import { Feuille } from './anim';
import { Icone } from './icones';
function Articles({ me, notif, retour }) {
  const [articles, load] = useArticles(notif);
  const [f, setF] = useState(null);
  const vide = { nom: '', categorie: '', unite: 'pièce', prix_vente: '', prix_achat: '', seuil_alerte: 5 };
  const cats = [...new Set((articles || []).map(a => a.categorie).filter(Boolean))];
  const save = async () => { try { await api('article_save', f); notif(f.id ? '✅ Article modifié' : '✅ Article ajouté'); setF(null); load(); } catch (e) { notif(e.message, 1); } };
  const del = async () => { if (!confirm('Retirer cet article de la liste ?')) return; try { await api('article_delete', { id: f.id }); notif('Article retiré'); setF(null); load(); } catch (e) { notif(e.message, 1); } };
  return (<>
    <Bar titre="Mes articles" retour={retour} droite={<button onClick={() => setF(vide)} aria-label="Ajouter"><Icone n="plus" t={20} /></button>} />
    <div className="page">
      <p className="muted">Ajoutez, modifiez ou retirez vos articles à tout moment. Ils apparaissent tout de suite chez vos vendeurs.</p>
      <div className="card list">
        {(articles || []).map(a => (
          <button key={a.id} className="item" onClick={() => setF({ ...a, prix_achat: a.prix_achat ?? '' })}>
            <div className="t"><b>{a.nom}</b><small>{a.categorie ? a.categorie + ' · ' : ''}{money(a.prix_vente, me.entreprise.devise)} / {a.unite} · alerte à {a.seuil_alerte}</small></div><Icone n="retour" t={18} style={{ transform: 'rotate(180deg)', color: 'var(--gris)', flex: 'none' }} />
          </button>))}
        {articles && !articles.length && <p className="empty">Aucun article. Touchez « + Ajouter » pour créer votre premier article.</p>}
      </div>
      <button className="btn" onClick={() => setF(vide)}>+ Ajouter un article</button>
    </div>
    <Feuille onClose={() => setF(null)}>{f && <>
      <h2>{f.id ? 'Modifier l\'article' : 'Nouvel article'}</h2>
      <label>Nom de l'article</label><input value={f.nom} onChange={e => setF({ ...f, nom: e.target.value })} placeholder="ex : Huile 1 L" />
      <label>Catégorie (facultatif)</label><input value={f.categorie || ''} onChange={e => setF({ ...f, categorie: e.target.value })} list="cats" placeholder="ex : Alimentation, Robes…" /><datalist id="cats">{cats.map(c => <option key={c} value={c} />)}</datalist>
      <div className="row"><div><label>Prix de vente</label><input value={f.prix_vente} inputMode="decimal" onChange={e => setF({ ...f, prix_vente: e.target.value })} placeholder="0" /></div>
        <div><label>Unité</label><input value={f.unite} onChange={e => setF({ ...f, unite: e.target.value })} list="unites" /><datalist id="unites">{['pièce', 'carton', 'sac', 'kg', 'litre', 'boîte', 'paire'].map(u => <option key={u} value={u} />)}</datalist></div></div>
      <div className="row"><div><label>Prix d'achat (facultatif)</label><input value={f.prix_achat} inputMode="decimal" onChange={e => setF({ ...f, prix_achat: e.target.value })} /></div>
        <div><label>Alerte quand il reste</label><input value={f.seuil_alerte} inputMode="numeric" onChange={e => setF({ ...f, seuil_alerte: e.target.value })} /></div></div>
      <div style={{ height: 16 }} /><button className="btn" onClick={save}>Enregistrer</button>
      {f.id && <><div style={{ height: 10 }} /><button className="btn rouge" onClick={del}>Retirer l'article</button></>}
    </>}</Feuille>
  </>);
}

function Rapport({ me, notif, retour }) {
  const [periode, setPeriode] = useState('jour'); const [r, setR] = useState(null);
  const d = me.entreprise.devise;
  useEffect(() => { setR(null); api('rapport', { periode }).then(j => setR(j.rapport)).catch(e => notif(e.message, 1)); }, [periode, notif]);
  const envoyer = async () => { try { const j = await api('rapport_envoyer', { periode }); notif(j.envoye ? '✅ Compte rendu envoyé sur WhatsApp' : 'WhatsApp n\'est pas encore activé : utilisez « PDF ».', !j.envoye); } catch (e) { notif(e.message, 1); } };
  const best = r && [...r.parBoutique].sort((a, b) => b.total - a.total)[0];
  return (<>
    <Bar titre="Compte rendu" retour={retour} />
    <div className="page">
      <div className="tabs noprint"><button className={periode === 'jour' ? 'on' : ''} onClick={() => setPeriode('jour')}>Aujourd'hui</button><button className={periode === 'semaine' ? 'on' : ''} onClick={() => setPeriode('semaine')}>7 derniers jours</button></div>
      {!r ? <p className="empty">Chargement…</p> : <>
        <div className="card"><p className="muted">{me.entreprise.nom} · ventes {periode === 'jour' ? 'du jour' : 'des 7 derniers jours'}</p><p className="big">{money(r.total, d)}</p>{best && best.total > 0 && <p className="muted">Meilleure boutique : <b>{best.nom}</b></p>}</div>
        <div className="card"><h2>Par boutique</h2><div className="list">{r.parBoutique.map(b => <div key={b.id} className="item"><div className="t"><b>{b.nom}</b><small>{b.nb} article(s) vendu(s)</small><span className="jauge"><i style={{ width: `${r.total ? Math.max(3, b.total / Math.max(...r.parBoutique.map(x => x.total)) * 100) : 3}%` }} /></span></div><div className="qte">{money(b.total, d)}</div></div>)}</div></div>
        {r.meilleurs.length > 0 && <div className="card"><h2>Les plus vendus</h2><div className="list">{r.meilleurs.map(m => <div key={m.nom} className="item"><div className="t"><b>{m.nom}</b></div><div className="qte">{m.quantite}</div></div>)}</div></div>}
        <div className="card"><h2>À commander</h2>{r.bas.length ? <div className="list">{r.bas.map((b, i) => <div key={i} className="item"><div className="t"><b>{b.article}</b><small>{b.boutique}</small></div><div className="qte bas">{b.quantite}</div></div>)}</div> : <p className="muted">Aucune rupture 👍</p>}</div>
        <div className="row noprint"><button className="btn sec" onClick={() => window.print()}>Enregistrer en PDF</button><button className="btn" onClick={envoyer}>Envoyer sur WhatsApp</button></div>
      </>}
    </div>
  </>);
}

function Historique({ me, notif, retour }) {
  const [m, setM] = useState(null);
  useEffect(() => { api('historique').then(j => setM(j.mouvements)).catch(e => notif(e.message, 1)); }, [notif]);
  const nomB = id => me.boutiques.find(b => b.id === id)?.nom || '';
  const lib = { vente: 'Vente', reception: 'Réception', correction: 'Correction' };
  return (<>
    <Bar titre="Historique" retour={retour} />
    <div className="page"><div className="card list">
      {m === null ? <p className="empty">Chargement…</p> : !m.length ? <p className="empty">Aucune opération pour le moment.</p> : m.map(x => (
        <div key={x.id} className="item"><div className="t"><b>{lib[x.type]} · {x.articles?.nom}</b><small>{new Date(x.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })} · {nomB(x.boutique_id)} · {x.utilisateurs?.nom || ''}</small></div>
          <div className="qte">{x.type === 'vente' ? '−' : x.quantite > 0 ? '+' : ''}{x.type === 'vente' ? x.quantite : x.quantite}</div></div>))}
    </div></div>
  </>);
}

export { Articles, Rapport, Historique };
