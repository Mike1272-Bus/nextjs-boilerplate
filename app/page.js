'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { api, money, RAYONS, appliquerCouleurs, Bar, useArticles, ChoixBoutique, boutiqueDefaut } from './_ui/base';
import { Login, Accueil, Mouvement, Stock, Raccourci, raccourcis } from './_ui/e1';
import { Icone } from './_ui/icones';
import { Pause } from './_ui/illus';
import { Feuille, m } from './_ui/anim';
import { Articles, Rapport, Historique } from './_ui/e2';
import { Clients, Arrivage, Parametres } from './_ui/e3';
import { Animations, Ecran, Notification } from './_ui/anim';
export default function App() {
  const [me, setMe] = useState(null);
  const [etat, setEtat] = useState('chargement');
  const [vue, setVue] = useState('accueil');
  const [toast, setToast] = useState(null);
  const [plus, setPlus] = useState(false);
  const minuterie = useRef(null);
  const notif = useCallback((msg, err) => {
    clearTimeout(minuterie.current); setToast({ msg, err, id: Date.now() });
    minuterie.current = setTimeout(() => setToast(null), err ? 4200 : 3000);
  }, []);
  // Bouton « retour » d'Android : revient à l'accueil au lieu de quitter l'app
  const ouvrir = useCallback(v => { setVue(v); try { history.pushState({ vue: v }, ''); } catch {} }, []);
  useEffect(() => { const f = () => setVue('accueil'); window.addEventListener('popstate', f); return () => window.removeEventListener('popstate', f); }, []);
  const retour = useCallback(() => { if (history.state?.vue) history.back(); else setVue('accueil'); }, []);

  const charger = useCallback(async () => {
    appliquerCouleurs(null);
    try { const j = await api('me'); appliquerCouleurs(j.entreprise); setMe(j); setEtat('ok'); }
    catch (e) { if (e.couleurs) appliquerCouleurs(e.couleurs); setEtat(e.status === 503 ? 'nodb' : e.status === 402 ? 'suspendu' : 'login'); }
  }, []);
  useEffect(() => { charger(); }, [charger]);

  if (etat === 'chargement') return <div className="app"><div className="page" style={{ paddingTop: 70 }} aria-busy="true"><div className="squelette" style={{ height: 210 }} /><div className="kpis"><div className="squelette" style={{ height: 76 }} /><div className="squelette" style={{ height: 76 }} /></div><div className="squelette" style={{ height: 76 }} /></div></div>;
  if (etat === 'nodb') return <div className="login"><div className="haut"><div className="marque"><div className="logo img"><img src="/logo.png" alt="" /></div>My automation</div><h1>Presque prêt</h1><p>L'application est installée, mais la base de données n'est pas encore connectée. My automation s'en occupe.</p></div></div>;
  if (etat === 'suspendu') return <div className="login"><div className="haut"><div className="marque"><div className="logo img"><img src="/logo.png" alt="" /></div>My automation</div><h1>Abonnement en pause</h1><p>Vos données sont conservées. Contactez My automation pour réactiver votre accès.</p></div>
    <div className="corps"><div className="card" style={{ paddingTop: 18 }}><div className="empty" style={{ padding: 6 }}><Pause /></div>
    <a className="btn" href="https://wa.me/243831710181">Contacter My automation</a><div style={{ height: 10 }} />
    <button className="btn sec" onClick={async () => { await api('logout').catch(() => {}); setEtat('login'); }}>Changer de compte</button></div></div></div>;
  if (etat === 'login') return <Login onOk={charger} />;

  const P = { me, notif, retour, recharger: charger };
  const ecrans = { vente: <Mouvement {...P} type="vente" />, reception: <Mouvement {...P} type="reception" />, stock: <Stock {...P} ouvrir={ouvrir} />,
    articles: <Articles {...P} />, rapport: <Rapport {...P} />, historique: <Historique {...P} />, clients: <Clients {...P} />,
    arrivage: <Arrivage {...P} />, parametres: <Parametres {...P} /> };
  return (
    <Animations><div className="app">
      <Ecran id={vue} sens={vue === 'accueil' ? -1 : 1}>
        {vue === 'accueil' ? <Accueil {...P} ouvrir={ouvrir} onLogout={async () => { await api('logout'); setEtat('login'); }} /> : ecrans[vue]}
      </Ecran>
      <Onglets me={me} vue={vue} ouvrir={v => v === vue ? null : v === 'accueil' ? retour() : ouvrir(v)} plus={() => setPlus(true)} />
      <Feuille onClose={() => setPlus(false)}>{plus && <>
        <h2>Plus</h2><p className="muted">{me.entreprise.nom} · {me.user.nom}</p><div style={{ height: 8 }} />
        <div className="liste" style={{ boxShadow: 'none', padding: 0 }}>{raccourcis(me).map(([id, ic, ti, s, ton]) => <Raccourci key={id} ic={ic} titre={ti} s={s} ton={ton} onClick={() => { setPlus(false); ouvrir(id); }} />)}</div>
        <div style={{ height: 12 }} /><button className="btn rouge" onClick={async () => { setPlus(false); await api('logout'); setEtat('login'); }}><Icone n="sortir" t={18} />Se déconnecter</button>
      </>}</Feuille>
      <Notification toast={toast} />
    </div></Animations>
  );
}


// Barre d'onglets du bas : la pastille glisse vers l'onglet touché
function Onglets({ me, vue, ouvrir, plus }) {
  const md = me.entreprise.modules || [];
  const o = [['accueil', 'accueil', 'Accueil']];
  if (md.includes('stock')) o.push(['vente', 'panier', 'Vendre'], ['stock', 'stock', 'Stock']);
  if (md.includes('arrivage')) o.push(['arrivage', 'arrivage', 'Arrivage']);
  const actif = o.some(x => x[0] === vue) ? vue : 'plus';
  return (
    <nav className="nav" aria-label="Navigation">
      {[...o, ['plus', 'menu', 'Plus']].map(([id, ic, l]) => (
        <button key={id} className={actif === id ? 'on' : ''} aria-current={actif === id ? 'page' : undefined} onClick={() => id === 'plus' ? plus() : ouvrir(id)}>
          <span className="ico">{actif === id && <m.span layoutId="pastille-nav" className="fondu" transition={{ type: 'spring', stiffness: 520, damping: 40 }} />}<Icone n={ic} t={22} /></span>{l}
        </button>))}
    </nav>
  );
}
