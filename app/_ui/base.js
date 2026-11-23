'use client';
import { useEffect, useState, useCallback } from 'react';
import { Icone } from './icones';
async function api(action, body = {}) {
  const r = await fetch('/api/' + action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({ ok: false, erreur: 'Pas de connexion internet.' }));
  if (!j.ok) { const e = new Error(j.erreur || 'Erreur'); e.status = r.status; e.couleurs = j.couleurs; throw e; }
  return j;
}
const money = (n, d) => (Math.round(Number(n || 0) * 100) / 100).toLocaleString('fr-FR') + ' ' + (d || '$');
const unite = (n, u) => `${n} ${u && Math.abs(n) > 1 && !/[sx]$|^kg$|^g$|^l$/i.test(u) ? u + 's' : u || ''}`.trim();
const RAYONS = ['Tous', 'Femme', 'Homme', 'Enfant'];
// Couleurs choisies par My automation pour chaque client (gardées sur le téléphone pour l'écran de connexion)
function appliquerCouleurs(c) {
  if (typeof document === 'undefined') return;
  try { if (c?.couleur) localStorage.setItem('ma_couleurs', JSON.stringify(c)); else c = JSON.parse(localStorage.getItem('ma_couleurs') || 'null'); } catch {}
  if (!c?.couleur) return;
  const r = document.documentElement.style;
  r.setProperty('--bleu', c.couleur); r.setProperty('--bleu2', c.couleur2 || c.couleur);
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', c.couleur);
}

function Bar({ titre, retour, droite }) {
  return <div className="bar">{retour ? <button onClick={retour} aria-label="Retour"><Icone n="retour" /></button> : <div className="logo">{String(titre || 'M').trim()[0]?.toUpperCase()}</div>}<h1>{titre}</h1>{droite}</div>;
}

function useArticles(notif) {
  const [list, setList] = useState(null);
  const load = useCallback(() => api('articles').then(j => setList(j.articles)).catch(e => notif(e.message, 1)), [notif]);
  useEffect(() => { load(); }, [load]);
  return [list, load];
}

function ChoixBoutique({ me, value, onChange }) {
  if (me.user.role === 'vendeur' && me.user.boutique_id) return null;
  return <div className="tabs">{me.boutiques.map(b => <button key={b.id} className={value === b.id ? 'on' : ''} onClick={() => onChange(b.id)}>{b.nom}</button>)}</div>;
}
const boutiqueDefaut = me => me.user.boutique_id || me.boutiques[0]?.id;

function Cherche({ value, onChange, placeholder }) {
  return <div className="cherche"><Icone n="recherche" t={20} /><input type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} /></div>;
}
function Vide({ Illus, titre, children }) {
  return <div className="empty">{Illus && <Illus />}<b>{titre}</b>{children && <span>{children}</span>}</div>;
}
export { Cherche, Vide };
export { unite };
export { api, money, RAYONS, appliquerCouleurs, Bar, useArticles, ChoixBoutique, boutiqueDefaut };
