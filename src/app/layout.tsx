import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { AntdThemeProvider } from '@/components/AntdThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Trading Signals',
  description: 'Phát tín hiệu giao dịch BTC/USDT, XAU/USD, EUR/USD',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <AntdRegistry>
          <AntdThemeProvider>
            {children}
          </AntdThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
