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

// ---------- Messages WhatsApp prêts à envoyer (wa.me) ----------
const wa = (tel, texte) => `https://wa.me/${String(tel || '').replace(/\D/g, '')}?text=${encodeURIComponent(texte)}`;
const dateFr = d => d ? new Date(d + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
const MSG = {
  lienInstallation: (e, lien) => `Bonjour ${e.patron_nom || ''} 👋\n\nMerci de faire confiance à My automation 🙏\n\nVotre application ${e.nom} est prête à être activée.\n\n📄 Votre facture d'installation : ${e.frais_installation} $\n👉 ${lien}\n\nVous y trouverez les moyens de paiement (M-Pesa, Airtel Money, Orange Money…).\n\nDès que le paiement est confirmé, je vous envoie votre accès.\n\n— Mike, My automation`,
  formulaire: (url) => `Bonjour 👋\n\nMerci pour votre intérêt pour My automation 🙏\n\nPour préparer votre application, remplissez ce formulaire (5 minutes) :\n👉 ${url}/inscription\n\nVos boutiques, vos articles et vos clientes seront déjà dans l'app le jour de l'installation.\n\n— Mike, My automation`,
  acces: (e, pin, url, recu, vendeurs = []) => `Paiement reçu ✅ Merci ${e.patron_nom || ''} !\n${recu ? `🧾 Votre reçu : ${recu}\n` : ''}\nVotre application ${e.nom} est activée 🎉\n\n📲 Lien : ${url}\n🏢 Code entreprise : ${e.code}\n👤 Nom : ${e.patron_nom || ''}\n🔐 PIN : ${pin || '[votre PIN]'}\n\n${vendeurs.length ? `👥 Codes de vos vendeurs :\n${vendeurs.map(v => `• ${v.nom} : PIN ${v.pin}`).join('\n')}\n\n` : ''}Astuce : ouvrez le lien dans Chrome, puis menu ⋮ → « Ajouter à l'écran d'accueil ».\n\nAbonnement : ${e.montant_mensuel} $/mois.\nProchain paiement le ${dateFr(e.abonnement_fin)}.\n\n— Mike, My automation`,
  rappelMois: (e, lien) => `Bonjour ${e.patron_nom || ''} 👋\n\nVotre abonnement My automation se termine le ${dateFr(e.abonnement_fin)}.\n\nPour garder votre application active :\n📄 Facture : ${e.montant_mensuel} $\n👉 ${lien}\n\nVos données restent en sécurité.\n\n— Mike, My automation`,
  moisRecu: (e, recu) => `Paiement reçu ✅ Merci ${e.patron_nom || ''} !\n\nVotre abonnement My automation est prolongé jusqu'au ${dateFr(e.abonnement_fin)}.\n${recu ? `🧾 Votre reçu : ${recu}\n` : ''}\nBonnes ventes 💪\n\n— Mike, My automation`
};
const Envoyer = ({ tel, texte, children }) => <a className="btn sec" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 8 }} href={wa(tel, texte)} target="_blank" rel="noreferrer">{children}</a>;

function Paiement({ v, set }) {
  return (
    <>
      <label>Frais d'installation ($)</label>
      <div className="chips">{[10, 15, 20].map(n => <button type="button" key={n} className={Number(v.frais_installation) === n ? 'on' : ''} onClick={() => set({ frais_installation: n })}>{n} $</button>)}
        <input value={v.frais_installation} onChange={e => set({ frais_installation: e.target.value })} inputMode="decimal" style={{ width: 90 }} /></div>
      <label>Abonnement mensuel ($)</label><input value={v.montant_mensuel} onChange={e => set({ montant_mensuel: e.target.value })} inputMode="decimal" />
      <label>Lien Fondeka – installation</label><input value={v.lien_paiement_installation || ''} onChange={e => set({ lien_paiement_installation: e.target.value })} placeholder="https://…" inputMode="url" />
      <label>Lien Fondeka – abonnement mensuel</label><input value={v.lien_paiement_mensuel || ''} onChange={e => set({ lien_paiement_mensuel: e.target.value })} placeholder="https://…" inputMode="url" />
    </>
  );
}

