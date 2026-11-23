// Illustrations My automation, dessinées pour l'app (aucune image reprise ailleurs).
// Couleurs : classes .ia (bleu), .id (bleu foncé), .il (bleu très clair), .iw (blanc), .io (orange), .iv (vert), .is (trait encre)
const S = { 'aria-hidden': true, focusable: 'false' };

export function Boutique({ className }) {
  return (
    <svg viewBox="0 0 260 170" className={className} {...S}>
      <ellipse className="il op" cx="130" cy="158" rx="118" ry="9" />
      <rect className="iw" x="34" y="52" width="150" height="104" rx="6" />
      <path className="is" d="M34 58a6 6 0 0 1 6-6h138a6 6 0 0 1 6 6v98H34z" fill="none" />
      <path className="id" d="M26 30h166l8 26H18z" />
      <path className="iw" d="M45 30l-7 26h16l5-26zM79 30l-3 26h16l1-26zM113 30v26h16l-1-26zM147 30l3 26h16l-5-26z" />
      <path className="io" d="M18 56h182v6a10 10 0 0 1-10 10h0a10 10 0 0 1-10-10 10 10 0 0 1-20 0 10 10 0 0 1-20 0 10 10 0 0 1-20 0 10 10 0 0 1-20 0 10 10 0 0 1-20 0 10 10 0 0 1-20 0 10 10 0 0 1-20 0 10 10 0 0 1-20 0 10 10 0 0 1-10 10h0a10 10 0 0 1-10-10z" />
      <rect className="il" x="48" y="86" width="64" height="48" rx="4" />
      <path className="is" d="M48 104h64M48 120h64" fill="none" />
      <rect className="ia" x="54" y="92" width="10" height="12" rx="2" /><rect className="io" x="68" y="95" width="9" height="9" rx="2" /><rect className="id" x="82" y="90" width="12" height="14" rx="2" />
      <rect className="iv" x="56" y="109" width="14" height="11" rx="2" /><rect className="ia" x="76" y="108" width="9" height="12" rx="2" /><rect className="io" x="90" y="111" width="14" height="9" rx="2" />
      <rect className="id" x="126" y="86" width="44" height="70" rx="4" />
      <circle className="iw" cx="162" cy="122" r="2.5" />
      {/* téléphone avec la courbe des ventes */}
      <g transform="translate(192 60)">
        <rect className="is-f" x="0" y="0" width="52" height="94" rx="10" />
        <rect className="iw" x="4" y="7" width="44" height="80" rx="6" />
        <rect className="ia" x="4" y="7" width="44" height="26" rx="6" />
        <rect className="ia" x="4" y="24" width="44" height="9" />
        <rect className="iw" x="9" y="13" width="20" height="4" rx="2" opacity=".85" />
        <rect className="iw" x="9" y="20" width="28" height="7" rx="3" />
        <rect className="il" x="10" y="62" width="6" height="18" rx="2" /><rect className="il" x="19" y="54" width="6" height="26" rx="2" /><rect className="ia" x="28" y="44" width="6" height="36" rx="2" /><rect className="il" x="37" y="58" width="6" height="22" rx="2" />
        <circle className="iv" cx="44" cy="40" r="9" /><path className="iw-s" d="M40 40l3 3 5-6" fill="none" />
      </g>
    </svg>
  );
}

export function Caisse({ className }) {
  return (
    <svg viewBox="0 0 130 104" className={className} {...S}>
      <ellipse className="iw op2" cx="68" cy="98" rx="56" ry="5" />
      <path className="iw" d="M44 10h40v34H44z" />
      <path className="ia-s" d="M52 20h24M52 28h18M52 36h22" fill="none" />
      <path className="iw" d="M44 10l5-4 5 4 5-4 5 4 5-4 5 4 5-4 5 4" />
      <rect className="iw" x="18" y="44" width="96" height="48" rx="9" />
      <rect className="il" x="26" y="52" width="40" height="16" rx="4" />
      <rect className="ia" x="30" y="56" width="22" height="8" rx="2" />
      {[0, 1, 2].map(r => [0, 1, 2].map(c => <rect key={r + '' + c} className="il" x={74 + c * 12} y={52 + r * 11} width="9" height="8" rx="2" />))}
      <rect className="id" x="26" y="76" width="40" height="8" rx="3" />
      <circle className="io" cx="112" cy="30" r="11" /><circle className="iw-s" cx="112" cy="30" r="6" fill="none" />
      <circle className="io" cx="102" cy="16" r="7" opacity=".8" />
    </svg>
  );
}

