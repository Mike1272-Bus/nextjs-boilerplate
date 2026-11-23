// Jeu d'icônes au trait (24 px, trait 2), dessinées pour l'app
const P = {
  vente: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3zM9 8h6M9 12h6M9 16h3',
  reception: 'M3 8l9-5 9 5v8l-9 5-9-5V8zM3 8l9 5 9-5M12 13v8',
  stock: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  articles: 'M3 12V4h8l10 10-8 8L3 12zM7.5 7.5h.01',
  rapport: 'M4 4v16h16M8 15l3-4 3 2 5-6',
  historique: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2',
  clients: 'M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  arrivage: 'M3 10v4h3l6 5V5L6 10H3zM16 8.5a5 5 0 0 1 0 7M19 5.5a9 9 0 0 1 0 13',
  parametres: 'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M16 4v4M10 10v4M16 16v4',
  retour: 'M15 18l-6-6 6-6',
  sortir: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3',
  ok: 'M5 12.5l4.5 4.5L19 7.5',
  non: 'M12 8v5M12 16.5h.01',
  hausse: 'M7 17L17 7M9 7h8v8',
  baisse: 'M7 7l10 10M17 9v8H9',
  plus: 'M12 5v14M5 12h14',
  recherche: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  accueil: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9z',
  menu: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  chevron: 'M9 6l6 6-6 6',
  panier: 'M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2M10 21h.01M17 21h.01',
  crayon: 'M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4',
  whatsapp: 'M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20z'
};
export function Icone({ n, t = 22, className, style }) {
  return (
    <svg width={t} height={t} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={style}>
      <path d={P[n] || P.plus} />
    </svg>
  );
}
