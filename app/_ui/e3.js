'use client';
import { useEffect, useState, useCallback } from 'react';
import { api, money, RAYONS, appliquerCouleurs, Bar, useArticles, ChoixBoutique, boutiqueDefaut } from './base';
import { Feuille } from './anim';
import { Icone } from './icones';
function Clients({ me, notif, retour }) {
  const [list, setList] = useState(null); const [f, setF] = useState(null); const [q, setQ] = useState('');
  const [cats, setCats] = useState([]);
  const load = useCallback(() => api('clients').then(j => setList(j.clients)).catch(e => notif(e.message, 1)), [notif]);
  useEffect(() => { load(); api('articles').then(j => setCats([...new Set(j.articles.map(a => a.categorie).filter(Boolean))])).catch(() => {}); }, [load]);
  const toutesCats = [...new Set([...cats, ...(list || []).flatMap(c => c.preferences || [])])];
  const save = async () => { try { await api('client_save', f); notif('✅ Client enregistré'); setF(null); load(); } catch (e) { notif(e.message, 1); } };
  const del = async () => { if (!confirm('Supprimer ce client ?')) return; await api('client_delete', { id: f.id }); setF(null); load(); };
  const tog = c => setF({ ...f, preferences: f.preferences.includes(c) ? f.preferences.filter(x => x !== c) : [...f.preferences, c] });
  const vis = (list || []).filter(c => (c.nom + c.telephone).toLowerCase().includes(q.toLowerCase()));
  const vide = { nom: '', telephone: '', rayon: 'Tous', preferences: [], taille: '' };
  return (<>
    <Bar titre={`Mes clients${list ? ' (' + list.length + ')' : ''}`} retour={retour} droite={<button onClick={() => setF(vide)} aria-label="Ajouter"><Icone n="plus" t={20} /></button>} />
    <div className="page">
      <input placeholder="Chercher un client…" value={q} onChange={e => setQ(e.target.value)} />
      <div className="card list">
        {vis.map(c => <button key={c.id} className="item" onClick={() => setF({ ...c, taille: c.taille || '', rayon: c.rayon || 'Tous' })}><div className="t"><b>{c.nom}</b><small>+{c.telephone}{c.rayon && c.rayon !== 'Tous' ? ' · ' + c.rayon : ''}{c.preferences?.length ? ' · ' + c.preferences.join(', ') : ''}</small></div><Icone n="retour" t={18} style={{ transform: 'rotate(180deg)', color: 'var(--gris)', flex: 'none' }} /></button>)}
        {list && !list.length && <p className="empty">Aucun client. Enregistrez chaque client qui achète : il sera prévenu à chaque arrivage.</p>}
      </div>
    </div>
    <Feuille onClose={() => setF(null)}>{f && <>
      <h2>{f.id ? 'Modifier le client' : 'Nouveau client'}</h2>
      <label>Nom</label><input value={f.nom} onChange={e => setF({ ...f, nom: e.target.value })} placeholder="ex : Grace Mbuyi" />
      <label>WhatsApp</label><input value={f.telephone} inputMode="tel" onChange={e => setF({ ...f, telephone: e.target.value })} placeholder="ex : 0812345678" />
      <label>Rayon</label><div className="chips">{RAYONS.map(r => <button key={r} className={f.rayon === r ? 'on' : ''} onClick={() => setF({ ...f, rayon: r })}>{r}</button>)}</div>
      <label>Ce qui l'intéresse (vide = tout)</label><div className="chips">{toutesCats.map(c => <button key={c} className={f.preferences.includes(c) ? 'on' : ''} onClick={() => tog(c)}>{c}</button>)}</div>
      <input style={{ marginTop: 8 }} placeholder="Autre catégorie + Entrée" onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) { const v = e.target.value.trim(); e.target.value = ''; if (!f.preferences.includes(v)) setF({ ...f, preferences: [...f.preferences, v] }); } }} />
      <label>Taille (facultatif)</label><input value={f.taille} onChange={e => setF({ ...f, taille: e.target.value })} placeholder="ex : M, 40" />
      <div style={{ height: 16 }} /><button className="btn" onClick={save}>Enregistrer</button>
      {f.id && <><div style={{ height: 10 }} /><button className="btn rouge" onClick={del}>Supprimer</button></>}
    </>}</Feuille>
  </>);
}

