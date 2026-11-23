'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { api, money, RAYONS, appliquerCouleurs, Bar, useArticles, ChoixBoutique, boutiqueDefaut } from './_ui/base';
import { Login, Accueil, Mouvement, Stock } from './_ui/e1';
import { Articles, Rapport, Historique } from './_ui/e2';
import { Clients, Arrivage, Parametres } from './_ui/e3';
import { Animations, Ecran, Notification } from './_ui/anim';
export default function App() {
  const [me, setMe] = useState(null);
  const [etat, setEtat] = useState('chargement');
  const [vue, setVue] = useState('accueil');
  const [toast, setToast] = useState(null);
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
  if (etat === 'nodb') return <div className="login"><div className="head"><div className="logo img"><img src="/logo.png" alt="My automation" /></div><h1>My automation</h1><p className="muted">L'application est installée, mais la base de données n'est pas encore connectée.</p></div></div>;
  if (etat === 'suspendu') return <div className="login"><div className="head"><div className="logo img"><img src="/logo.png" alt="My automation" /></div><h1>Abonnement suspendu</h1>
    <p className="muted">Votre accès est en pause. Contactez My automation pour le réactiver : vos données sont conservées.</p></div>
    <button className="btn sec" onClick={async () => { await api('logout').catch(() => {}); setEtat('login'); }}>Changer de compte</button></div>;
  if (etat === 'login') return <Login onOk={charger} />;

  const P = { me, notif, retour, recharger: charger };
  const ecrans = { vente: <Mouvement {...P} type="vente" />, reception: <Mouvement {...P} type="reception" />, stock: <Stock {...P} />,
    articles: <Articles {...P} />, rapport: <Rapport {...P} />, historique: <Historique {...P} />, clients: <Clients {...P} />,
    arrivage: <Arrivage {...P} />, parametres: <Parametres {...P} /> };
  return (
    <Animations><div className="app">
      <Ecran id={vue} sens={vue === 'accueil' ? -1 : 1}>
        {vue === 'accueil' ? <Accueil {...P} ouvrir={ouvrir} onLogout={async () => { await api('logout'); setEtat('login'); }} /> : ecrans[vue]}
      </Ecran>
      <Notification toast={toast} />
    </div></Animations>
  );
}