export function Cartons({ className }) {
  return (
    <svg viewBox="0 0 200 130" className={className} {...S}>
      <ellipse className="il op" cx="100" cy="120" rx="80" ry="7" />
      <path className="ia" d="M30 62l44-14 44 14v52l-44 8-44-8z" />
      <path className="id" d="M74 48v74l44-8V62z" />
      <path className="iw op3" d="M30 62l44 12 44-12-44-14z" />
      <path className="iw" d="M52 55l44 13v12l-8 3V71L44 58z" opacity=".55" />
      <path className="io" d="M112 40l34-9 30 10v38l-30 6-34-7z" />
      <path className="iw op3" d="M112 40l34 9 30-8-30-10z" />
      <path className="io-d" d="M146 49v36l30-6V41z" />
      <circle className="iv" cx="160" cy="20" r="12" /><path className="iw-s" d="M154 20l4 4 8-8" fill="none" />
    </svg>
  );
}

export function Annonce({ className }) {
  return (
    <svg viewBox="0 0 200 130" className={className} {...S}>
      <ellipse className="il op" cx="96" cy="121" rx="78" ry="6" />
      <path className="ia" d="M30 58h22l52-30v78L52 76H30a8 8 0 0 1-8-8V66a8 8 0 0 1 8-8z" />
      <path className="id" d="M40 76h14l6 30a6 6 0 0 1-6 7h-4a6 6 0 0 1-6-5z" />
      <rect className="id" x="102" y="24" width="10" height="86" rx="5" />
      <g className="vague"><path className="ia-s" d="M124 54a20 20 0 0 1 0 28M134 44a34 34 0 0 1 0 48" fill="none" /></g>
      <g transform="translate(140 6)">
        <path className="iv" d="M10 0h40a10 10 0 0 1 10 10v20a10 10 0 0 1-10 10H22l-12 9v-9a10 10 0 0 1-10-10V10A10 10 0 0 1 10 0z" />
        <path className="iw" d="M12 13h32M12 22h22" strokeWidth="4" strokeLinecap="round" stroke="#fff" fill="none" />
      </g>
      <g transform="translate(150 66)">
        <path className="iw" d="M8 0h30a8 8 0 0 1 8 8v14a8 8 0 0 1-8 8H18l-10 7v-7a8 8 0 0 1-8-8V8a8 8 0 0 1 8-8z" stroke="var(--ligne)" />
        <circle className="ia" cx="14" cy="15" r="3" /><circle className="ia" cx="23" cy="15" r="3" /><circle className="ia" cx="32" cy="15" r="3" />
      </g>
    </svg>
  );
}

export function Personnes({ className }) {
  return (
    <svg viewBox="0 0 200 130" className={className} {...S}>
      <ellipse className="il op" cx="100" cy="121" rx="80" ry="6" />
      <circle className="il" cx="62" cy="46" r="16" /><path className="il" d="M30 116a32 32 0 0 1 64 0z" />
      <circle className="ia" cx="110" cy="40" r="20" /><path className="ia" d="M70 116a40 40 0 0 1 80 0z" />
      <circle className="io" cx="152" cy="52" r="14" /><path className="io" d="M126 116a26 26 0 0 1 52 0z" opacity=".85" />
      <g transform="translate(140 4)"><circle className="iv" cx="16" cy="16" r="16" /><path className="iw-s" d="M10 23l1.6-4.6A7 7 0 1 1 14 21.4z" fill="none" /></g>
    </svg>
  );
}

export function Pause({ className }) {
  return (
    <svg viewBox="0 0 200 130" className={className} {...S}>
      <ellipse className="il op" cx="100" cy="121" rx="70" ry="6" />
      <rect className="ia" x="56" y="50" width="88" height="66" rx="14" />
      <path className="id-s" d="M74 50V36a26 26 0 0 1 52 0v14" fill="none" strokeWidth="10" />
      <rect className="iw" x="88" y="70" width="8" height="26" rx="4" /><rect className="iw" x="104" y="70" width="8" height="26" rx="4" />
    </svg>
  );
}