function Arrivage({ me, notif, retour }) {
  const [f, setF] = useState({ rayon: 'Tous', categorie: 'Tout', message: '' });
  const [cats, setCats] = useState([]); const [ap, setAp] = useState(null); const [res, setRes] = useState(null); const [busy, setBusy] = useState(false);
  useEffect(() => { Promise.all([api('clients'), api('articles').catch(() => ({ articles: [] }))]).then(([c, a]) =>
    setCats([...new Set([...a.articles.map(x => x.categorie).filter(Boolean), ...c.clients.flatMap(x => x.preferences || [])])])).catch(() => {}); }, []);
  useEffect(() => { const t = setTimeout(() => api('annonce', { ...f, envoyer: false }).then(setAp).catch(() => {}), 300); return () => clearTimeout(t); }, [f]);
  const envoyer = async () => { setBusy(true); try { const j = await api('annonce', { ...f, envoyer: true }); setRes(j); if (j.auto) notif(`✅ Envoyé à ${j.envoyes} client(s)`); } catch (e) { notif(e.message, 1); } finally { setBusy(false); } };
  if (res && !res.auto) return (<>
    <Bar titre="Envoyer l'annonce" retour={() => setRes(null)} />
    <div className="page"><p className="muted">Touchez chaque client : WhatsApp s'ouvre avec le message prêt, il suffit d'appuyer sur Envoyer.</p>
      <div className="card list">{res.liens.map((l, i) => <a key={i} className="item" href={l.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}><div className="t"><b>{l.nom}</b></div><Icone n="whatsapp" t={20} style={{ color: 'var(--vert)', flex: 'none' }} /></a>)}</div>
      <button className="btn sec" onClick={retour}>Terminé</button></div>
  </>);
  return (<>
    <Bar titre="Nouvel arrivage" retour={retour} />
    <div className="page">
      <div className="card">
        <label>Pour quel rayon ?</label><div className="chips">{RAYONS.map(r => <button key={r} className={f.rayon === r ? 'on' : ''} onClick={() => setF({ ...f, rayon: r })}>{r}</button>)}</div>
        <label>Quel article ?</label><div className="chips">{['Tout', ...cats].map(c => <button key={c} className={f.categorie === c ? 'on' : ''} onClick={() => setF({ ...f, categorie: c })}>{c}</button>)}</div>
        <label>Votre message</label><textarea rows={4} value={f.message} onChange={e => setF({ ...f, message: e.target.value })} placeholder="ex : Nouvelles robes wax arrivées ce matin, tailles S à XL. Quantités limitées !" />
      </div>
      {ap && <div className="card"><h2>Aperçu · {ap.nb} client(s) concerné(s)</h2>{ap.apercu[0] ? <div className="wa">{ap.apercu[0].texte}</div> : <p className="muted">Aucun client ne correspond à ce rayon et cet article.</p>}</div>}
      <button className="btn" disabled={busy || !f.message.trim() || !ap?.nb} onClick={envoyer}>{busy ? 'Envoi…' : `Envoyer à ${ap?.nb || 0} client(s)`}</button>
    </div>
  </>);
}