const VIDE = { code: '', couleur: '#3b4fe4', couleur2: '#5667e7', abonnement_actif: true, abonnement_fin: '', frais_installation: 15, montant_mensuel: 10, lien_paiement_installation: '', lien_paiement_mensuel: '' };

export default function Admin() {
  const [cle, setCle] = useState('');
  const [f, setF] = useState({ code: '', nom: '', patron_nom: '', patron_pin: '', whatsapp: '', boutiques: 'Boutique 1', modules: ['stock', 'arrivage'], couleur: '#3b4fe4', couleur2: '#5667e7', abonnement_fin: '',
    frais_installation: 15, montant_mensuel: 10, lien_paiement_installation: '', lien_paiement_mensuel: '', installation_payee: false });
  const [m, setM] = useState(VIDE);
  const [ent, setEnt] = useState(null);        // client chargé (suivi du paiement)
  const [pin, setPin] = useState('');          // PIN à envoyer avec l'accès
  const [envoi, setEnvoi] = useState(null);    // message prêt après un paiement
  const [factures, setFactures] = useState({}); // { installation: id, mensuel: id } factures créées
  const [recu, setRecu] = useState('');         // lien du reçu après paiement
  const [pp, setPp] = useState({ nom: '', mpesa: '', airtel: '', orange: '', mtn: '', fondeka_install_10: '', fondeka_install_15: '', fondeka_install_20: '', fondeka_mensuel: '' }); const [msgP, setMsgP] = useState('');
  const [aVerifier, setAVerifier] = useState(null);
  const [inscr, setInscr] = useState(null);     // inscriptions reçues par le formulaire
  const [choix, setChoix] = useState({});       // { [id]: { code, pin, frais } }
  const [vendeursPins, setVendeursPins] = useState([]);
  const [msg, setMsg] = useState(''); const [msg2, setMsg2] = useState('');
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const tog = x => setF({ ...f, modules: f.modules.includes(x) ? f.modules.filter(y => y !== x) : [...f.modules, x] });
  const url = typeof window !== 'undefined' ? window.location.origin : '';
  const lienF = id => `${url}/payer/${id}`;
  const creerFacture = async type => {
    setMsg2('…');
    const j = await post('admin_facture_creer', { code: ent.code, type, admin_key: cle });
    if (!j.ok) return setMsg2('❌ ' + j.erreur);
    setFactures({ ...factures, [type]: j.facture_id });
    setMsg2(j.existante ? 'Facture déjà créée (non payée) : tu peux la renvoyer 👇' : '✅ Facture créée. Envoie-la 👇');
  };
  const chargerParam = async () => {
    setMsgP('…'); const j = await post('admin_parametres_lire', { admin_key: cle });
    if (!j.ok) return setMsgP('❌ ' + j.erreur);
    setPp({ nom: '', mpesa: '', airtel: '', orange: '', mtn: '', fondeka_install_10: '', fondeka_install_15: '', fondeka_install_20: '', fondeka_mensuel: '', ...j.paiement }); setMsgP('');
  };
  const sauverParam = async () => {
    setMsgP('…'); const j = await post('admin_parametres_ecrire', { ...pp, admin_key: cle });
    setMsgP(j.ok ? '✅ Moyens de paiement enregistrés.' : '❌ ' + j.erreur);
  };
  const suggCode = nom => (String(nom).normalize('NFD').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3) || 'CLI') + String(Math.floor(10 + Math.random() * 90));
  const chargerInscr = async () => {
    const j = await post('admin_inscriptions', { admin_key: cle });
    if (!j.ok) return setMsg('❌ ' + j.erreur);
    setInscr(j.inscriptions);
    const c = {}; j.inscriptions.forEach(x => { c[x.id] = { code: suggCode(x.donnees.entreprise), pin: String(Math.floor(1000 + Math.random() * 9000)), frais: 15 }; });
    setChoix(c);
  };
  const validerInscr = async x => {
    const c = choix[x.id]; setMsg('…');
    const j = await post('admin_inscription_valider', { id: x.id, code: c.code, pin: c.pin, frais_installation: c.frais, montant_mensuel: 10, admin_key: cle });
    if (!j.ok) return setMsg('❌ ' + j.erreur);
    setInscr(inscr.filter(y => y.id !== x.id));
    setPin(c.pin); setVendeursPins(j.vendeurs); setEnvoi(null); setFactures({}); setRecu('');
    afficher(j.entreprise); setM(mm => ({ ...mm, code: j.entreprise.code }));
    setMsg(`✅ ${j.entreprise.nom} créé : ${j.resume.boutiques} boutique(s), ${j.resume.articles} article(s), ${j.resume.clientes} cliente(s). Code ${j.entreprise.code} · PIN ${c.pin}`);
    setMsg2('Étape suivante : crée la facture d\'installation 👇');
  };
  const refuserInscr = async x => {
    if (!confirm('Supprimer cette inscription de la liste ?')) return;
    await post('admin_inscription_refuser', { id: x.id, admin_key: cle }); setInscr(inscr.filter(y => y.id !== x.id));
  };
  const verifier = async () => {
    const j = await post('admin_factures', { admin_key: cle });
    if (!j.ok) return setMsg2('❌ ' + j.erreur);
    setAVerifier(j.factures);
  };

  const afficher = (e) => {
    setEnt(e);
    setM({ code: e.code, couleur: e.couleur, couleur2: e.couleur2, abonnement_actif: e.abonnement_actif, abonnement_fin: e.abonnement_fin || '',
      frais_installation: e.frais_installation, montant_mensuel: e.montant_mensuel, lien_paiement_installation: e.lien_paiement_installation || '', lien_paiement_mensuel: e.lien_paiement_mensuel || '' });
  };

  const creer = async e => {
    e.preventDefault(); setMsg('…');
    const j = await post('admin_creer', { ...f, admin_key: cle });
    if (!j.ok) return setMsg('❌ ' + j.erreur);
    setMsg(`✅ Entreprise créée. Code : ${j.code} · Responsable : ${f.patron_nom} · PIN : ${f.patron_pin}`);
    setPin(f.patron_pin); setEnvoi(null); setFactures({}); setRecu(''); afficher(j.entreprise);
    setMsg2(j.entreprise.installation_payee ? 'Installation déjà payée : envoie l\'accès ci-dessous.' : 'Étape suivante : envoie le lien de paiement ci-dessous 👇');
  };
  const charger = async (codeForce) => {
    const code = typeof codeForce === 'string' ? codeForce : m.code;
    setMsg2('…'); setEnvoi(null); setPin(''); setFactures({}); setRecu(''); setVendeursPins([]);
    const j = await post('admin_lire', { code, admin_key: cle });
    if (!j.ok) return setMsg2('❌ ' + j.erreur);
    afficher(j.entreprise); setMsg2('Client chargé : ' + j.entreprise.nom);
  };
  const modifier = async e => {
    e.preventDefault(); setMsg2('…');
    const j = await post('admin_modifier', { ...m, admin_key: cle });
    if (!j.ok) return setMsg2('❌ ' + j.erreur);
    afficher({ ...j.entreprise, patron_nom: ent?.patron_nom });
    setMsg2(`✅ ${j.entreprise.nom} : abonnement ${j.entreprise.abonnement_actif ? 'actif' : 'suspendu'}${j.entreprise.abonnement_fin ? ' jusqu\'au ' + j.entreprise.abonnement_fin : ''}, enregistré.`);
  };
  const paiement = async type => {
    if (type === 'installation' && pin && !/^\d{4,6}$/.test(pin)) return setMsg2('❌ PIN : 4 à 6 chiffres.');
    setMsg2('…');
    const j = await post('admin_paiement', { code: ent.code, type, pin: type === 'installation' ? pin : '', admin_key: cle });
    if (!j.ok) return setMsg2('❌ ' + j.erreur);
    afficher(j.entreprise); setEnvoi(type); setRecu(j.facture_id ? lienF(j.facture_id) : '');
    setFactures({ ...factures, [type]: undefined });
    setMsg2(type === 'installation' ? `✅ App activée jusqu'au ${j.entreprise.abonnement_fin}. Envoie l'accès 👇` : `✅ Prolongé jusqu'au ${j.entreprise.abonnement_fin}. Envoie la confirmation 👇`);
  };

  const statut = ent && (!ent.installation_payee ? { t: '⏳ Installation non payée – app bloquée', c: '#b45309' }
    : ent.abonnement_actif && (!ent.abonnement_fin || ent.abonnement_fin >= new Date(Date.now() + 2 * 3600e3).toISOString().slice(0, 10))
      ? { t: `✅ Actif${ent.abonnement_fin ? ' jusqu\'au ' + dateFr(ent.abonnement_fin) : ''}`, c: '#16a34a' } : { t: '⏸️ Abonnement expiré / suspendu', c: '#dc2626' });

  return (
    <div className="login">
      <div className="haut"><div className="marque"><div className="logo img"><img src="/logo.png" alt="" /></div>My automation</div><h1>Espace administrateur</h1><p>Créer un client, encaisser (Fondeka), envoyer l'accès, gérer l'abonnement.</p></div><div className="corps" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card"><label>Clé administrateur</label><input type="password" value={cle} onChange={e => setCle(e.target.value)} required /></div>


      <div className="card">
        <h2 style={{ marginBottom: 6 }}>📝 Formulaire d'inscription</h2>
        <Envoyer tel="" texte={MSG.formulaire(url)}>📤 Envoyer le formulaire à un prospect</Envoyer>
        <a href="/inscription" target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 6, textAlign: 'center' }}>👁️ Voir le formulaire</a>
        <button type="button" className="btn sec" style={{ marginTop: 10 }} onClick={chargerInscr}>Voir les nouvelles inscriptions</button>
        {inscr && (inscr.length === 0 ? <p style={{ marginTop: 10 }}>Aucune nouvelle inscription.</p> : inscr.map(x => { const d = x.donnees, c = choix[x.id] || {}; const setC = k => e => setChoix({ ...choix, [x.id]: { ...c, [k]: e.target ? e.target.value : e } }); return (
          <div key={x.id} style={{ marginTop: 12, padding: 12, borderRadius: 12, background: '#f3f6fb' }}>
            <b>{d.entreprise}</b>{d.activite ? ` · ${d.activite}` : ''}<br />
            👤 {d.responsable} · 📱 {d.whatsapp}<br />
            🏬 {d.boutiques.length} boutique(s) · 👥 {d.vendeurs.length} vendeur(s) · 📦 {d.articles.length} article(s) · 💬 {d.clientes.length} cliente(s)<br />
            Rapport : {d.rapport === 'les_deux' ? 'soir + semaine' : d.rapport}
            <label>Code de connexion</label><input value={c.code || ''} onChange={setC('code')} />
            <label>PIN du responsable</label><input value={c.pin || ''} onChange={setC('pin')} inputMode="numeric" maxLength={6} />
            <label>Frais d'installation</label>
            <div className="chips">{[10, 15, 20].map(n => <button type="button" key={n} className={Number(c.frais) === n ? 'on' : ''} onClick={() => setC('frais')(n)}>{n} $</button>)}</div>
            <button type="button" className="btn" style={{ marginTop: 10 }} onClick={() => validerInscr(x)}>✅ Créer ce client</button>
            <button type="button" className="btn rouge petit" style={{ marginTop: 8 }} onClick={() => refuserInscr(x)}>Retirer</button>
          </div>); }))}
        {inscr && msg && <p style={{ marginTop: 10, fontWeight: 700 }}>{msg}</p>}
        {vendeursPins.length > 0 && <p style={{ marginTop: 10 }}>👥 PIN vendeurs (envoyés avec l'accès) : {vendeursPins.map(v => `${v.nom} ${v.pin}`).join(' · ')}</p>}
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 6 }}>💰 Paiements à vérifier</h2>
        <button type="button" className="btn sec" onClick={verifier}>Voir les factures en attente</button>
        {aVerifier && (aVerifier.length === 0 ? <p style={{ marginTop: 10 }}>Rien à vérifier 👌</p> : aVerifier.map(x => (
          <div key={x.id} style={{ marginTop: 10, padding: 10, borderRadius: 12, background: x.statut === 'declaree' ? '#fff7ed' : '#f3f6fb' }}>
            <b>{x.nom}</b> · {Number(x.montant)} $ · {x.type === 'installation' ? 'Installation' : 'Mois'}<br />
            {x.statut === 'declaree' ? `⏳ Signalé payé via ${x.operateur}${x.telephone ? ' · ' + x.telephone : ''}${x.transaction ? ' · code ' + x.transaction : ''}` : 'En attente de paiement'}
            <button type="button" className="btn petit" style={{ marginTop: 8 }} onClick={() => { setM({ ...m, code: x.code }); charger(x.code); }}>Ouvrir {x.code}</button>
          </div>)))}
      </div>

      <form className="card" onSubmit={creer}>
        <h2 style={{ marginBottom: 6 }}>1. Nouveau client</h2>
        <label>Code de connexion (court, sans espace)</label><input value={f.code} onChange={set('code')} placeholder="ex : KAPA4" required />
        <label>Nom de l'entreprise</label><input value={f.nom} onChange={set('nom')} required />
        <label>Nom du responsable</label><input value={f.patron_nom} onChange={set('patron_nom')} required />
        <label>PIN du responsable (4 à 6 chiffres)</label><input value={f.patron_pin} onChange={set('patron_pin')} inputMode="numeric" maxLength={6} required />
        <label>WhatsApp du responsable</label><input value={f.whatsapp} onChange={set('whatsapp')} inputMode="tel" placeholder="ex : 0831710181" />
        <label>Boutiques (séparées par des virgules)</label><input value={f.boutiques} onChange={set('boutiques')} />
        <label>Modules</label><div className="chips">{[['stock', 'Gestion du stock'], ['arrivage', 'Nouvel arrivage']].map(([k, l]) => <button type="button" key={k} className={f.modules.includes(k) ? 'on' : ''} onClick={() => tog(k)}>{l}</button>)}</div>
        <Paiement v={f} set={x => setF({ ...f, ...x })} />
        <label>Installation</label>
        <div className="chips">{[[false, '⏳ Pas encore payée'], [true, '✅ Déjà payée']].map(([v, l]) => <button type="button" key={l} className={f.installation_payee === v ? 'on' : ''} onClick={() => setF({ ...f, installation_payee: v })}>{l}</button>)}</div>
        <Couleurs c1={f.couleur} c2={f.couleur2} onChange={(a, b) => setF({ ...f, couleur: a, couleur2: b })} />
        <div style={{ height: 14 }} /><button className="btn">Créer l'entreprise</button>
        {msg && <p style={{ marginTop: 12, fontWeight: 700 }}>{msg}</p>}
      </form>

      <div className="card">
        <h2 style={{ marginBottom: 6 }}>2. Paiement & accès</h2>
        <label>Code de l'entreprise</label>
        <div style={{ display: 'flex', gap: 8 }}><input value={m.code} onChange={e => setM({ ...m, code: e.target.value })} />
          <button type="button" className="btn sec" style={{ width: 120 }} onClick={charger}>Charger</button></div>
        {msg2 && <p style={{ marginTop: 12, fontWeight: 700 }}>{msg2}</p>}
        {ent && <>
          <p style={{ marginTop: 12, fontWeight: 800, color: statut.c }}>{ent.nom} · {statut.t}</p>
          <p style={{ marginTop: 4 }}>Installation {ent.frais_installation} $ · Abonnement {ent.montant_mensuel} $/mois</p>

          {!ent.installation_payee && <>
            {!factures.installation ? <button type="button" className="btn sec" style={{ marginTop: 10 }} onClick={() => creerFacture('installation')}>📄 Créer la facture d'installation ({ent.frais_installation} $)</button>
              : <><Envoyer tel={ent.whatsapp_patron} texte={MSG.lienInstallation(ent, lienF(factures.installation))}>📤 Envoyer la facture sur WhatsApp</Envoyer>
                <a href={lienF(factures.installation)} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 6, textAlign: 'center' }}>👁️ Voir la facture</a></>}
            <label>PIN à envoyer avec l'accès</label><input value={pin} onChange={e => setPin(e.target.value)} inputMode="numeric" maxLength={6} placeholder="Laisse vide pour garder le PIN actuel" />
            <button type="button" className="btn" style={{ marginTop: 10 }} onClick={() => paiement('installation')}>✅ Paiement installation reçu → activer l'app</button>
          </>}

          {(envoi === 'installation' || (ent.installation_payee && envoi !== 'mensuel')) && <Envoyer tel={ent.whatsapp_patron} texte={MSG.acces(ent, pin, url, envoi === 'installation' ? recu : '', vendeursPins)}>📤 Envoyer l'accès à l'app</Envoyer>}

          {ent.installation_payee && <>
            {!factures.mensuel ? <button type="button" className="btn sec" style={{ marginTop: 10 }} onClick={() => creerFacture('mensuel')}>📄 Créer la facture du mois ({ent.montant_mensuel} $)</button>
              : <Envoyer tel={ent.whatsapp_patron} texte={MSG.rappelMois(ent, lienF(factures.mensuel))}>📤 Envoyer la facture du mois</Envoyer>}
            <button type="button" className="btn" style={{ marginTop: 10 }} onClick={() => paiement('mensuel')}>✅ Mois payé → +30 jours</button>
            {envoi === 'mensuel' && <Envoyer tel={ent.whatsapp_patron} texte={MSG.moisRecu(ent, recu)}>📤 Envoyer la confirmation</Envoyer>}
          </>}
          {!ent.whatsapp_patron && <p style={{ marginTop: 8 }}>⚠️ Pas de WhatsApp enregistré : WhatsApp te demandera de choisir le contact.</p>}
        </>}
      </div>

      {ent && <form className="card" onSubmit={modifier}>
        <h2 style={{ marginBottom: 6 }}>3. Modifier {ent.nom}</h2>
        <Paiement v={m} set={x => setM({ ...m, ...x })} />
        <label>Abonnement</label>
        <div className="chips">{[[true, '✅ Actif'], [false, '⏸️ Suspendu']].map(([v, l]) => <button type="button" key={l} className={m.abonnement_actif === v ? 'on' : ''} onClick={() => setM({ ...m, abonnement_actif: v })}>{l}</button>)}</div>
        <label>Payé jusqu'au (vide = sans limite)</label><input type="date" value={m.abonnement_fin} onChange={e => setM({ ...m, abonnement_fin: e.target.value })} />
        <Couleurs c1={m.couleur} c2={m.couleur2} onChange={(a, b) => setM({ ...m, couleur: a, couleur2: b })} />
        <div style={{ height: 14 }} /><button className="btn">Enregistrer</button>
      </form>}

      <div className="card">
        <h2 style={{ marginBottom: 6 }}>⚙️ Mes moyens de paiement</h2>
        <p>Affichés sur toutes les factures. Laisse vide ce que tu n'utilises pas. Un lien Fondeka mis sur la fiche d'un client passe avant ces liens généraux.</p>
        <button type="button" className="btn sec" style={{ marginTop: 8 }} onClick={chargerParam}>Charger</button>
        <h2 style={{ margin: '14px 0 4px', fontSize: 15 }}>💳 Liens Fondeka (un par montant)</h2>
        {[['fondeka_install_10', 'Installation 10 $'], ['fondeka_install_15', 'Installation 15 $'], ['fondeka_install_20', 'Installation 20 $'], ['fondeka_mensuel', 'Abonnement mensuel 10 $']].map(([k, l]) =>
          <div key={k}><label>{l}</label><input value={pp[k]} onChange={e => setPp({ ...pp, [k]: e.target.value })} placeholder="https://pay.fondeka.com/p/…" inputMode="url" /></div>)}
        <h2 style={{ margin: '14px 0 4px', fontSize: 15 }}>📱 Mobile Money (facultatif)</h2>
        <label>Nom qui s'affiche quand on te paie (exactement comme sur la confirmation M-Pesa)</label><input value={pp.nom} onChange={e => setPp({ ...pp, nom: e.target.value })} placeholder="ex : Michée Tambwe (fondateur de My automation)" />
        {[['mpesa', 'M-Pesa'], ['airtel', 'Airtel Money'], ['orange', 'Orange Money'], ['mtn', 'MTN MoMo']].map(([k, l]) =>
          <div key={k}><label>Numéro {l}</label><input value={pp[k]} onChange={e => setPp({ ...pp, [k]: e.target.value })} inputMode="tel" /></div>)}
        <div style={{ height: 12 }} /><button type="button" className="btn" onClick={sauverParam}>Enregistrer</button>
        {msgP && <p style={{ marginTop: 10, fontWeight: 700 }}>{msgP}</p>}
      </div>
    </div></div>
  );
}
