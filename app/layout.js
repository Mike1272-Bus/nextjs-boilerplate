import './globals.css';
import './extra.css';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/figtree';

export const metadata = {
  title: 'My automation',
  description: 'Gérez votre stock, vos ventes et vos clients depuis votre téléphone.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'My automation', statusBarStyle: 'default' },
  icons: { icon: '/api/icone/192', apple: '/api/icone/192' }
};
export const viewport = { themeColor: '#0a3d91', width: 'device-width', initialScale: 1, maximumScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: "if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))}" }} />
      </body>
    </html>
  );
}