function Parametres({ me, notif, retour, recharger }) {
  const [p, setP] = useState({ whatsapp_patron: me.entreprise.whatsapp_patron || '', rapport: me.entreprise.rapport || 'soir', devise: me.entreprise.devise || '$' });
  const [eq, setEq] = useState([]); const [u, setU] = useState(null); const [b, setB] = useState(null);
  const loadEq = useCallback(() => api('equipe').then(j => setEq(j.equipe)).catch(e => notif(e.message, 1)), [notif]);
  useEffect(() => { loadEq(); }, [loadEq]);
  const saveP = async () => { try { await api('parametres_save', p); notif('✅ Paramètres enregistrés'); recharger(); } catch (e) { notif(e.message, 1); } };
  const saveU = async () => { try { await api('utilisateur_save', u); notif('✅ Membre enregistré'); setU(null); loadEq(); } catch (e) { notif(e.message, 1); } };
  const delU = async () => { if (!confirm('Retirer ce membre ?')) return; try { await api('utilisateur_delete', { id: u.id }); setU(null); loadEq(); } catch (e) { notif(e.message, 1); } };
  const saveB = async () => { try { await api('boutique_save', b); notif('✅ Boutique enregistrée'); setB(null); recharger(); } catch (e) { notif(e.message, 1); } };
  const delB = async () => { if (!confirm('Retirer cette boutique ?')) return; await api('boutique_delete', { id: b.id }); setB(null); recharger(); };
  const nomB = id => me.boutiques.find(x => x.id === id)?.nom || 'Toutes les boutiques';
  return (<>
    <Bar titre="Paramètres" retour={retour} />
    <div className="page">
      <div className="card"><h2>Compte rendu et alertes</h2>
        <label>WhatsApp du responsable</label><input value={p.whatsapp_patron} inputMode="tel" onChange={e => setP({ ...p, whatsapp_patron: e.target.value })} placeholder="ex : 0812345678" />
        <label>Recevoir le compte rendu</label><div className="chips">{[['soir', 'Chaque soir'], ['semaine', 'Chaque semaine'], ['les_deux', 'Les deux']].map(([k, l]) => <button key={k} className={p.rapport === k ? 'on' : ''} onClick={() => setP({ ...p, rapport: k })}>{l}</button>)}</div>
        <label>Monnaie</label><div className="chips">{['$', 'FC'].map(d => <button key={d} className={p.devise === d ? 'on' : ''} onClick={() => setP({ ...p, devise: d })}>{d}</button>)}</div>
        {!me.whatsapp && <p className="muted" style={{ marginTop: 10 }}>L'envoi automatique sur WhatsApp sera activé par My automation.</p>}
        <div style={{ height: 12 }} /><button className="btn" onClick={saveP}>Enregistrer</button></div>
      <div className="card"><h2>Boutiques</h2><div className="list">{me.boutiques.map(x => <button key={x.id} className="item" onClick={() => setB(x)}><div className="t"><b>{x.nom}</b></div><Icone n="retour" t={18} style={{ transform: 'rotate(180deg)', color: 'var(--gris)', flex: 'none' }} /></button>)}</div>
        <div style={{ height: 8 }} /><button className="btn sec" onClick={() => setB({ nom: '' })}>+ Ajouter une boutique</button></div>
      <div className="card"><h2>Équipe</h2><div className="list">{eq.map(x => <button key={x.id} className="item" onClick={() => setU({ ...x, pin: '' })}><div className="t"><b>{x.nom}</b><small>{x.role === 'patron' ? 'Responsable' : 'Vendeur'} · {nomB(x.boutique_id)}</small></div><Icone n="retour" t={18} style={{ transform: 'rotate(180deg)', color: 'var(--gris)', flex: 'none' }} /></button>)}</div>
        <div style={{ height: 8 }} /><button className="btn sec" onClick={() => setU({ nom: '', role: 'vendeur', boutique_id: me.boutiques[0]?.id || '', pin: '' })}>+ Ajouter un vendeur</button></div>
    </div>
    <Feuille onClose={() => setU(null)}>{u && <>
      <h2>{u.id ? 'Modifier' : 'Nouveau membre'}</h2>
      <label>Nom (utilisé pour se connecter)</label><input value={u.nom} onChange={e => setU({ ...u, nom: e.target.value })} />
      <label>Rôle</label><div className="chips">{[['vendeur', 'Vendeur'], ['patron', 'Responsable']].map(([k, l]) => <button key={k} className={u.role === k ? 'on' : ''} onClick={() => setU({ ...u, role: k })}>{l}</button>)}</div>
      <label>Boutique</label><select value={u.boutique_id || ''} onChange={e => setU({ ...u, boutique_id: e.target.value })}><option value="">Toutes les boutiques</option>{me.boutiques.map(x => <option key={x.id} value={x.id}>{x.nom}</option>)}</select>
      <label>{u.id ? 'Nouveau code PIN (laisser vide pour garder l\'actuel)' : 'Code PIN (4 à 6 chiffres)'}</label><input value={u.pin} inputMode="numeric" maxLength={6} onChange={e => setU({ ...u, pin: e.target.value })} />
      <div style={{ height: 16 }} /><button className="btn" onClick={saveU}>Enregistrer</button>
      {u.id && u.id !== me.user.id && <><div style={{ height: 10 }} /><button className="btn rouge" onClick={delU}>Retirer</button></>}
    </>}</Feuille>
    <Feuille onClose={() => setB(null)}>{b && <>
      <h2>{b.id ? 'Modifier la boutique' : 'Nouvelle boutique'}</h2>
      <label>Nom ou quartier</label><input value={b.nom} onChange={e => setB({ ...b, nom: e.target.value })} placeholder="ex : Boutique Kenya" />
      <div style={{ height: 16 }} /><button className="btn" onClick={saveB}>Enregistrer</button>
      {b.id && <><div style={{ height: 10 }} /><button className="btn rouge" onClick={delB}>Retirer</button></>}
    </>}</Feuille>
  </>);
}

export { Clients, Arrivage, Parametres };
