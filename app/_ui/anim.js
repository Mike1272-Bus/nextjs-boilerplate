'use client';
import { useEffect, useRef, useState } from 'react';
import { m, AnimatePresence, LazyMotion, domAnimation, MotionConfig, animate, useReducedMotion } from 'motion/react';
import { Icone } from './icones';

const RESSORT = { type: 'spring', stiffness: 420, damping: 36, mass: .9 };

// Fournisseur : charge seulement les animations utiles (plus léger) et suit le réglage « réduire les animations » du téléphone
export function Animations({ children }) {
  return <LazyMotion features={domAnimation} strict><MotionConfig reducedMotion="user">{children}</MotionConfig></LazyMotion>;
}

// Changement d'écran : glisse légèrement, sans ralentir
export function Ecran({ id, sens = 1, children }) {
  return (
    <AnimatePresence mode="popLayout" initial={false} custom={sens}>
      <m.div key={id} custom={sens}
        variants={{ in: s => ({ opacity: 0, x: 28 * s }), on: { opacity: 1, x: 0 }, out: s => ({ opacity: 0, x: -20 * s }) }}
        initial="in" animate="on" exit="out" transition={{ duration: .22, ease: [.2, .7, .2, 1] }}>
        {children}
      </m.div>
    </AnimatePresence>
  );
}

// Fenêtre qui monte du bas ; on la ferme en touchant le fond ou en la tirant vers le bas
export function Feuille({ onClose, children }) {
  return (
    <AnimatePresence>
      {children && (
        <m.div key="fond" className="modal" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .2 }}>
          <m.div className="sheet" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={RESSORT}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: .6 }}
            onDragEnd={(_, i) => { if (i.offset.y > 110 || i.velocity.y > 600) onClose(); }}>
            {children}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

// Notification en bas de l'écran
export function Notification({ toast }) {
  return (
    <AnimatePresence>
      {toast && (
        <m.div key={toast.id} className={'toast' + (toast.err ? ' err' : '')} role="status"
          style={{ x: '-50%' }} initial={{ opacity: 0, y: 24, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16 }} transition={RESSORT}>
          <span className="pt"><Icone n={toast.err ? 'non' : 'ok'} t={16} /></span><span>{String(toast.msg).replace(/^✅\s*/, '')}</span>
        </m.div>
      )}
    </AnimatePresence>
  );
}

// Chiffre qui monte jusqu'à sa valeur (une seule fois, à l'ouverture)
export function Compteur({ valeur, format }) {
  const ref = useRef(null); const reduit = useReducedMotion(); const deja = useRef(false);
  const [txt] = useState(() => format(0));
  useEffect(() => {
    if (!ref.current) return;
    if (reduit || deja.current) { ref.current.textContent = format(valeur); return; }
    deja.current = true;
    const c = animate(0, valeur, { duration: .9, ease: [.16, 1, .3, 1], onUpdate: v => { if (ref.current) ref.current.textContent = format(v); } });
    return () => c.stop();
  }, [valeur, reduit, format]);
  return <span ref={ref}>{txt}</span>;
}

// Barres des 7 jours : elles poussent l'une après l'autre
export function Barres({ serie, aujourdhui }) {
  const max = Math.max(1, ...serie.map(x => x.total));
  const J = ['di', 'lu', 'ma', 'me', 'je', 've', 'sa'];
  return (
    <div className="barres" aria-label="Ventes des 7 derniers jours">
      {serie.map((x, i) => (
        <div key={x.date} className={'col' + (x.date === aujourdhui ? ' auj' : '')}>
          <m.div className="b" style={{ height: `${Math.max(5, (x.total / max) * 100)}%` }}
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: .15 + i * .06, ...RESSORT }} />
          <small>{x.date === aujourdhui ? 'auj.' : J[new Date(x.date + 'T12:00:00Z').getUTCDay()]}</small>
        </div>
      ))}
    </div>
  );
}

export { m, AnimatePresence };
