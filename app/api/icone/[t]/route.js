import { ImageResponse } from 'next/og';
export const runtime = 'edge';
// Icône de l'app générée à la volée (192 ou 512 px)
export function GET(_, { params }) {
  const t = params.t === '512' ? 512 : 192;
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#3b4fe4', color: '#fff', fontSize: t * 0.58, fontWeight: 800 }}>M</div>,
    { width: t, height: t, headers: { 'Cache-Control': 'public, max-age=604800, immutable' } });
}
