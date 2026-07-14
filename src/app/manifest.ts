import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Trading Signals',
    short_name: 'Signals',
    description: 'Phát tín hiệu giao dịch BTC/USDT, XAU/USD, EUR/USD',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0D1117',
    theme_color: '#0D1117',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
